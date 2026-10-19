# Reglas de complejidad y equipo v2

Heurísticas explícitas, no estadísticas de producción ni predicciones de tiempo. El equipo sugerido no garantiza viabilidad. No se modelan experiencia, recursos reutilizados o calidad esperada.

| Factor                                 |                               Puntos |
| -------------------------------------- | -----------------------------------: |
| Microjuego / prototipo / juego pequeño |                            0 / 1 / 3 |
| 3D                                     |                                   +2 |
| Cooperativo local                      |                                   +1 |
| Cooperativo online / competitivo       |                              +4 / +5 |
| Roblox con modo no online              | +1 por arquitectura cliente-servidor |
| Estilo realista                        |                                   +3 |
| Prioridad en físicas ≥30               |                                   +2 |
| RPG, supervivencia o tycoon            |                           +2 una vez |
| Consolas                               |                                   +2 |

Complejidad: 0–3 baja; 4–7 media; 8+ alta. La referencia humana usa 0–4 una persona; 5–8 dos o tres; 9+ cuatro o más. El equipo real no reduce complejidad. La capacidad de referencia es 5, 8 o 12 para equipos de 1, 2–3 o 4+. El aviso de equipo usa la puntuación de trabajo descrita a continuación. El alcance avisa al superar 3, 6 o 9 puntos para microjuego, prototipo o juego pequeño. No bloquea avanzar.

Pocos puntos en un aspecto no eliminan sus requisitos mínimos. El presupuesto expresa qué practicar, no horas. No se suma directamente cada porcentaje porque siempre totalizan 100.

`src/data/catalog.json` declara rutas previstas motor/plataforma y motor/dimensionalidad; asociaciones de dimensión con estilo/perspectiva y de género con subgénero. Son reglas editoriales, no una lista exhaustiva de posibilidades. Godot en consolas mediante proveedores especializados no se incluye en las rutas iniciales; no se afirma que sea imposible. «PC» no garantiza exportar a todos sus sistemas sin requisitos adicionales. Consolas requieren acceso y herramientas del fabricante.

El modo coherente busca mediante backtracking, fijando primero los bloqueos. Los cambios manuales fijan además el campo editado y favorecen conservar el resto. El modo libre no filtra. Nunca se cambia un bloqueo silenciosamente. No hay puntuaciones comerciales ni afirmaciones de éxito de mercado.

## Desarrollo humano, híbrido o principalmente con IA

La complejidad técnica y el aviso de alcance conservan todos los puntos anteriores. La orientación de equipo modela un escenario editorial, no productividad medida. Solo cuenta el apoyo si el equipo puede validar e integrar sus resultados.

Se descuenta un punto de trabajo por cada área seleccionada que cumpla:

- Programación: mecánicas ≥30, físicas <30, sin online/competitivo, consolas ni Roblox (arquitectura cliente-servidor).
- Arte: gráficos ≥25 y estilo no realista.
- Narrativa: narrativa ≥25.
- Audio: audio ≥25.

El descuento total se limita a 2 puntos en híbrido y 3 en principalmente con IA. El modo principalmente con IA suma 1 punto de supervisión/integración cuando hay áreas seleccionadas. Sin áreas se mantiene la referencia humana. Trabajo = máximo de cero y complejidad − apoyo + supervisión. La selección humana usa apoyo y supervisión cero.

Equipo humano orientativo: trabajo 0–4 → 1 persona, 5–8 → 2–3, 9+ → 4+. Exigencia para el equipo real: manejable si trabajo ≤ capacidad−3; ajustada si ≤ capacidad; elevada si la supera. No son horas, porcentajes de ahorro ni garantías de viabilidad. El panel muestra puntuación, capacidad, condiciones aplicadas y responsabilidades humanas. Elegir principalmente IA no implica que requiera menos personas que híbrido.
