import { Download, RefreshCw, ArrowUpRight, Check } from 'lucide-react';
import type { Lang } from '../core';
import type { Updater } from '../updates';
import { updateText } from '../updateText';
export function UpdatePanel({
  updater: u,
  lang,
  onInstall,
  blocked,
}: {
  updater: Updater;
  lang: Lang;
  onInstall: () => void;
  blocked: boolean;
}) {
  const t = updateText[lang];
  const working = ['checking', 'downloading', 'installing'].includes(u.phase);
  const percent =
    u.progress.total && u.progress.total > 0
      ? Math.min(100, Math.round((u.progress.downloaded / u.progress.total) * 100))
      : undefined;
  const message = (
    {
      checking: t.checking,
      current: t.current,
      available: t.available,
      downloading: t.downloading,
      ready: t.ready,
      installing: t.installing,
    } as Record<string, string>
  )[u.phase];
  return (
    <section className="update-panel" aria-labelledby="update-title">
      <div className="update-heading">
        <h3 id="update-title">{t.title}</h3>
        <span>
          {t.installed} <strong>v{u.info.version}</strong>
          {u.info.revision && <small> · {u.info.revision}</small>}
        </span>
      </div>
      {!u.desktop ? (
        <p className="fineprint">{t.desktop}</p>
      ) : (
        <>
          <p className="fineprint">{t.privacy}</p>
          <div className="update-status" role="status" aria-live="polite">
            {message && (
              <p>
                {u.phase === 'ready' && <Check size={16} />} {message}
                {u.release && ` · v${u.release.version}`}
              </p>
            )}
            {u.error && (
              <p className="update-error">
                {t.errors[u.error as keyof typeof t.errors] || t.errors.fallback}
              </p>
            )}
          </div>
          {u.phase === 'downloading' && (
            <div className="update-progress">
              <progress aria-label={t.downloading} max={100} value={percent} />
              <span>
                {percent === undefined
                  ? `${(u.progress.downloaded / 1048576).toFixed(1)} MB`
                  : `${percent}%`}
              </span>
            </div>
          )}
          {u.release?.notes && (
            <details className="update-notes">
              <summary>{t.notes}</summary>
              <p>{u.release.notes}</p>
            </details>
          )}
          {u.release && !u.info.canInstall && <p className="fineprint">{t.manual}</p>}
          <div className="update-actions">
            {['idle', 'current'].includes(u.phase) && (
              <button
                className="secondary-button"
                onClick={() => void u.check()}
                disabled={blocked}
              >
                <RefreshCw size={15} />
                {t.check}
              </button>
            )}
            {u.phase === 'available' && u.info.canInstall && (
              <button
                className="primary-button"
                onClick={() => void u.download()}
                disabled={blocked}
              >
                <Download size={15} />
                {t.download}
              </button>
            )}
            {u.phase === 'ready' && (
              <button className="primary-button" onClick={onInstall} disabled={blocked}>
                {t.install}
              </button>
            )}
            {u.phase === 'error' && (
              <button
                className="primary-button"
                disabled={blocked}
                onClick={() =>
                  u.retry === 'install'
                    ? onInstall()
                    : void (u.retry === 'download' ? u.download() : u.check())
                }
              >
                {t.retry}
              </button>
            )}
            {!working && (
              <button className="text-button" onClick={() => void u.openDownloads()}>
                {t.official}
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
