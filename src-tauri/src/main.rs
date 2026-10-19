#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, io::Write, path::{Path, PathBuf}};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
mod updates;

const MAX_IMPORT: u64 = 2_000_000;
const MAX_LIBRARY: u64 = 32_000_000;

fn library_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map(|p| p.join("library-v1.json")).map_err(|e| e.to_string())
}

fn read_limited(path: &Path, limit: u64) -> Result<String, String> {
    use std::io::Read;
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    if file.metadata().map_err(|e| e.to_string())?.len() > limit {
        return Err("File exceeds the size limit".into());
    }
    let mut content = String::new();
    file.take(limit + 1).read_to_string(&mut content).map_err(|e| e.to_string())?;
    if content.len() as u64 > limit { return Err("File exceeds the size limit".into()); }
    Ok(content)
}

fn atomic_write(path: &Path, contents: &str) -> Result<(), String> {
    let parent = path.parent().ok_or("Invalid destination")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    temporary.write_all(contents.as_bytes()).map_err(|e| e.to_string())?;
    temporary.as_file().sync_all().map_err(|e| e.to_string())?;
    temporary.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_library(app: AppHandle) -> Result<Option<String>, String> {
    let path = library_path(&app)?;
    match read_limited(&path, MAX_LIBRARY) {
        Ok(content) => Ok(Some(content)),
        Err(_) if !path.exists() => Ok(None),
        Err(error) => Err(error),
    }
}

fn write_library(path: &Path, contents: &str) -> Result<(), String> {
    if contents.len() as u64 > MAX_LIBRARY { return Err("Library exceeds the size limit".into()); }
    let data: serde_json::Value = serde_json::from_str(contents).map_err(|e| e.to_string())?;
    if !matches!(data["version"].as_u64(), Some(1 | 2)) || !data["concepts"].is_array() {
        return Err("Unsupported library format".into());
    }
    atomic_write(path, contents)
}

#[tauri::command]
fn save_library(app: AppHandle, contents: String) -> Result<(), String> {
    write_library(&library_path(&app)?, &contents)
}

// Paths never come from the renderer. Native dialogs grant access to a single file.
#[tauri::command]
async fn save_export(app: AppHandle, contents: String, filename: String) -> Result<bool, String> {
    if contents.len() as u64 > MAX_IMPORT { return Err("Export exceeds the size limit".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let name = Path::new(&filename).file_name().and_then(|p| p.to_str()).ok_or("Invalid filename")?;
        let extension = Path::new(name).extension().and_then(|p| p.to_str()).ok_or("Invalid extension")?;
        if !["json", "md", "txt"].contains(&extension) { return Err("Invalid extension".into()); }
        let chosen = app.dialog().file().set_file_name(name).add_filter("DRGG", &[extension]).blocking_save_file();
        if let Some(file) = chosen {
            let path = file.into_path().map_err(|e| e.to_string())?;
            atomic_write(&path, &contents)?;
            Ok(true)
        } else { Ok(false) }
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn import_concept(app: AppHandle) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let chosen = app.dialog().file().add_filter("DRGG concept", &["json"]).blocking_pick_file();
        chosen.map(|file| file.into_path().map_err(|e| e.to_string()).and_then(|p| read_limited(&p, MAX_IMPORT))).transpose()
    }).await.map_err(|e| e.to_string())?
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(updates::UpdateState::default())
        .setup(|app| {
            if cfg!(feature = "updater-e2e") && !app.config().identifier.ends_with(".update-test") {
                return Err("updater-e2e requires an isolated .update-test application identifier".into());
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![load_library, save_library, save_export, import_concept,
            updates::update_info, updates::check_update, updates::download_update,
            updates::install_update, updates::take_update_resume, updates::open_update_download])
        .run(tauri::generate_context!())
        .expect("DRGG could not start");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn persists_development_models_and_rejects_unknown_versions_without_overwriting() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("library.json");
        write_library(&path, r#"{"version":1,"concepts":[]}"#).unwrap();
        let current = r#"{"version":2,"concepts":[{"development":{"mode":"hybrid","areas":["code"]}}]}"#;
        write_library(&path, current).unwrap();
        assert_eq!(read_limited(&path, MAX_LIBRARY).unwrap(), current);
        assert!(write_library(&path, r#"{"version":3,"concepts":[]}"#).is_err());
        assert_eq!(read_limited(&path, MAX_LIBRARY).unwrap(), current);
    }
    #[test]
    fn atomic_replace_and_read_limits() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("library.json");
        atomic_write(&path, "first").unwrap();
        atomic_write(&path, "second").unwrap();
        assert_eq!(read_limited(&path, 6).unwrap(), "second");
        assert!(read_limited(&path, 5).is_err());
    }
}
