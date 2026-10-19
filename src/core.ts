import catalogData from './data/catalog.json';
import mechanicsData from './data/mechanics.json';
import { translations } from './i18n';
export type Lang = 'es' | 'en';
export type Field = keyof typeof catalogData;
export type Option = {
  id: string;
  es: string;
  en: string;
  genres?: string[];
  platforms?: string[];
  dimensions?: string[];
};
export const catalog = catalogData as Record<Field, Option[]>;
export const fields = Object.keys(catalog) as Field[];
export const priorityKeys = ['mechanics', 'physics', 'graphics', 'narrative', 'audio'] as const;
export type Priority = (typeof priorityKeys)[number];
export type Priorities = Record<Priority, number>;
export type Config = Record<Field, string>;
export type RandomMode = 'coherent' | 'free';
export type Concept = {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  config: Config;
  priorities: Priorities;
  locks: Field[];
  randomMode: RandomMode;
};
export const defaultConfig: Config = {
  theme: 'space',
  genre: 'adventure',
  subgenre: 'exploration',
  engine: 'godot',
  platform: 'pc',
  dimension: '3d',
  perspective: 'iso',
  style: 'lowpoly',
  mode: 'solo',
  scope: 'prototype',
  team: '1',
};
export const defaultPriorities: Priorities = {
  mechanics: 40,
  physics: 15,
  graphics: 20,
  narrative: 10,
  audio: 15,
};
export const label = (field: Field, id: string, lang: Lang) =>
  catalog[field].find((x) => x.id === id)?.[lang] ?? id;
const option = (f: Field, id: string | undefined) => catalog[f].find((x) => x.id === id);
export function compatible(c: Partial<Config>): boolean {
  const engine = option('engine', c.engine),
    perspective = option('perspective', c.perspective),
    style = option('style', c.style),
    sub = option('subgenre', c.subgenre);
  return (
    !(engine && c.platform && !engine.platforms?.includes(c.platform)) &&
    !(engine && c.dimension && !engine.dimensions?.includes(c.dimension)) &&
    !(perspective && c.dimension && !perspective.dimensions?.includes(c.dimension)) &&
    !(style && c.dimension && !style.dimensions?.includes(c.dimension)) &&
    !(sub && c.genre && !sub.genres?.includes(c.genre))
  );
}
const shuffle = <T>(values: readonly T[], rng: () => number) => {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// Backtracking searches the whole catalog; an impossible lock set is reported, never changed.
export function generate(
  current: Config,
  locks: Field[],
  mode: RandomMode,
  rng = Math.random,
  preferCurrent = false,
): Config | null {
  const fixed = Object.fromEntries(locks.map((k) => [k, current[k]])) as Partial<Config>;
  if (mode === 'free')
    return Object.fromEntries(
      fields.map((k) => [
        k,
        locks.includes(k) ? current[k] : catalog[k][Math.floor(rng() * catalog[k].length)].id,
      ]),
    ) as Config;
  if (!compatible(fixed)) return null;
  const order: Field[] = [
    'engine',
    'platform',
    'dimension',
    'style',
    'perspective',
    'genre',
    'subgenre',
    'theme',
    'mode',
    'scope',
    'team',
  ];
  const visit = (index: number, c: Partial<Config>): Config | null => {
    if (index === order.length) return c as Config;
    const key = order[index];
    if (fixed[key]) return visit(index + 1, c);
    let values = shuffle(catalog[key], rng);
    if (preferCurrent)
      values = values.sort((a, b) => Number(b.id === current[key]) - Number(a.id === current[key]));
    for (const value of values) {
      const next = { ...c, [key]: value.id };
      if (compatible(next)) {
        const result = visit(index + 1, next);
        if (result) return result;
      }
    }
    return null;
  };
  return visit(0, fixed);
}
export function rebalance(p: Priorities, key: Priority, value: number): Priorities {
  const target = Math.max(0, Math.min(100, Math.round(value))),
    others = priorityKeys.filter((k) => k !== key);
  const total = others.reduce((s, k) => s + p[k], 0),
    remaining = 100 - target;
  const amounts = others.map((k) => ({
    key: k,
    raw: remaining * (total ? p[k] / total : 1 / others.length),
  }));
  const next = { ...p, [key]: target };
  for (const a of amounts) next[a.key] = Math.floor(a.raw);
  let rest = 100 - priorityKeys.reduce((s, k) => s + next[k], 0);
  for (const a of [...amounts].sort((a, b) => (b.raw % 1) - (a.raw % 1)))
    if (rest-- > 0) next[a.key]++;
  return next;
}
export function evaluate(c: Config, p: Priorities, lang: Lang) {
  const es = lang === 'es';
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = c.scope === 'micro' ? 0 : c.scope === 'prototype' ? 1 : 3;
  if (c.dimension === '3d') {
    score += 2;
    reasons.push(
      es
        ? 'El 3D añade modelado, cámara e interacción espacial.'
        : '3D adds modeling, camera work and spatial interaction.',
    );
  }
  if (c.mode === 'online' || c.mode === 'competitive') {
    score += c.mode === 'competitive' ? 5 : 4;
    reasons.push(
      es
        ? 'El juego online requiere sincronización, sesiones y pruebas de red.'
        : 'Online play requires synchronization, sessions and network testing.',
    );
  }
  if (c.mode === 'local') {
    score++;
    reasons.push(
      es
        ? 'El cooperativo local añade entradas y pruebas para varios jugadores.'
        : 'Local co-op adds inputs and multiplayer testing.',
    );
  }
  if (c.engine === 'roblox' && c.mode !== 'online' && c.mode !== 'competitive') {
    score++;
    reasons.push(
      es
        ? 'Roblox sigue usando una arquitectura cliente-servidor, incluso para experiencias de un jugador.'
        : 'Roblox still uses a client-server architecture, including single-player experiences.',
    );
  }
  if (c.style === 'realistic') {
    score += 3;
    reasons.push(
      es
        ? 'El acabado realista eleva el trabajo de recursos y optimización.'
        : 'Realistic visuals increase asset and optimization work.',
    );
  }
  if (p.physics >= 30) {
    score += 2;
    reasons.push(
      es
        ? 'La prioridad en físicas añade ajuste y casos de prueba.'
        : 'A physics focus adds tuning and edge-case testing.',
    );
  }
  if (c.genre === 'rpg' || c.subgenre === 'survival' || c.subgenre === 'tycoon') {
    score += 2;
    reasons.push(
      es
        ? 'La progresión y los sistemas conectados requieren equilibrio.'
        : 'Progression and connected systems require balancing.',
    );
  }
  if (c.platform === 'console') {
    score += 2;
    reasons.push(
      es
        ? 'Las consolas requieren acceso y procesos propios de sus fabricantes.'
        : 'Consoles require platform-holder access and processes.',
    );
  }
  if (!compatible(c))
    warnings.push(
      es
        ? 'La combinación no cumple las reglas del catálogo. Revisa motor/plataforma, dimensión/estilo/perspectiva y género/subgénero.'
        : 'This combination breaks catalog rules. Review engine/platform, dimension/style/perspective and genre/subgenre.',
    );
  const limit = c.scope === 'micro' ? 3 : c.scope === 'prototype' ? 6 : 9;
  const teamCapacity = c.team === '1' ? 5 : c.team === '2-3' ? 8 : 12;
  if (score > limit)
    warnings.push(
      es
        ? 'La propuesta supera el alcance elegido. Recorta sistemas antes de añadir contenido.'
        : 'The concept exceeds your scope. Cut systems before adding content.',
    );
  if (score > teamCapacity)
    warnings.push(
      es
        ? 'El equipo indicado puede asumir demasiado trabajo. Prueba una versión más pequeña.'
        : 'This may be too much work for your team. Try a smaller version.',
    );
  const complexity = score <= 3 ? 0 : score <= 7 ? 1 : 2;
  const team =
    score <= 4
      ? es
        ? '1 persona'
        : '1 person'
      : score <= 8
        ? es
          ? '2–3 personas'
          : '2–3 people'
        : es
          ? '4+ personas'
          : '4+ people';
  if (!reasons.length)
    reasons.push(
      es
        ? 'Una mecánica central y un contenido acotado mantienen el proyecto manejable.'
        : 'A core mechanic and limited content keep this manageable.',
    );
  const focus = priorityKeys.reduce((a, b) => (p[b] > p[a] ? b : a));
  const focusNames: Record<Priority, [string, string]> = {
    mechanics: ['mecánicas', 'mechanics'],
    physics: ['físicas', 'physics'],
    graphics: ['gráficos', 'visuals'],
    narrative: ['narrativa', 'narrative'],
    audio: ['audio', 'audio'],
  };
  const description = es
    ? `Un juego de ${label('genre', c.genre, lang).toLowerCase()} de ${label('subgenre', c.subgenre, lang).toLowerCase()}, ambientado en ${label('theme', c.theme, lang).toLowerCase()}. ${label('dimension', c.dimension, lang)}, ${label('style', c.style, lang).toLowerCase()}, con ${label('engine', c.engine, lang)}. Tu foco de práctica: ${focusNames[focus][0]}.`
    : `A ${label('genre', c.genre, lang).toLowerCase()} / ${label('subgenre', c.subgenre, lang).toLowerCase()} game set in ${label('theme', c.theme, lang).toLowerCase()}. ${label('dimension', c.dimension, lang)}, ${label('style', c.style, lang).toLowerCase()}, built with ${label('engine', c.engine, lang)}. Your practice focus: ${focusNames[focus][1]}.`;
  const mechanics = mechanicsData[c.genre as keyof typeof mechanicsData].map((x) => x[lang]);
  const cuts = [
    es
      ? 'Una sola zona. Un único objetivo. Sin contenido secundario.'
      : 'One area. One goal. No side content.',
    es
      ? 'Una mejora y un solo tipo de recurso o enemigo.'
      : 'One upgrade and one resource or enemy type.',
    c.mode === 'online' || c.mode === 'competitive'
      ? es
        ? 'Valida primero el ciclo de juego sin multijugador online.'
        : 'Validate the core loop before adding online multiplayer.'
      : es
        ? 'Deja fuera mundo abierto, crafting extenso y generación procedural.'
        : 'Leave out open worlds, extensive crafting and procedural generation.',
  ];
  return { score, complexity, team, reasons, warnings, description, mechanics, cuts };
}
export function makeConcept(config = defaultConfig): Concept {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    config: { ...config },
    priorities: { ...defaultPriorities },
    locks: [],
    randomMode: 'coherent',
  };
}
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}
export function validateConcept(x: unknown): Concept {
  if (
    !isRecord(x) ||
    typeof x.id !== 'string' ||
    x.id.length > 100 ||
    typeof x.title !== 'string' ||
    x.title.length > 120 ||
    typeof x.notes !== 'string' ||
    x.notes.length > 2000 ||
    typeof x.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(x.createdAt)) ||
    typeof x.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(x.updatedAt))
  )
    throw new Error('Invalid concept metadata');
  const c = x.config,
    p = x.priorities;
  if (
    !isRecord(c) ||
    !fields.every((k) => typeof c[k] === 'string' && catalog[k].some((o) => o.id === c[k]))
  )
    throw new Error('Unknown catalog selection');
  if (
    !isRecord(p) ||
    !priorityKeys.every(
      (k) => typeof p[k] === 'number' && Number.isInteger(p[k]) && p[k] >= 0 && p[k] <= 100,
    ) ||
    priorityKeys.reduce((s, k) => s + (p[k] as number), 0) !== 100
  )
    throw new Error('Invalid effort budget');
  if (
    !Array.isArray(x.locks) ||
    !x.locks.every((k) => fields.includes(k)) ||
    new Set(x.locks).size !== x.locks.length ||
    !['coherent', 'free'].includes(x.randomMode as string)
  )
    throw new Error('Invalid generator settings');
  // Return only known keys. Imported JSON is data, never executable instructions.
  return {
    id: x.id,
    title: x.title,
    notes: x.notes,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
    config: Object.fromEntries(fields.map((k) => [k, c[k]])) as Config,
    priorities: Object.fromEntries(priorityKeys.map((k) => [k, p[k]])) as Priorities,
    locks: x.locks as Field[],
    randomMode: x.randomMode as RandomMode,
  };
}
export function parseImport(raw: string): Concept {
  if (raw.length > 2_000_000) throw new Error('File too large');
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.format !== 'drgg' || value.version !== 1)
    throw new Error('Unsupported DRGG format');
  const c = validateConcept(value.concept);
  const now = new Date().toISOString();
  return { ...c, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}
export function exportConcept(c: Concept, format: 'json' | 'md' | 'txt', lang: Lang): string {
  if (format === 'json') return JSON.stringify({ format: 'drgg', version: 1, concept: c }, null, 2);
  const r = evaluate(c.config, c.priorities, lang),
    es = lang === 'es';
  const lines = [
    `# ${c.title || 'DRGG'}`,
    '',
    r.description,
    '',
    ...fields.map((k) => `- ${translations[lang].fieldNames[k]}: ${label(k, c.config[k], lang)}`),
    '',
    `## ${es ? 'Prioridades' : 'Priorities'}`,
    ...priorityKeys.map((k) => `- ${translations[lang].priorities[k]}: ${c.priorities[k]}%`),
    '',
    `## ${es ? 'Orientación de alcance' : 'Scope guidance'}`,
    `${[es ? 'Baja' : 'Low', es ? 'Media' : 'Medium', es ? 'Alta' : 'High'][r.complexity]} · ${r.team}`,
    ...r.reasons.map((s) => `- ${s}`),
    ...r.warnings.map((s) => `- ⚠ ${s}`),
    '',
    `## ${es ? 'Prototipo' : 'Prototype'}`,
    ...r.mechanics.map((s) => `- ${s}`),
    '',
    `## ${es ? 'Dejar fuera' : 'Leave out'}`,
    ...r.cuts.map((s) => `- ${s}`),
    '',
    `## ${es ? 'Notas' : 'Notes'}`,
    c.notes,
    '',
    es
      ? 'Orientación heurística, no una estimación de producción.'
      : 'Heuristic guidance, not a production estimate.',
    '',
    'DRGG — DevRandomGameGenerator · kaizem (mar33k13)',
  ];
  return format === 'md'
    ? lines.join('\n')
    : lines.map((s) => s.replace(/^#{1,2} /, '')).join('\n');
}
