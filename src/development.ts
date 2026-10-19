export const developmentModes = ['human', 'hybrid', 'ai'] as const;
export const aiAreas = ['code', 'art', 'narrative', 'audio'] as const;
export type DevelopmentMode = (typeof developmentModes)[number];
export type AiArea = (typeof aiAreas)[number];
export type Development = { mode: DevelopmentMode; areas: AiArea[] };
export const defaultDevelopment: Development = { mode: 'human', areas: [] };
export const developmentText = {
  es: {
    title: 'Modelo de desarrollo',
    hint: 'Cómo vais a construir el juego. Esta elección se conserva al sortear.',
    modes: { human: 'Humano', hybrid: 'Híbrido', ai: 'Principalmente con IA' },
    descriptions: {
      human: 'El equipo crea directamente los sistemas y recursos.',
      hybrid: 'Personas e IA se reparten tareas concretas.',
      ai: 'La IA produce; las personas dirigen, integran y revisan.',
    },
    areasTitle: '¿Dónde utilizarás IA?',
    areas: { code: 'Programación', art: 'Arte', narrative: 'Narrativa', audio: 'Audio' },
    chooseAreas: 'Elige las áreas para adaptar la orientación a tu forma de trabajar.',
    demand: 'Exigencia para tu equipo',
    demandLevels: ['Manejable', 'Ajustada', 'Elevada'],
    guidance: 'Cómo influye tu modelo',
    assumption:
      'Escenario orientativo: el apoyo solo cuenta si puedes validar e integrar sus resultados.',
    noAreas: 'Sin áreas seleccionadas: se conserva la referencia de trabajo humano.',
    human: 'Referencia de trabajo humano: se consideran los sistemas y recursos del proyecto.',
    code: 'Programación: apoyo en un ciclo de juego acotado (−1). Red, físicas intensivas y consolas mantienen sus requisitos.',
    art: 'Arte: apoyo en recursos de estilo no realista con prioridad gráfica de al menos 25 puntos (−1).',
    narrative:
      'Narrativa: apoyo en borradores y variantes con prioridad de al menos 25 puntos (−1).',
    audio: 'Audio: apoyo en material de partida con prioridad de al menos 25 puntos (−1).',
    review:
      'Principalmente con IA: se reserva capacidad para supervisar e integrar el trabajo (+1).',
    noCredit:
      'Las áreas elegidas no cumplen las condiciones de apoyo de esta ficha; el equipo sugerido no se reduce.',
    capped: 'El apoyo se limita a 2 puntos en híbrido y 3 en principalmente con IA.',
    responsibility:
      'El equipo humano conserva diseño, integración, pruebas y la decisión final sobre la calidad.',
    workload: 'Puntuación de trabajo',
    capacity: 'Referencia de capacidad',
  },
  en: {
    title: 'Development model',
    hint: 'How you will build the game. This choice is preserved when rolling.',
    modes: { human: 'Human', hybrid: 'Hybrid', ai: 'Mostly AI' },
    descriptions: {
      human: 'The team creates systems and assets directly.',
      hybrid: 'People and AI share specific tasks.',
      ai: 'AI produces; people direct, integrate and review.',
    },
    areasTitle: 'Where will you use AI?',
    areas: { code: 'Programming', art: 'Art', narrative: 'Narrative', audio: 'Audio' },
    chooseAreas: 'Choose the areas to adapt the guidance to your workflow.',
    demand: 'Demand on your team',
    demandLevels: ['Manageable', 'Tight', 'High'],
    guidance: 'How your model affects this',
    assumption:
      'Illustrative scenario: assistance only counts if you can validate and integrate its output.',
    noAreas: 'No areas selected: the human-work baseline is retained.',
    human: 'Human-work baseline: the project’s systems and assets are considered.',
    code: 'Programming: support for a focused game loop (−1). Networking, intensive physics and consoles retain their requirements.',
    art: 'Art: support for non-realistic assets with a graphics priority of at least 25 points (−1).',
    narrative:
      'Narrative: support for drafts and variations with a priority of at least 25 points (−1).',
    audio: 'Audio: support for source material with a priority of at least 25 points (−1).',
    review: 'Mostly AI: capacity is reserved for supervision and integration (+1).',
    noCredit:
      'The selected areas do not meet this concept’s assistance conditions; the suggested team is not reduced.',
    capped: 'Assistance is capped at 2 points for hybrid and 3 for mostly AI.',
    responsibility:
      'People retain responsibility for design, integration, testing and final quality decisions.',
    workload: 'Work score',
    capacity: 'Capacity reference',
  },
};
