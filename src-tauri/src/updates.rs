use crate::{atomic_write, library_path, read_limited, MAX_LIBRARY};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::Path,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::utils::{config::BundleType, platform::bundle_type};
use tauri::{async_runtime::Mutex, ipc::Channel, AppHandle, State};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_updater::{Update, UpdaterExt};

const RELEASES: &str = "https://github.com/mar33k13/DRGG/releases";
#[derive(Default)]
pub struct UpdateSession {
    update: Option<Update>,
    bytes: Option<Vec<u8>>,
}
pub type UpdateState = Mutex<UpdateSession>;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateInfo {
    version: String,
    revision: String,
    package: String,
    can_install: bool,
}

fn package_name() -> &'static str {
    match bundle_type() {
        Some(BundleType::App) => "app",
        Some(BundleType::AppImage) => "appimage",
        Some(BundleType::Nsis) => "nsis",
        Some(BundleType::Msi) => "msi",
        Some(BundleType::Deb) => "deb",
        Some(BundleType::Rpm) => "rpm",
        _ => "unknown",
    }
}
fn supports_install() -> bool {
    !cfg!(debug_assertions) && matches!(package_name(), "app" | "appimage" | "nsis" | "msi")
}

#[tauri::command]
pub fn update_info(app: AppHandle) -> AppUpdateInfo {
    AppUpdateInfo {
        version: app.package_info().version.to_string(),
        revision: env!("DRGG_BUILD_REVISION").into(),
        package: package_name().into(),
        can_install: supports_install(),
    }
}

#[derive(Serialize)]
pub struct AvailableUpdate {
    version: String,
    notes: String,
}

fn update_error(error: tauri_plugin_updater::Error) -> String {
    use tauri_plugin_updater::Error;
    match error {
        Error::ReleaseNotFound | Error::TargetNotFound(_) | Error::TargetsNotFound(_) => "channel",
        Error::Reqwest(_) | Error::Network(_) => "network",
        Error::Minisign(_)
        | Error::Base64(_)
        | Error::SignatureUtf8(_)
        | Error::SignedVersionMismatch { .. }
        | Error::MissingSignedVersion => "signature",
        _ => "update",
    }
    .into()
}

fn asset_allowed(url: &str, test_build: bool) -> bool {
    url.starts_with("https://github.com/mar33k13/DRGG/releases/download/")
        || (test_build && url.starts_with("http://127.0.0.1:18472/"))
}

#[tauri::command]
pub async fn check_update(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<Option<AvailableUpdate>, String> {
    let mut session = state.try_lock().map_err(|_| "busy")?;
    // A new check invalidates any previous download, even if the new request fails.
    *session = UpdateSession::default();
    let mut builder = app
        .updater_builder()
        .timeout(Duration::from_secs(30))
        .version_comparator(|current, release| {
            release.version > current && release.version.pre.is_empty()
        });
    // Package-managed and unknown Linux installs only check metadata; they never run an installer.
    if !supports_install() {
        if let Some(target) = tauri_plugin_updater::target() {
            builder = builder.target(target);
        }
    }
    let found = builder
        .build()
        .map_err(update_error)?
        .check()
        .await
        .map_err(update_error)?;
    match found {
        None => Ok(None),
        Some(mut update) => {
            if !asset_allowed(update.download_url.as_str(), cfg!(feature = "updater-e2e")) {
                return Err("source".into());
            }
            let result = AvailableUpdate {
                version: update.version.clone(),
                notes: update
                    .body
                    .as_deref()
                    .unwrap_or("")
                    .chars()
                    .take(12000)
                    .collect(),
            };
            update.timeout = Some(Duration::from_secs(300));
            session.update = Some(update);
            Ok(Some(result))
        }
    }
}

#[derive(Clone, Serialize)]
pub struct DownloadProgress {
    downloaded: u64,
    total: Option<u64>,
}

#[tauri::command]
pub async fn download_update(
    state: State<'_, UpdateState>,
    progress: Channel<DownloadProgress>,
) -> Result<(), String> {
    if !supports_install() {
        return Err("manual".into());
    }
    let mut session = state.try_lock().map_err(|_| "busy")?;
    session.bytes = None;
    let update = session.update.as_ref().ok_or("not-ready")?;
    let mut downloaded = 0u64;
    // The completion notification is deliberately not treated as verification success.
    let bytes = update
        .download(
            |chunk, total| {
                downloaded += chunk as u64;
                let _ = progress.send(DownloadProgress { downloaded, total });
            },
            || {},
        )
        .await
        .map_err(update_error)?;
    session.bytes = Some(bytes); // download() has verified both signature and signed version.
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ResumeChoice {
    pub concept_id: Option<String>,
    pub screen: String,
    pub step: u8,
}
impl ResumeChoice {
    fn validate(&self) -> Result<(), String> {
        if !matches!(self.screen.as_str(), "home" | "wizard" | "library")
            || self.step > 4
            || self
                .concept_id
                .as_ref()
                .is_some_and(|s| s.len() > 128 || s.chars().any(char::is_control))
        {
            return Err("storage".into());
        }
        Ok(())
    }
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateResume {
    from_version: String,
    to_version: String,
    choice: ResumeChoice,
}

fn backup_library(path: &Path, version: &str) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }
    let content = read_limited(path, MAX_LIBRARY).map_err(|_| "storage")?;
    let parsed: serde_json::Value = serde_json::from_str(&content).map_err(|_| "storage")?;
    if !matches!(parsed["version"].as_u64(), Some(1 | 2)) || !parsed["concepts"].is_array() {
        return Err("storage".into());
    }
    let time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "storage")?
        .as_nanos();
    let target = path
        .parent()
        .ok_or("storage")?
        .join("backups")
        .join(format!("library-before-{version}-{time}.json"));
    atomic_write(&target, &content).map_err(|_| "storage")?;
    if read_limited(&target, MAX_LIBRARY).map_err(|_| "storage")? != content {
        return Err("storage".into());
    }
    Ok(())
}

#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    state: State<'_, UpdateState>,
    choice: ResumeChoice,
) -> Result<(), String> {
    if !supports_install() {
        return Err("manual".into());
    }
    choice.validate()?;
    let session = state.try_lock().map_err(|_| "busy")?;
    let update = session.update.as_ref().ok_or("not-ready")?;
    let bytes = session.bytes.as_ref().ok_or("not-ready")?;
    update.verify(bytes).map_err(update_error)?;
    let library = library_path(&app).map_err(|_| "storage")?;
    backup_library(&library, &app.package_info().version.to_string())?;
    let resume = UpdateResume {
        from_version: app.package_info().version.to_string(),
        to_version: update.version.clone(),
        choice,
    };
    let resume_path = library
        .parent()
        .ok_or("storage")?
        .join("update-resume.json");
    atomic_write(
        &resume_path,
        &serde_json::to_string(&resume).map_err(|_| "storage")?,
    )
    .map_err(|_| "storage")?;
    // Windows exits inside install(); all durable writes must precede this call.
    if let Err(error) = update.install(bytes) {
        eprintln!("DRGG update installation failed: {error}");
        return Err("install".into());
    }
    app.restart();
}

#[tauri::command]
pub fn take_update_resume(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let path = library_path(&app)?
        .parent()
        .ok_or("storage")?
        .join("update-resume.json");
    if !path.exists() {
        return Ok(None);
    }
    let raw = read_limited(&path, 4096)?;
    let resume: UpdateResume = serde_json::from_str(&raw).map_err(|_| "storage")?;
    resume.choice.validate()?;
    let result = serde_json::json!({ "choice": resume.choice, "updated": resume.to_version == app.package_info().version.to_string(), "version": app.package_info().version.to_string() });
    fs::remove_file(&path).map_err(|_| "storage")?;
    Ok(Some(result))
}

#[tauri::command]
pub async fn open_update_download(
    app: AppHandle,
    state: State<'_, UpdateState>,
) -> Result<(), String> {
    let session = state.try_lock().map_err(|_| "busy")?;
    let url = session
        .update
        .as_ref()
        .and_then(|update| {
            let version = &update.version;
            let name = match package_name() {
                "deb" => format!("DRGG_{version}_amd64.deb"),
                "rpm" => format!("DRGG-{version}-1.x86_64.rpm"),
                _ => return None,
            };
            Some(format!("{RELEASES}/download/v{version}/{name}"))
        })
        .unwrap_or_else(|| RELEASES.into());
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|_| "open".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn backup_preserves_exact_bytes_and_refuses_unreadable_formats() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("library.json");
        let valid = "{\"version\":2,\"concepts\":[]}\n";
        atomic_write(&path, valid).unwrap();
        backup_library(&path, "0.2.0").unwrap();
        let backup = fs::read_dir(dir.path().join("backups"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        assert_eq!(fs::read_to_string(backup).unwrap(), valid);
        assert_eq!(fs::read_to_string(&path).unwrap(), valid);
        atomic_write(&path, "{\"version\":999}").unwrap();
        assert!(backup_library(&path, "0.2.0").is_err());
        assert_eq!(fs::read_dir(dir.path().join("backups")).unwrap().count(), 1);
    }
    #[test]
    fn download_source_is_repo_scoped_and_local_test_is_opt_in() {
        assert!(asset_allowed(
            "https://github.com/mar33k13/DRGG/releases/download/v0.2.0/app",
            false
        ));
        for bad in [
            "https://github.com/other/DRGG/releases/download/v2/app",
            "https://github.com.evil/mar33k13/DRGG/releases/download/v2/app",
            "http://127.0.0.1:18472/update",
        ] {
            assert!(!asset_allowed(bad, false));
        }
        assert!(asset_allowed("http://127.0.0.1:18472/update", true));
    }
    #[test]
    fn resume_rejects_invalid_navigation() {
        assert!(ResumeChoice {
            concept_id: Some("idea".into()),
            screen: "wizard".into(),
            step: 4
        }
        .validate()
        .is_ok());
        assert!(ResumeChoice {
            concept_id: None,
            screen: "wizard".into(),
            step: 5
        }
        .validate()
        .is_err());
    }
}
