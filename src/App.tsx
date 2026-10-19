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
} from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
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
type Screen = 'home' | 'wizard' | 'library';
type Prompt = { title: string; body: string; confirm: string; action: () => void };
const stepFields: Field[][] = [
  ['team', 'scope'],
  ['theme', 'genre', 'subgenre'],
  ['engine', 'platform', 'dimension', 'perspective', 'style', 'mode'],
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
  const inputRef = useRef<HTMLInputElement>(null),
    headingRef = useRef<HTMLHeadingElement>(null),
    modalRef = useRef<HTMLDivElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = translations[lang],
    report = evaluate(draft.config, draft.priorities, lang);
  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 6500);
  };
  const readLibrary = async () => {
    setReady(false);
    setLoadFailed(false);
    try {
      setLibrary(await loadLibrary());
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
  const update = (patch: Partial<Concept>) => {
    if (busy) return;
    setDraft((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
    setDirty(true);
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
      const c = { ...makeConcept(), locks: ['team', 'scope'] as Field[] };
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
    }
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
    if (e.key === 'Escape') {
      setPrompt(null);
      setAbout(false);
    }
    if (e.key === 'Tab') {
      const nodes = modalRef.current?.querySelectorAll<HTMLElement>('button, summary, [href]');
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
    return (
      <div key={field} className={`field-card ${locked ? 'is-locked' : ''}`}>
        <div className="field-label">
          <label htmlFor={`field-${field}`}>
            <span className="micro">{String(index + 1).padStart(2, '0')}</span>
            {t.fieldNames[field]}
          </label>
          <button
            className="icon-button lock"
            title={`${locked ? t.unlock : t.lock}: ${t.fieldNames[field]}`}
            aria-label={`${locked ? t.unlock : t.lock}: ${t.fieldNames[field]}`}
            aria-pressed={locked}
            onClick={() =>
              update({
                locks: locked ? draft.locks.filter((k) => k !== field) : [...draft.locks, field],
              })
            }
          >
            {locked ? <LockKeyhole size={15} /> : <LockKeyholeOpen size={15} />}
          </button>
        </div>
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
        <div className="field-bottom">
          <span>{locked ? t.locked : t.unlocked}</span>
          <span className="tiny-cross">+</span>
        </div>
      </div>
    );
  };
  const ScopePanel = () => (
    <aside className="scope-panel">
      <div className="panel-kicker">
        <Radio size={14} />
        {t.scopeReadout}
        <span className="status-dot" />
      </div>
      <div className={`complexity-meter level-${report.complexity}`}>
        <span>{t.complexity}</span>
        <strong>{t.levels[report.complexity]}</strong>
        <div className="meter-segments">
          {Array.from({ length: 15 }, (_, i) => (
            <i className={i < (report.complexity + 1) * 5 ? 'lit' : ''} key={i} />
          ))}
        </div>
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
            DRGG<small>DEV RANDOM GAME GENERATOR</small>
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
            <span className="nav-shortcut">01</span>
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
          <div className="tiny-grid" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <span className="eyebrow">{t.openSource}</span>
          <p>
            MAKE SOMETHING
            <br />
            <strong>WORTH PLAYING.</strong>
          </p>
          <button className="about-button" onClick={() => setAbout(true)}>
            <Info size={13} />
            {t.about}
          </button>
          <span className="version">
            v0.1.0 <span>GPLv3</span>
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-label">
            <span className="cross">✳</span>
            {t.station}
            <span className="slash">/</span>
            <span className="topbar-section">
              {screen === 'home' ? t.home : screen === 'library' ? t.library : t.steps[step]}
            </span>
          </span>
          <div className="topbar-right">
            <span className="offline">
              <span className="status-dot" />
              {t.offline}
            </span>
            <div className="language-switch" aria-label="Language">
              <button aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
                ES
              </button>
              <span>/</span>
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                EN
              </button>
            </div>
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
              <div className="welcome-top">
                <span className="eyebrow">
                  <span className="status-dot" />
                  {t.welcome}
                </span>
                <span className="serial">RGG / 001 — ∞</span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <div className="tagline">{t.tagline}</div>
                  <h1>
                    {t.heroA}
                    <br />
                    <span>{t.heroB}</span>
                  </h1>
                  <p>{t.intro}</p>
                  <div className="hero-meta">
                    <span>01 IDEA</span>
                    <span>05—10 MIN</span>
                    <span>∞ POSSIBILITIES</span>
                  </div>
                </div>
                <div className="orbital-art" aria-hidden="true">
                  <div className="art-top">
                    <span>IDEA EXPLORER</span>
                    <ScanLine size={17} />
                  </div>
                  <div className="orbital-grid">
                    <div className="orbit-ring ring-a" />
                    <div className="orbit-ring ring-b" />
                    <div className="orbit-ring ring-c" />
                    <div className="planet-lines">
                      {Array.from({ length: 9 }, (_, i) => (
                        <i
                          key={i}
                          style={{ width: `${Math.sqrt(1 - ((i - 4) / 5) ** 2) * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="orbital-diamond" />
                    <span className="art-point point-a" />
                    <span className="art-point point-b" />
                    <span className="art-coordinate coordinate-a">
                      X: 024.8
                      <br />
                      Y: 108.2
                    </span>
                    <span className="art-coordinate coordinate-b">
                      SMALL SCOPE
                      <br />
                      BIG POTENTIAL
                    </span>
                  </div>
                  <div className="art-bottom">
                    <span className="status-dot" />
                    {t.systemReady}
                    <span>+ + +</span>
                  </div>
                </div>
              </section>
              <div className="launch-grid">
                <button className="launch-card primary-launch" onClick={() => start(false)}>
                  <div className="launch-top">
                    <span className="launch-index">01 / MANUAL</span>
                    <Layers3 size={23} />
                  </div>
                  <h2>{t.manual}</h2>
                  <p>{t.manualDesc}</p>
                  <span className="launch-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </button>
                <button className="launch-card random-launch" onClick={() => start(true)}>
                  <div className="launch-top">
                    <span className="launch-index">02 / RANDOM</span>
                    <Shuffle size={23} />
                  </div>
                  <h2>{t.random}</h2>
                  <p>{t.randomDesc}</p>
                  <span className="launch-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </button>
              </div>
              <div className="welcome-note">
                <Gamepad2 size={17} />
                <span>{t.localOnly}</span>
                <span className="note-end">{t.by}</span>
              </div>
            </div>
          )}
          {screen === 'wizard' && (
            <div className="wizard-screen">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    CONCEPT LAB{' '}
                    <span className="accent">/ {String(step + 1).padStart(2, '0')}</span>
                  </span>
                  <h1 ref={headingRef} tabIndex={-1}>
                    {t.steps[step]}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>{t.stepDescriptions[step]}</p>
                </div>
                <span className="page-number">
                  0{step + 1}
                  <small>/ 05</small>
                </span>
              </div>
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
                      <Shuffle size={15} />
                      {t.reroll}
                    </button>
                  </div>
                  <p className="generator-hint">
                    {draft.randomMode === 'coherent' ? t.coherentHint : t.freeHint}
                  </p>
                  {step < 3 && (
                    <>
                      <div className={`field-grid ${step === 1 ? 'concept-fields' : ''}`}>
                        {stepFields[step].map((field, i) => renderField(field, i))}
                      </div>
                      {step === 0 && (
                        <div className="scope-tip">
                          <Orbit size={34} />
                          <div>
                            <span className="eyebrow">START SMALL</span>
                            <p>
                              {lang === 'es'
                                ? 'Una mecánica que funcione vale más que diez a medias. El equipo y el objetivo empiezan bloqueados para que el azar respete tus límites.'
                                : 'One working mechanic beats ten unfinished ones. Your team and goal start locked so randomization respects your limits.'}
                            </p>
                          </div>
                        </div>
                      )}
                      {step === 1 && (
                        <div className="concept-preview">
                          <span className="eyebrow">CONCEPT SIGNAL</span>
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
                    <div className="effort-panel">
                      <div className="effort-header">
                        <span className="eyebrow">{t.budget}</span>
                        <strong>
                          100<small>/ 100</small>
                        </strong>
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
                                priorities: rebalance(draft.priorities, k, Number(e.target.value)),
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
                    <div className="result-panel">
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
                      <div className="result-tags">
                        {fields.map((k) => (
                          <span key={k} title={t.fieldNames[k]}>
                            {label(k, draft.config[k], lang)}
                          </span>
                        ))}
                      </div>
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
                      <div className="result-block">
                        <h2>{t.why}</h2>
                        <ul>
                          {report.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </div>
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
                        className="primary-button"
                        disabled={busy || !ready || loadFailed}
                        onClick={() => void save()}
                      >
                        <Save size={16} />
                        {busy ? t.busy : t.save}
                      </button>
                    )}
                  </div>
                </section>
                <ScopePanel />
              </div>
            </div>
          )}
          {screen === 'library' && (
            <div className="library-screen">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR IDEA ARCHIVE</span>
                  <h1>
                    {t.library}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>
                    {library.length.toString().padStart(2, '0')} {t.concepts}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  disabled={busy || !ready || loadFailed}
                  onClick={importClick}
                >
                  <Upload size={16} />
                  {t.import}
                </button>
              </div>
              {!ready ? (
                <p>{t.loading}</p>
              ) : library.length === 0 ? (
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
                    const r = evaluate(c.config, c.priorities, lang);
                    return (
                      <article className="saved-card" key={c.id}>
                        <div className="saved-top">
                          <span className="eyebrow">{label('scope', c.config.scope, lang)}</span>
                          <span className={`complexity-pill level-${r.complexity}`}>
                            {t.levels[r.complexity]}
                          </span>
                        </div>
                        <h2>{c.title || t.untitled}</h2>
                        <p>{r.description}</p>
                        <div className="saved-tags">
                          <span>{label('engine', c.config.engine, lang)}</span>
                          <span>{label('dimension', c.config.dimension, lang)}</span>
                        </div>
                        <time dateTime={c.updatedAt}>
                          {new Date(c.updatedAt).toLocaleDateString(
                            lang === 'es' ? 'es-ES' : 'en-GB',
                            { day: '2-digit', month: 'short', year: 'numeric' },
                          )}
                        </time>
                        <div className="saved-actions">
                          <button className="text-button" onClick={() => openConcept(c)}>
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
          <span>{dirty ? '● ' : ''}DRGG — v0.1.0</span>
          <span className="footer-count">
            {library.length.toString().padStart(2, '0')} / {t.concepts}
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
          <Info size={17} />
          <span>{toast}</span>
          <button aria-label={t.close} onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {(prompt || about) && (
        <div className="modal-backdrop">
          <div
            className="modal"
            ref={modalRef}
            role={prompt ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-body"
            onKeyDown={trapModal}
          >
            <h2 id="modal-title">{prompt?.title || t.about}</h2>
            <p id="modal-body">{prompt?.body || t.aboutText}</p>
            {about && (
              <>
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
                  <button className="secondary-button" onClick={() => setPrompt(null)}>
                    {t.cancel}
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      const action = prompt.action;
                      setPrompt(null);
                      action();
                    }}
                  >
                    {prompt.confirm}
                  </button>
                </>
              ) : (
                <button className="primary-button" onClick={() => setAbout(false)}>
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
