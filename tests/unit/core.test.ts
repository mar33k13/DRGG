import { describe, it, expect } from 'vitest';
import {
  catalog,
  compatible,
  defaultConfig,
  defaultPriorities,
  evaluate,
  exportConcept,
  fields,
  generate,
  makeConcept,
  parseImport,
  priorityKeys,
  rebalance,
  validateConcept,
  type Config,
} from '../../src/core';
const rng =
  (seed = 20) =>
  () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
describe('coherent generation', () => {
  it('creates 1000 compatible concepts while preserving actual team and scope', () => {
    const random = rng();
    for (let i = 0; i < 1000; i++) {
      const c = generate(defaultConfig, ['team', 'scope'], 'coherent', random)!;
      expect(compatible(c)).toBe(true);
      expect(c.team).toBe('1');
      expect(c.scope).toBe('prototype');
      expect(fields.every((f) => catalog[f].some((o) => o.id === c[f]))).toBe(true);
    }
  });
  it('supports every engine without contradicting its curated export paths', () => {
    for (const e of catalog.engine) {
      const c = generate({ ...defaultConfig, engine: e.id }, ['engine'], 'coherent', rng())!;
      expect(c.engine).toBe(e.id);
      expect(e.platforms).toContain(c.platform);
      expect(compatible(c)).toBe(true);
    }
  });
  it('never silently changes contradictory locks', () => {
    const c = { ...defaultConfig, engine: 'roblox', platform: 'web' };
    expect(generate(c, ['engine', 'platform'], 'coherent')).toBeNull();
    expect(generate(c, ['engine', 'platform'], 'free')?.engine).toBe('roblox');
    expect(generate(c, ['engine', 'platform'], 'free')?.platform).toBe('web');
  });
  it('retains all selections when every field is locked', () =>
    expect(generate(defaultConfig, fields, 'coherent')).toEqual(defaultConfig));
  it('repairs dependent fields after a manual engine change', () => {
    const c = generate(
      { ...defaultConfig, engine: 'roblox' },
      ['engine', 'scope', 'team'],
      'coherent',
      rng(),
      true,
    )!;
    expect(c.platform).toBe('roblox');
    expect(c.dimension).toBe('3d');
  });
  it('flags invalid combinations in free mode', () =>
    expect(
      evaluate({ ...defaultConfig, engine: 'roblox', platform: 'web' }, defaultPriorities, 'es')
        .warnings.length,
    ).toBeGreaterThan(0));
});
describe('effort budget', () => {
  it('preserves 100 integer points across repeated moves including 0 and 100', () => {
    let p = { ...defaultPriorities };
    const random = rng();
    for (let i = 0; i < 2000; i++) {
      const key = priorityKeys[i % 5],
        value = i < 2 ? i * 100 : Math.floor(random() * 101);
      p = rebalance(p, key, value);
      expect(p[key]).toBe(value);
      expect(Object.values(p).reduce((a, b) => a + b, 0)).toBe(100);
      expect(Object.values(p).every((v) => Number.isInteger(v) && v >= 0 && v <= 100)).toBe(true);
    }
  });
  it('does not claim that low physics priority eliminates online complexity', () => {
    const c: Config = { ...defaultConfig, mode: 'online', scope: 'micro', style: 'realistic' };
    const report = evaluate(
      c,
      { mechanics: 100, physics: 0, graphics: 0, narrative: 0, audio: 0 },
      'en',
    );
    expect(report.complexity).toBe(2);
    expect(report.warnings.length).toBeGreaterThan(0);
  });
});
describe('portable concepts', () => {
  it('round-trips JSON, retaining user data and assigning a fresh identity', () => {
    const c = {
      ...makeConcept(),
      title: 'Órbita <script>',
      notes: 'Line 1\nLine 2',
      locks: ['engine'] as const,
    };
    const input = { ...c, locks: [...c.locks] };
    const imported = parseImport(exportConcept(input, 'json', 'es'));
    expect(imported.title).toBe(c.title);
    expect(imported.notes).toBe(c.notes);
    expect(imported.config).toEqual(c.config);
    expect(imported.id).not.toBe(c.id);
  });
  it('rejects unsupported versions, unknown selections, invalid budgets and oversized files', () => {
    const c = makeConcept();
    for (const v of [
      { format: 'drgg', version: 3, concept: c },
      {
        format: 'drgg',
        version: 1,
        concept: { ...c, config: { ...c.config, engine: 'injected' } },
      },
      {
        format: 'drgg',
        version: 1,
        concept: { ...c, priorities: { ...c.priorities, physics: -1 } },
      },
      { format: 'drgg', version: 1, concept: { ...c, locks: ['nonsense'] } },
    ])
      expect(() => parseImport(JSON.stringify(v))).toThrow();
    expect(() => parseImport(' '.repeat(2_000_001))).toThrow();
    expect(() => validateConcept(null)).toThrow();
  });
  it('renders guidance, all selected fields and notes in both text formats and languages', () => {
    for (const lang of ['es', 'en'] as const) {
      const c = { ...makeConcept(), notes: 'Keep one room' };
      for (const f of ['md', 'txt'] as const) {
        const output = exportConcept(c, f, lang);
        expect(output).toContain('Keep one room');
        expect(output).toContain('Godot');
        expect(output).toContain(lang === 'es' ? 'Prototipo' : 'Prototype');
      }
    }
  });
});

describe('development context and migration', () => {
  it('reads legacy concepts as human and retains assisted settings through export/import', () => {
    const { development: _, ...legacy } = makeConcept();
    expect(
      parseImport(JSON.stringify({ format: 'drgg', version: 1, concept: legacy })).development,
    ).toEqual({ mode: 'human', areas: [] });
    const c = makeConcept();
    c.development = { mode: 'hybrid', areas: ['code', 'art'] };
    expect(parseImport(exportConcept(c, 'json', 'en')).development).toEqual(c.development);
    for (const lang of ['es', 'en'] as const)
      for (const format of ['md', 'txt'] as const) {
        const text = exportConcept(c, format, lang);
        expect(text).toContain(lang === 'es' ? 'Híbrido' : 'Hybrid');
        expect(text).toContain(lang === 'es' ? 'Programación' : 'Programming');
      }
  });
  it('rejects malformed models without silently treating them as human', () => {
    for (const development of [
      null,
      { mode: 'unknown', areas: [] },
      { mode: 'hybrid', areas: ['other'] },
      { mode: 'ai', areas: ['code', 'code'] },
      { mode: 'human', areas: ['art'] },
    ]) {
      expect(() => validateConcept({ ...makeConcept(), development })).toThrow();
    }
    const { development: _, ...legacy } = makeConcept();
    expect(() =>
      parseImport(JSON.stringify({ format: 'drgg', version: 2, concept: legacy })),
    ).toThrow();
  });
  it('changes conditional team guidance without changing technical complexity', () => {
    const c = { ...defaultConfig, scope: 'small' };
    const p = { mechanics: 40, graphics: 30, physics: 10, narrative: 10, audio: 10 };
    const human = evaluate(c, p, 'en');
    const hybrid = evaluate(c, p, 'en', { mode: 'hybrid', areas: ['code', 'art'] });
    expect(human.team).toBe('2–3 people');
    expect(hybrid.team).toBe('1 person');
    expect(hybrid.score).toBe(human.score);
    expect(hybrid.complexity).toBe(human.complexity);
    expect(hybrid.demand).toBeLessThanOrEqual(human.demand);
    expect(hybrid.developmentReasons.join(' ')).toContain('validate and integrate');
  });
  it('protects network work and accounts for supervision, without inventing unspecified assistance', () => {
    const c = { ...defaultConfig, mode: 'online' };
    const human = evaluate(c, defaultPriorities, 'en');
    const hybrid = evaluate(c, defaultPriorities, 'en', { mode: 'hybrid', areas: ['code'] });
    const ai = evaluate(c, defaultPriorities, 'en', { mode: 'ai', areas: ['code'] });
    expect(hybrid.workScore).toBe(human.workScore);
    expect(ai.workScore).toBe(human.workScore + 1);
    expect(evaluate(c, defaultPriorities, 'en', { mode: 'ai', areas: [] }).workScore).toBe(
      human.workScore,
    );
  });
  it('ties content assistance to selected priorities and keeps scores nonnegative', () => {
    const p = { mechanics: 0, graphics: 0, physics: 0, narrative: 50, audio: 50 };
    const c = { ...defaultConfig, scope: 'micro', dimension: '2d', style: 'pixel' };
    const report = evaluate(c, p, 'es', { mode: 'hybrid', areas: ['narrative', 'audio'] });
    expect(report.workScore).toBe(0);
    expect(report.developmentReasons.join(' ')).toContain('Narrativa:');
    expect(report.developmentReasons.join(' ')).toContain('Audio:');
  });
});
