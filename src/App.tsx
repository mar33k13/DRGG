import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Shuffle,
  LockKeyhole,
  LockKeyholeOpen,
  Library,
  Plus,
  Home,
  Layers3,
  SlidersHorizontal,
  Cpu,
  Orbit,
  Check,
  Download,
  Upload,
  Copy,
  Trash2,
  Save,
  X,
  Info,
  TriangleAlert,
  Gamepad2,
  Radio,
  ScanLine,
  CirclePause,
  CirclePlay,
  UserRound,
  Handshake,
  Sparkles,
} from 'lucide-react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import licenseText from '../LICENSE?raw';
import dependencyNotices from './data/third-party-notices.txt?raw';
import {
  catalog,
  defaultPriorities,
  evaluate,
  exportConcept,
  fields,
  generate,
  label,
  makeConcept,
  parseImport,
  priorityKeys,
  rebalance,
  type Concept,
  type Field,
  type Lang,
  type RandomMode,
} from './core';
import { loadLibrary, openImport, saveExport, saveLibrary } from './storage';
import { translations } from './i18n';
import { choiceDetails } from './choiceDetails';
import { useMotion } from './useMotion';
import { ChoiceCard } from './ui/ChoiceCard';
import { SectionHeading } from './ui/SectionHeading';
import { AboutIdentity } from './ui/AboutIdentity';
import { UpdatePanel } from './ui/UpdatePanel';
import { useUpdates, type UpdateResume } from './updates';
import { updateText } from './updateText';
import { aiAreas, developmentModes, developmentText } from './development';
type Screen = 'home' | 'wizard' | 'library';
type Prompt = {
  title: string;
  body: string;
  confirm: string;
  action: () => void;
  saveAction?: () => void;
  saveLabel?: string;
};
const stepFields: Field[][] = [
  ['team', 'scope'],
  ['theme', 'genre', 'subgenre'],
  ['engine', 'platform', 'mode', 'dimension', 'perspective', 'style'],
];
const icons = [ScanLine, Orbit, Cpu, SlidersHorizontal, Layers3];
function initialLang(): Lang {
  try {
    return localStorage.getItem('drgg.lang') === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}
export default function App() {
  const updater = useUpdates();
  const resumeTaken = useRef(false);
  const installing = useRef(false);
  const { reducedMotion, reducedBySystem, toggleMotion } = useMotion();
  const [roll, setRoll] = useState({ id: 0, fields: [] as Field[] });
  const [savedId, setSavedId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>(initialLang),
    [screen, setScreen] = useState<Screen>('home'),
    [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Concept>(() => ({
    ...makeConcept(),
    locks: ['team', 'scope'],
  }));
  const [library, setLibrary] = useState<Concept[]>([]),
    [ready, setReady] = useState(false),
    [loadFailed, setLoadFailed] = useState(false),
    [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false),
    [toast, setToast] = useState(''),
    [prompt, setPrompt] = useState<Prompt | null>(null),
    [about, setAbout] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null),
    headingRef = useRef<HTMLHeadingElement>(null),
    modalRef = useRef<HTMLDivElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dt = developmentText[lang],
    t = translations[lang],
    report = evaluate(draft.config, draft.priorities, lang, draft.development);
  const recentConcepts = [...library]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 3);
  const stored = library.some((concept) => concept.id === draft.id);
  const saveState = !ready
    ? t.loading
    : loadFailed
      ? t.storageUnavailable
      : busy
        ? t.busy
        : !stored
          ? t.unsaved
          : dirty
            ? t.unsavedChanges
            : t.savedState;
  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 6500);
  };
  const readLibrary = async () => {
    setReady(false);
    setLoadFailed(false);
    try {
      const loaded = await loadLibrary();
      setLibrary(loaded);
      if (isTauri() && !resumeTaken.current) {
        resumeTaken.current = true;
        // Failure to recover navigation must never prevent opening the library.
        const resume = await invoke<UpdateResume | null>('take_update_resume').catch(() => null);
        if (resume) {
          const concept = loaded.find((c) => c.id === resume.choice.conceptId);
          if (concept) {
            setDraft(concept);
            setSavedId(concept.id);
            setStep(resume.choice.step);
          }
          setScreen(resume.choice.screen === 'wizard' && !concept ? 'home' : resume.choice.screen);
          notify(
            resume.updated
              ? `${updateText[lang].updated} ${resume.version}`
              : updateText[lang].interrupted,
          );
        }
      }
    } catch {
      setLoadFailed(true);
    } finally {
      setReady(true);
    }
  };
  useEffect(() => {
    void readLibrary();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('drgg.lang', lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    if (screen === 'wizard') headingRef.current?.focus();
  }, [step, screen]);
  useEffect(() => {
    if (prompt || about) {
      const previous = document.activeElement as HTMLElement | null;
      modalRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      return () => previous?.focus();
    }
  }, [prompt, about]);
  useEffect(() => {
    // Checking/downloading replaces the focused action. Keep keyboard focus in the dialog.
    if (about && !prompt && !modalRef.current?.contains(document.activeElement))
      modalRef.current?.querySelector<HTMLElement>('button:not(:disabled), summary')?.focus();
  }, [updater.phase, about, prompt]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    void getCurrentWindow()
      .onCloseRequested((e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        if (dirty) {
          e.preventDefault();
          setPrompt({
            title: t.discardTitle,
            body: t.discardBody,
            confirm: t.discard,
            action: () => {
              void getCurrentWindow().destroy();
            },
          });
        }
      })
      .then((fn) => {
        if (disposed) fn();
        else stop = fn;
      });
    return () => {
      disposed = true;
      stop?.();
    };
  }, [dirty, busy, lang]);
  useEffect(() => {
    if (reducedMotion || !roll.id) return;
    const animations: Animation[] = [];
    let index = 0;
    for (const field of roll.fields) {
      const element = wizardRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
      if (element)
        animations.push(
          element.animate(
            [
              { opacity: 0.55, transform: 'translateY(7px)', borderColor: '#f09a68' },
              {
                opacity: 1,
                transform: 'translateY(0)',
                borderColor: getComputedStyle(element).borderColor,
              },
            ],
            { duration: 360, delay: index++ * 30, easing: 'cubic-bezier(.2,.7,.2,1)' },
          ),
        );
    }
    return () => animations.forEach((animation) => animation.cancel());
  }, [roll, reducedMotion]);
  const update = (patch: Partial<Concept>) => {
    if (busy) return;
    setDraft((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
    setDirty(true);
    setSavedId(null);
  };
  const guarded = (action: () => void) => {
    if (busy) return;
    if (dirty && screen === 'wizard')
      setPrompt({
        title: t.discardTitle,
        body: t.discardBody,
        confirm: t.discard,
        action: () => {
          setDirty(false);
          action();
        },
      });
    else action();
  };
  const start = (random: boolean) =>
    guarded(() => {
      const c = {
        ...makeConcept(),
        development: structuredClone(draft.development),
        locks: ['team', 'scope'] as Field[],
      };
      setSavedId(null);
      if (random) c.config = generate(c.config, c.locks, 'coherent')!;
      setDraft(c);
      setDirty(false);
      setStep(0);
      setScreen('wizard');
    });
  const changeField = (key: Field, value: string) => {
    const config = { ...draft.config, [key]: value };
    if (draft.randomMode === 'free') {
      update({ config });
      return;
    }
    const next = generate(
      config,
      [...new Set([...draft.locks, key])],
      'coherent',
      Math.random,
      true,
    );
    if (!next) {
      notify(t.lockedConflict);
      return;
    }
    if (fields.some((k) => k !== key && next[k] !== draft.config[k])) notify(t.changed);
    update({ config: next });
  };
  const reroll = () => {
    const next = generate(draft.config, draft.locks, draft.randomMode);
    if (!next) {
      notify(t.lockedConflict);
      return;
    }
    setRoll((previous) => ({
      id: previous.id + 1,
      fields: fields.filter((k) => next[k] !== draft.config[k] && !draft.locks.includes(k)),
    }));
    update({ config: next });
  };
  const changeMode = (mode: RandomMode) => {
    if (mode === 'coherent') {
      const next = generate(draft.config, draft.locks, mode, Math.random, true);
      if (!next) {
        notify(t.lockedConflict);
        return;
      }
      update({ config: next, randomMode: mode });
    } else update({ randomMode: mode });
  };
  const persist = async (next: Concept[], success: string) => {
    if (!ready || loadFailed || busy) return false;
    setBusy(true);
    try {
      await saveLibrary(next);
      setLibrary(next);
      notify(success);
      return true;
    } catch {
      notify(t.error);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    const c = {
      ...draft,
      title:
        draft.title.trim() ||
        `${label('theme', draft.config.theme, lang)} / ${label('subgenre', draft.config.subgenre, lang)}`,
      updatedAt: new Date().toISOString(),
    };
    const next = library.some((x) => x.id === c.id)
      ? library.map((x) => (x.id === c.id ? c : x))
      : [c, ...library];
    if (await persist(next, t.saved)) {
      setDraft(c);
      setDirty(false);
      setSavedId(c.id);
      return c;
    }
    return null;
  };
  const performInstall = async (saveBefore: boolean) => {
    if (installing.current || busy || !ready || loadFailed) return;
    installing.current = true;
    const stored = saveBefore ? await save() : library.find((c) => c.id === draft.id);
    if (saveBefore && !stored) {
      installing.current = false;
      return;
    }
    setBusy(true);
    await updater.install({
      conceptId: stored?.id || null,
      screen: screen === 'wizard' && !stored ? 'home' : screen,
      step,
    });
    // A real native success restarts. On failure the user can continue or retry.
    setBusy(false);
    installing.current = false;
  };
  const askInstall = () => {
    const ut = updateText[lang];
    setPrompt({
      title: ut.confirmTitle,
      body: dirty ? ut.dirtyBody : ut.confirmBody,
      confirm: dirty ? ut.discard : ut.install,
      action: () => void performInstall(false),
      ...(dirty ? { saveLabel: ut.save, saveAction: () => void performInstall(true) } : {}),
    });
  };
  const importRaw = async (raw: string) => {
    let c: Concept;
    try {
      c = parseImport(raw);
    } catch {
      notify(t.invalidImport);
      return;
    }
    if (await persist([c, ...library], t.imported)) {
      setDraft(c);
      setDirty(false);
      setStep(4);
      setScreen('wizard');
    }
  };
  const importClick = () =>
    guarded(() => {
      if (isTauri())
        void openImport()
          .then((raw) => {
            if (raw) void importRaw(raw);
          })
          .catch(() => notify(t.error));
      else inputRef.current?.click();
    });
  const exportFile = async (format: 'json' | 'md' | 'txt') => {
    try {
      const filename = (draft.title || 'drgg-concept')
        .replace(/[^\p{L}\p{N}_-]+/gu, '-')
        .slice(0, 80);
      if (await saveExport(exportConcept(draft, format, lang), `${filename}.${format}`))
        notify(t.exported);
    } catch {
      notify(t.error);
    }
  };
  const focus = priorityKeys.reduce((a, b) => (draft.priorities[b] > draft.priorities[a] ? b : a));
  const openConcept = (c: Concept) =>
    guarded(() => {
      setDraft(structuredClone(c));
      setDirty(false);
      setStep(4);
      setScreen('wizard');
    });
  const trapModal = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !busy) {
      setPrompt(null);
      setAbout(false);
    }
    if (e.key === 'Tab') {
      const nodes = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), summary, [href]',
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  const renderField = (field: Field, index: number) => {
    const locked = draft.locks.includes(field);
    const cards = ['engine', 'genre', 'dimension'].includes(field);
    return (
      <div
        key={field}
        className={`field-card ui-panel ${locked ? 'is-locked' : ''} ${cards ? 'choice-field' : ''}`}
        data-field={field}
      >
        <div className="field-label">
          <label id={`label-${field}`} htmlFor={cards ? undefined : `field-${field}`}>
            <span className="micro">{String(index + 1).padStart(2, '0')}</span>
            {t.fieldNames[field]}
          </label>
          <div className="field-lock">
            <span className="lock-status">{locked ? t.locked : t.unlocked}</span>
            <button
              className="icon-button lock"
              disabled={busy}
              title={`${locked ? t.unlock : t.lock}: ${t.fieldNames[field]}`}
              aria-label={`${locked ? t.unlock : t.lock}: ${t.fieldNames[field]}`}
              aria-pressed={locked}
              onClick={() =>
                update({
                  locks: locked ? draft.locks.filter((k) => k !== field) : [...draft.locks, field],
                })
              }
            >
              {locked ? (
                <LockKeyhole key="locked" size={15} />
              ) : (
                <LockKeyholeOpen key="unlocked" size={15} />
              )}
            </button>
          </div>
        </div>
        {cards ? (
          <div
            className={`choice-grid choices-${field}`}
            role="group"
            aria-labelledby={`label-${field}`}
          >
            {catalog[field].map((o) => {
              const detail = choiceDetails[o.id as keyof typeof choiceDetails];
              const Icon = detail?.icon || Gamepad2;
              return (
                <ChoiceCard
                  key={o.id}
                  name={`choice-${field}`}
                  value={o.id}
                  label={o[lang]}
                  icon={Icon}
                  selected={draft.config[field] === o.id}
                  disabled={busy}
                  helpId={`help-${field}`}
                  onSelect={() => changeField(field, o.id)}
                />
              );
            })}
          </div>
        ) : (
          <select
            id={`field-${field}`}
            aria-label={t.fieldNames[field]}
            disabled={busy}
            value={draft.config[field]}
            onChange={(e) => changeField(field, e.target.value)}
          >
            {catalog[field].map((o) => (
              <option key={o.id} value={o.id}>
                {o[lang]}
              </option>
            ))}
          </select>
        )}
        {cards && (
          <p className="choice-help" id={`help-${field}`} aria-live="polite">
            {choiceDetails[draft.config[field] as keyof typeof choiceDetails]?.[lang]}
          </p>
        )}
      </div>
    );
  };
  const scopePanel = (
    <aside className="scope-panel ui-panel">
      <div className="panel-kicker">
        <Radio size={14} />
        {t.scopeReadout}
        <span className="status-dot" />
      </div>
      <div className={`complexity-meter level-${report.complexity}`}>
        <span>{t.complexity}</span>
        <strong key={report.complexity}>{t.levels[report.complexity]}</strong>
        <div className="meter-segments">
          {Array.from({ length: 15 }, (_, i) => (
            <i className={i < (report.complexity + 1) * 5 ? 'lit' : ''} key={i} />
          ))}
        </div>
      </div>
      <div className={`team-demand demand-${report.demand}`}>
        <span>{dt.demand}</span>
        <strong>{dt.demandLevels[report.demand]}</strong>
      </div>
      <dl>
        <div>
          <dt>{t.teamEstimate}</dt>
          <dd>{report.team}</dd>
        </div>
        <div>
          <dt>{t.actualTeam}</dt>
          <dd>{label('team', draft.config.team, lang)}</dd>
        </div>
        <div>
          <dt>{t.fieldNames.scope}</dt>
          <dd>{label('scope', draft.config.scope, lang)}</dd>
        </div>
      </dl>
      <details className="development-rules">
        <summary>{dt.guidance}</summary>
        <p>
          {dt.modes[draft.development.mode]} · {dt.workload}: {report.workScore} · {dt.capacity}:{' '}
          {report.teamCapacity}
        </p>
        <ul>
          {report.developmentReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
      <div className="scope-focus">
        <span className="eyebrow">{t.focus}</span>
        <strong>{t.priorities[focus]}</strong>
        <div className="mini-bars">
          {priorityKeys.map((k) => (
            <i key={k} style={{ height: `${10 + draft.priorities[k]}px` }} />
          ))}
        </div>
      </div>
      {report.warnings.map((w, i) => (
        <p key={i} className="warning">
          <TriangleAlert size={15} />
          {w}
        </p>
      ))}
      <p className="fineprint">{t.heuristic}</p>
    </aside>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          aria-label="DRGG"
          onClick={() => guarded(() => setScreen('home'))}
        >
          <img src="/mark.svg" alt="" />
          <span>
            DRGG<small>unReason</small>
          </span>
        </button>
        <div className="nav-label">{t.workspace}</div>
        <nav aria-label={t.workspace}>
          <button
            className={screen === 'home' ? 'active' : ''}
            onClick={() => guarded(() => setScreen('home'))}
          >
            <Home size={17} />
            {t.home}
          </button>
          <button onClick={() => start(false)}>
            <Plus size={17} />
            {t.newConcept}
          </button>
          <button
            className={screen === 'library' ? 'active' : ''}
            onClick={() => guarded(() => setScreen('library'))}
          >
            <Library size={17} />
            {t.library}
            <span className="nav-count">{library.length.toString().padStart(2, '0')}</span>
          </button>
        </nav>
        <div className="nav-divider" />
        <div className="nav-label">{t.build}</div>
        <ol className={`step-list ${screen !== 'wizard' ? 'muted' : ''}`}>
          {t.steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <li key={s}>
                <button
                  disabled={screen !== 'wizard'}
                  className={screen === 'wizard' && step === i ? 'current' : ''}
                  aria-current={screen === 'wizard' && step === i ? 'step' : undefined}
                  onClick={() => setStep(i)}
                >
                  <span className="step-number">
                    {screen === 'wizard' && i < step ? (
                      <Check size={12} />
                    ) : (
                      String(i + 1).padStart(2, '0')
                    )}
                  </span>
                  <span>{s}</span>
                  {screen === 'wizard' && step === i && <Icon size={14} />}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="sidebar-bottom">
          <button className="about-button" onClick={() => setAbout(true)}>
            <Info size={13} />
            {t.about}
          </button>
          <span className="version">
            v{updater.info.version} <span>GPLv3</span>
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span
            className="topbar-label"
            title={screen === 'wizard' ? draft.title.trim() || t.untitled : undefined}
          >
            <span className="cross" aria-hidden="true">
              ✳
            </span>
            <span className="active-context">
              {screen === 'wizard'
                ? draft.title.trim() || t.untitled
                : screen === 'home'
                  ? t.home
                  : t.library}
            </span>
          </span>
          <div className="topbar-right">
            <button
              className="motion-toggle icon-button"
              aria-pressed={reducedMotion}
              disabled={reducedBySystem}
              aria-label={lang === 'es' ? 'Reducir animaciones' : 'Reduce animations'}
              title={
                reducedBySystem
                  ? lang === 'es'
                    ? 'Movimiento reducido por el sistema'
                    : 'Reduced motion set by your system'
                  : lang === 'es'
                    ? 'Reducir animaciones'
                    : 'Reduce animations'
              }
              onClick={toggleMotion}
            >
              {reducedMotion ? <CirclePlay size={18} /> : <CirclePause size={18} />}
            </button>
            <div className="language-switch" aria-label="Language">
              <button aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
                ES
              </button>
              <span>/</span>
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                EN
              </button>
            </div>
            <button
              className="icon-button mobile-about"
              aria-label={t.about}
              onClick={() => setAbout(true)}
            >
              <Info size={17} />
            </button>
          </div>
        </header>
        <main>
          {loadFailed && (
            <div role="alert" className="error-banner">
              {t.loadError}
              <button onClick={() => void readLibrary()}>{t.retry}</button>
            </div>
          )}
          {screen === 'home' && (
            <div className="welcome-screen">
              <SectionHeading title={t.home} description={t.homeHint} />
              <div className="launch-grid">
                <button
                  className="launch-card primary-launch"
                  aria-label={t.manual}
                  onClick={() => start(false)}
                >
                  <div className="launch-top">
                    <Layers3 size={23} />
                  </div>
                  <h2>{t.manual}</h2>
                  <p>{t.manualDesc}</p>
                  <span className="launch-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </button>
                <button
                  className="launch-card random-launch"
                  aria-label={t.random}
                  onClick={() => start(true)}
                >
                  <div className="launch-top">
                    <Shuffle size={23} />
                  </div>
                  <h2>{t.random}</h2>
                  <p>{t.randomDesc}</p>
                  <span className="launch-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </button>
              </div>
              <section className="recent-section" aria-labelledby="recent-title">
                <div className="recent-heading">
                  <h2 id="recent-title">{t.recent}</h2>
                  <button className="text-button" onClick={() => setScreen('library')}>
                    {t.viewLibrary}
                    <ArrowRight size={15} />
                  </button>
                </div>
                {!ready ? (
                  <p className="fineprint">{t.loading}</p>
                ) : loadFailed ? null : recentConcepts.length ? (
                  <div className="recent-list">
                    {recentConcepts.map((c) => (
                      <button
                        className="recent-concept ui-panel"
                        key={c.id}
                        aria-label={`${t.open}: ${c.title || t.untitled}`}
                        onClick={() => openConcept(c)}
                      >
                        <span className="recent-icon" aria-hidden="true">
                          <Layers3 size={19} />
                        </span>
                        <span className="recent-copy">
                          <strong>{c.title || t.untitled}</strong>
                          <span>
                            {label('engine', c.config.engine, lang)} ·{' '}
                            {label('scope', c.config.scope, lang)}
                          </span>
                        </span>
                        <time dateTime={c.updatedAt}>
                          {new Date(c.updatedAt).toLocaleDateString(
                            lang === 'es' ? 'es-ES' : 'en-GB',
                            { day: '2-digit', month: 'short' },
                          )}
                        </time>
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="home-empty ui-panel">
                    <Library size={22} aria-hidden="true" />
                    <div>
                      <h3>{t.noConcepts}</h3>
                      <p>{t.recentHint}</p>
                    </div>
                    <button className="secondary-button" disabled={busy} onClick={importClick}>
                      <Upload size={15} />
                      {t.import}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
          {screen === 'wizard' && (
            <div ref={wizardRef} className={`wizard-screen ${step === 4 ? 'is-result' : ''}`}>
              <SectionHeading
                key={step}
                headingRef={headingRef}
                title={t.steps[step]}
                description={t.stepDescriptions[step]}
                actions={
                  <span className="step-progress">
                    {t.step} {step + 1} {t.of} {t.steps.length}
                  </span>
                }
              />
              <div className="wizard-layout">
                <section className="wizard-content">
                  <div className="generator-bar">
                    <span>
                      <Shuffle size={15} />
                      {t.generator}
                    </span>
                    <div className="mode-toggle">
                      <button
                        aria-pressed={draft.randomMode === 'coherent'}
                        onClick={() => changeMode('coherent')}
                      >
                        {t.coherent}
                      </button>
                      <button
                        aria-pressed={draft.randomMode === 'free'}
                        onClick={() => changeMode('free')}
                      >
                        {t.free}
                      </button>
                    </div>
                    <button className="reroll" onClick={reroll}>
                      <Shuffle key={roll.id} className={roll.id ? 'roll-icon' : ''} size={15} />
                      {t.reroll}
                    </button>
                  </div>
                  <p className="generator-hint">
                    {draft.randomMode === 'coherent' ? t.coherentHint : t.freeHint}
                  </p>
                  <div className="stage-panel" key={step}>
                    {step < 3 && (
                      <>
                        {step === 2 ? (
                          <div className="tool-groups">
                            {[
                              ['engine', 'platform', 'mode'],
                              ['dimension', 'perspective', 'style'],
                            ].map((group, index) => (
                              <section
                                className="field-group"
                                key={index}
                                aria-labelledby={`tool-group-${index}`}
                              >
                                <h2 className="group-title" id={`tool-group-${index}`}>
                                  {index === 0
                                    ? lang === 'es'
                                      ? 'Tecnología y juego'
                                      : 'Technology & gameplay'
                                    : lang === 'es'
                                      ? 'Presentación visual'
                                      : 'Visual direction'}
                                </h2>
                                <div className="field-grid">
                                  {group.map((field, i) =>
                                    renderField(field as Field, index * 3 + i),
                                  )}
                                </div>
                              </section>
                            ))}
                          </div>
                        ) : (
                          <div className={`field-grid ${step === 1 ? 'concept-fields' : ''}`}>
                            {stepFields[step].map((field, i) => renderField(field, i))}
                          </div>
                        )}
                        {step === 0 && (
                          <section
                            className="development-panel ui-panel"
                            aria-labelledby="development-title"
                          >
                            <h2 id="development-title">{dt.title}</h2>
                            <p className="panel-description">{dt.hint}</p>
                            <div className="development-options">
                              {developmentModes.map((mode, i) => (
                                <ChoiceCard
                                  key={mode}
                                  kind="button"
                                  name="development"
                                  value={mode}
                                  label={dt.modes[mode]}
                                  icon={[UserRound, Handshake, Sparkles][i]}
                                  selected={draft.development.mode === mode}
                                  disabled={busy}
                                  helpId="development-help"
                                  onSelect={() =>
                                    update({
                                      development: {
                                        mode,
                                        areas: mode === 'human' ? [] : [...draft.development.areas],
                                      },
                                    })
                                  }
                                />
                              ))}
                            </div>
                            <p className="choice-help" id="development-help" aria-live="polite">
                              {dt.descriptions[draft.development.mode]}
                            </p>
                            {draft.development.mode !== 'human' && (
                              <fieldset className="ai-areas">
                                <legend>{dt.areasTitle}</legend>
                                <div>
                                  {aiAreas.map((area) => (
                                    <label key={area}>
                                      <input
                                        type="checkbox"
                                        disabled={busy}
                                        checked={draft.development.areas.includes(area)}
                                        onChange={(e) =>
                                          update({
                                            development: {
                                              ...draft.development,
                                              areas: e.target.checked
                                                ? [...draft.development.areas, area]
                                                : draft.development.areas.filter((a) => a !== area),
                                            },
                                          })
                                        }
                                      />
                                      {dt.areas[area]}
                                    </label>
                                  ))}
                                </div>
                                {!draft.development.areas.length && <p>{dt.chooseAreas}</p>}
                              </fieldset>
                            )}
                          </section>
                        )}
                        {step === 0 && (
                          <div className="scope-tip">
                            <LockKeyhole size={18} />
                            <div>
                              <p>
                                {lang === 'es'
                                  ? 'El equipo y el objetivo empiezan bloqueados para que el azar respete tus límites.'
                                  : 'Your team and goal start locked so randomization respects your limits.'}
                              </p>
                            </div>
                          </div>
                        )}
                        {step === 1 && (
                          <div className="concept-preview">
                            <span className="eyebrow">{t.preview}</span>
                            <p>{report.description}</p>
                            <div className="signal-line" />
                          </div>
                        )}
                        {step === 2 && (
                          <p className="fineprint tool-note">
                            {draft.config.platform === 'console' ? t.consolesNote : t.catalogNote}
                          </p>
                        )}
                      </>
                    )}
                    {step === 3 && (
                      <div className="effort-panel ui-panel">
                        <div className="effort-header">
                          <span className="eyebrow">{t.budget}</span>
                          <strong>
                            100<small>/ 100</small>
                          </strong>
                        </div>
                        <div className="effort-stack" aria-hidden="true">
                          {priorityKeys.map((k) => (
                            <i
                              key={k}
                              className={`effort-${k}`}
                              style={{ width: `${draft.priorities[k]}%` }}
                            />
                          ))}
                        </div>
                        {priorityKeys.map((k, i) => (
                          <div className="priority-row" key={k}>
                            <div className="priority-label">
                              <label htmlFor={`priority-${k}`}>
                                <span className="micro">0{i + 1}</span>
                                {t.priorities[k]}
                              </label>
                              <output htmlFor={`priority-${k}`}>
                                {draft.priorities[k]}
                                <small>%</small>
                              </output>
                            </div>
                            <input
                              id={`priority-${k}`}
                              aria-label={t.priorities[k]}
                              disabled={busy}
                              type="range"
                              min="0"
                              max="100"
                              value={draft.priorities[k]}
                              style={{ '--fill': `${draft.priorities[k]}%` } as React.CSSProperties}
                              onChange={(e) =>
                                update({
                                  priorities: rebalance(
                                    draft.priorities,
                                    k,
                                    Number(e.target.value),
                                  ),
                                })
                              }
                            />
                            <p>{t.priorityDescriptions[k]}</p>
                          </div>
                        ))}
                        <p className="fineprint">{t.budgetHint}</p>
                        <button
                          className="text-button"
                          onClick={() => update({ priorities: { ...defaultPriorities } })}
                        >
                          {lang === 'es' ? 'Restablecer reparto' : 'Reset allocation'}
                        </button>
                      </div>
                    )}
                    {step === 4 && (
                      <div className="result-panel ui-panel">
                        <div
                          className={`concept-banner theme-${draft.config.theme}`}
                          aria-hidden="true"
                        >
                          <div className="banner-orbit" />
                          <span>CONCEPT / {label('theme', draft.config.theme, lang)}</span>
                          <span>
                            {label('engine', draft.config.engine, lang)} ·{' '}
                            {label('dimension', draft.config.dimension, lang)}
                          </span>
                        </div>
                        <label className="eyebrow" htmlFor="concept-title">
                          {t.title}
                        </label>
                        <input
                          className="title-input"
                          id="concept-title"
                          disabled={busy}
                          maxLength={120}
                          placeholder={t.titlePlaceholder}
                          value={draft.title}
                          onChange={(e) => update({ title: e.target.value })}
                        />
                        <p className="result-description">{report.description}</p>
                        <div className="development-summary">
                          <span>{dt.modes[draft.development.mode]}</span>
                          {draft.development.areas.map((area) => (
                            <span key={area}>{dt.areas[area]}</span>
                          ))}
                        </div>
                        <details className="result-specs">
                          <summary>
                            {lang === 'es' ? 'Ver todas las decisiones' : 'View all decisions'}
                          </summary>
                          <div className="result-tags">
                            {fields.map((k) => (
                              <span key={k} title={t.fieldNames[k]}>
                                {label(k, draft.config[k], lang)}
                              </span>
                            ))}
                          </div>
                        </details>
                        <div className="result-columns">
                          <div className="result-block">
                            <h2>
                              <Gamepad2 size={18} />
                              {t.prototype}
                            </h2>
                            <ol>
                              {report.mechanics.map((m, i) => (
                                <li key={m}>
                                  <span>0{i + 1}</span>
                                  {m}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="result-block cuts-block">
                            <h2>
                              <Layers3 size={17} />
                              {t.cuts}
                            </h2>
                            <ul>
                              {report.cuts.map((m) => (
                                <li key={m}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <details className="result-block result-reasons">
                          <summary>{t.why}</summary>
                          <ul>
                            {report.reasons.map((r) => (
                              <li key={r}>{r}</li>
                            ))}
                          </ul>
                        </details>
                        <label className="eyebrow" htmlFor="notes">
                          {t.notes}
                        </label>
                        <textarea
                          id="notes"
                          disabled={busy}
                          rows={3}
                          maxLength={2000}
                          value={draft.notes}
                          placeholder={t.notesPlaceholder}
                          onChange={(e) => update({ notes: e.target.value })}
                        />
                        <div className="export-row">
                          <span className="eyebrow">
                            <Download size={14} />
                            {t.export}
                          </span>
                          {(['md', 'json', 'txt'] as const).map((f) => (
                            <button
                              className="small-button"
                              key={f}
                              onClick={() => void exportFile(f)}
                            >
                              {f === 'md' ? 'Markdown' : f.toUpperCase()}
                              <ArrowUpRight size={12} />
                            </button>
                          ))}
                        </div>
                        <p className="fineprint">{t.exportHint}</p>
                      </div>
                    )}
                  </div>
                  <div className="wizard-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        step > 0 ? setStep(step - 1) : guarded(() => setScreen('home'))
                      }
                    >
                      <ArrowLeft size={16} />
                      {t.back}
                    </button>
                    <div className="step-dots" aria-hidden="true">
                      {t.steps.map((_, i) => (
                        <i className={step === i ? 'active' : ''} key={i} />
                      ))}
                    </div>
                    {step < 4 ? (
                      <button className="primary-button" onClick={() => setStep(step + 1)}>
                        {step === 3 ? t.finish : t.next}
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        className={`primary-button ${savedId === draft.id && !dirty ? 'save-success' : ''}`}
                        disabled={busy || !ready || loadFailed}
                        onClick={() => void save()}
                      >
                        {savedId === draft.id && !dirty ? <Check size={16} /> : <Save size={16} />}
                        {busy ? t.busy : savedId === draft.id && !dirty ? t.saved : t.save}
                      </button>
                    )}
                  </div>
                </section>
                {scopePanel}
              </div>
            </div>
          )}
          {screen === 'library' && (
            <div className="library-screen">
              <SectionHeading
                title={t.library}
                description={
                  <>
                    {loadFailed
                      ? t.storageUnavailable
                      : !ready
                        ? t.loading
                        : `${library.length} ${t.concepts}`}
                  </>
                }
                actions={
                  <button
                    className="secondary-button"
                    disabled={busy || !ready || loadFailed}
                    onClick={importClick}
                  >
                    <Upload size={16} />
                    {t.import}
                  </button>
                }
              />
              {!ready ? (
                <p>{t.loading}</p>
              ) : loadFailed ? null : library.length === 0 ? (
                <div className="empty-state">
                  <Library size={45} />
                  <h2>{t.noConcepts}</h2>
                  <p>{t.noConceptsDesc}</p>
                  <button className="primary-button" onClick={() => start(false)}>
                    <Plus size={16} />
                    {t.manual}
                  </button>
                </div>
              ) : (
                <div className="library-grid">
                  {library.map((c) => {
                    const r = evaluate(c.config, c.priorities, lang, c.development);
                    return (
                      <article className="saved-card ui-panel" key={c.id}>
                        <div className="saved-top">
                          <span className="eyebrow">{label('scope', c.config.scope, lang)}</span>
                          <span className={`complexity-pill level-${r.complexity}`}>
                            {t.levels[r.complexity]}
                          </span>
                        </div>
                        <h2>{c.title || t.untitled}</h2>
                        <p>
                          {label('genre', c.config.genre, lang)} ·{' '}
                          {label('subgenre', c.config.subgenre, lang)} ·{' '}
                          {label('mode', c.config.mode, lang)}
                        </p>
                        <div className="saved-tags">
                          <span>{label('engine', c.config.engine, lang)}</span>
                          <span>{label('theme', c.config.theme, lang)}</span>
                          <span>{label('dimension', c.config.dimension, lang)}</span>
                          <span>{dt.modes[c.development.mode]}</span>
                        </div>
                        <time dateTime={c.updatedAt}>
                          {new Date(c.updatedAt).toLocaleDateString(
                            lang === 'es' ? 'es-ES' : 'en-GB',
                            { day: '2-digit', month: 'short', year: 'numeric' },
                          )}
                        </time>
                        <div className="saved-actions">
                          <button
                            className="secondary-button open-concept"
                            onClick={() => openConcept(c)}
                          >
                            {t.open}
                            <ArrowUpRight size={15} />
                          </button>
                          <button
                            className="icon-button"
                            disabled={busy || loadFailed}
                            title={t.duplicate}
                            aria-label={`${t.duplicate}: ${c.title}`}
                            onClick={() => {
                              const now = new Date().toISOString();
                              void persist(
                                [
                                  {
                                    ...structuredClone(c),
                                    id: crypto.randomUUID(),
                                    title: `${c.title} (${t.copy})`.slice(0, 120),
                                    createdAt: now,
                                    updatedAt: now,
                                  },
                                  ...library,
                                ],
                                t.duplicated,
                              );
                            }}
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            className="icon-button"
                            disabled={busy || loadFailed}
                            title={t.delete}
                            aria-label={`${t.delete}: ${c.title}`}
                            onClick={() =>
                              setPrompt({
                                title: t.deleteTitle,
                                body: t.deleteBody,
                                confirm: t.confirm,
                                action: () => {
                                  void persist(
                                    library.filter((x) => x.id !== c.id),
                                    t.deleted,
                                  );
                                },
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
        <footer className="statusbar">
          <span>
            <span className="status-dot" />
            {t.allLocal}
          </span>
          {screen === 'wizard' && (
            <span
              className="save-state"
              aria-live="polite"
              data-state={loadFailed ? 'error' : stored && !dirty ? 'saved' : 'unsaved'}
            >
              {saveState}
            </span>
          )}
          <span className="footer-count">
            {loadFailed
              ? t.storageUnavailable
              : !ready
                ? t.loading
                : `${library.length} ${t.concepts}`}
          </span>
        </footer>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".json,application/json"
        aria-label={t.import}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (file.size > 2_000_000) {
            notify(t.invalidImport);
            return;
          }
          void file
            .text()
            .then(importRaw)
            .catch(() => notify(t.invalidImport));
        }}
      />
      {toast && (
        <div className="toast" role="status">
          {toast === t.saved ? <Check className="success-icon" size={18} /> : <Info size={17} />}
          <span>{toast}</span>
          <button aria-label={t.close} onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {(prompt || about) && (
        <div className="modal-backdrop">
          <div
            className="modal ui-panel"
            ref={modalRef}
            role={prompt ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-body"
            onKeyDown={trapModal}
          >
            <SectionHeading
              level={2}
              id="modal-title"
              descriptionId="modal-body"
              title={prompt?.title || t.about}
              description={prompt?.body || t.aboutText}
            />
            {about && !prompt && (
              <>
                <AboutIdentity lang={lang} />
                <UpdatePanel
                  updater={updater}
                  lang={lang}
                  onInstall={askInstall}
                  blocked={busy || !ready || loadFailed}
                />
                <p className="fineprint">{t.license}</p>
                <details className="license-details">
                  <summary>GPLv3</summary>
                  <pre>{licenseText}</pre>
                </details>
                <details className="license-details">
                  <summary>
                    {lang === 'es' ? 'Licencias de dependencias' : 'Dependency licenses'}
                  </summary>
                  <pre>{dependencyNotices}</pre>
                </details>
              </>
            )}
            <div className="modal-actions">
              {prompt ? (
                <>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => setPrompt(null)}
                  >
                    {t.cancel}
                  </button>
                  <button
                    className={prompt.saveAction ? 'secondary-button' : 'primary-button'}
                    disabled={busy}
                    onClick={() => {
                      const action = prompt.action;
                      setPrompt(null);
                      action();
                    }}
                  >
                    {prompt.confirm}
                  </button>
                  {prompt.saveAction && (
                    <button
                      className="primary-button"
                      disabled={busy}
                      onClick={() => {
                        const action = prompt.saveAction!;
                        setPrompt(null);
                        action();
                      }}
                    >
                      {prompt.saveLabel}
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => setAbout(false)}
                >
                  {t.close}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
