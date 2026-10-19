# Reglas de complejidad v1

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

Complejidad: 0–3 baja; 4–7 media; 8+ alta. Equipo orientativo: 0–4 una persona; 5–8 dos o tres; 9+ cuatro o más. El equipo real no reduce complejidad: genera un aviso si la puntuación supera 5, 8 o 12 para equipos de 1, 2–3 o 4+. El alcance avisa al superar 3, 6 o 9 puntos para microjuego, prototipo o juego pequeño. No bloquea avanzar.

Pocos puntos en un aspecto no eliminan sus requisitos mínimos. El presupuesto expresa qué practicar, no horas. No se suma directamente cada porcentaje porque siempre totalizan 100.

`src/data/catalog.json` declara rutas previstas motor/plataforma y motor/dimensionalidad; asociaciones de dimensión con estilo/perspectiva y de género con subgénero. Son reglas editoriales, no una lista exhaustiva de posibilidades. Godot en consolas mediante proveedores especializados no se incluye en las rutas iniciales; no se afirma que sea imposible. «PC» no garantiza exportar a todos sus sistemas sin requisitos adicionales. Consolas requieren acceso y herramientas del fabricante.

El modo coherente busca mediante backtracking, fijando primero los bloqueos. Los cambios manuales fijan además el campo editado y favorecen conservar el resto. El modo libre no filtra. Nunca se cambia un bloqueo silenciosamente. No hay puntuaciones comerciales ni afirmaciones de éxito de mercado.
