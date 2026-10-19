# DRGG 0.1 — producto acordado

Entrevista completada el 19 de octubre de 2026. Autor: kaizem (mar33k13).

Objetivo: pasar de no saber qué desarrollar a una idea pequeña y practicable en 5–10 minutos. Público general, priorizando proyectos indie y práctica de mecánicas. App de escritorio con generación mediante plantillas, sin servicios de IA ni conexión obligatoria. Sin gestión empresarial, costes ficticios, público objetivo ni estimación de plazos.

Inicio con «Crear concepto» y «Generar aleatoriamente». Cinco ventanas sucesivas: límites → concepto → herramientas → esfuerzo → ficha. Biblioteca en la navegación. Identidad visual propia de consola retrofuturista, fondo oscuro, detalles pixelados y acentos cálidos, inspirada en el moodboard privado del autor. No se redistribuye ese moodboard ni sus recursos.

- Tema, género, subgénero, motor, plataforma, perspectiva, estilo, dimensionalidad, modo de juego, prioridades y alcance. Marcas reales en texto. **Roblox Studio debe estar incluido explícitamente como motor**, junto a Godot, Unity y Unreal Engine, con su nombre disponible tanto en español como en inglés.
- Equipo real: 1, 2–3 o 4+. Objetivo: microjuego, prototipo o juego pequeño. Ambos se bloquean inicialmente.
- Aleatorio libre y coherente; bloqueos individuales. Las prioridades se ajustan manualmente y no cambian al sortear.
- El modo coherente respeta las compatibilidades documentadas. Un cambio manual puede ajustar campos dependientes conservando bloqueos. Un conflicto sin solución se informa y no modifica la selección.
- El modo libre permite todo y advierte. Exceso de alcance: aviso en ambos modos, sin bloqueo.
- Mecánicas, físicas, gráficos, narrativa y audio comparten 100 puntos. Prioridad no equivale a tiempo ni elimina dificultad.
- Ficha compacta mediante plantillas: descripción, tres mecánicas, recortes, complejidad baja/media/alta con justificación y equipo orientativo, sin plazos.
- Biblioteca: guardar, abrir, editar, duplicar, eliminar con confirmación, importar JSON; título y notas. Exportar Markdown, texto y JSON. Avisar de cambios sin guardar. Proteger bibliotecas ilegibles frente a sobrescritura.
- Windows, macOS y Linux; español e inglés ampliables. GPL-3.0-only. Repositorio público: https://github.com/mar33k13/DRGG.
- Catálogo editable en archivos y contribuciones. Editor en la app, paquetes externos, etiquetas, comparaciones, servicios de IA y cuentas fuera de 0.1.

## Modelo de desarrollo

Selector estable en la primera etapa: humano, híbrido o principalmente con IA. En los dos últimos, se eligen programación, arte, narrativa y/o audio. Describe el desarrollo del juego; DRGG no ejecuta IA. Se conserva al sortear, editar, duplicar, guardar y exportar, en español e inglés. Cambiar a humano elimina las áreas activas.

La ficha separa complejidad técnica, exigencia para el equipo real y equipo humano orientativo. El apoyo se aplica por tareas con reglas visibles y una condición explícita: validar e integrar los resultados. No se descuentan personas mediante un porcentaje genérico. Véanse los criterios en COMPLEXITY.md.

JSON y biblioteca v2 conservan el modelo. Se leen los conceptos v1 como humanos sin áreas de IA; la migración se escribe solo al guardar. Los modelos desconocidos o malformados se rechazan.

## Calidad visual y animaciones

Requisito explícito añadido por el autor: **DRGG debe ser visualmente muy bonita y tener animaciones atractivas**. La calidad visual y el movimiento forman parte del producto y de su sensación de videojuego. El moodboard sigue siendo la referencia para la identidad; la interfaz debe tener una composición cuidada, tipografía legible, buen contraste, espaciado consistente y controles con personalidad.

Dirección de movimiento para desarrollar y revisar:

- Transiciones fluidas entre las cinco etapas y entradas suaves de los paneles.
- Animación al sortear combinaciones que transmita exploración y conserve visualmente los campos bloqueados.
- Respuestas claras y agradables al pasar el cursor, pulsar, bloquear selectores y guardar conceptos.
- Barras de esfuerzo e indicadores de complejidad con cambios animados que permitan seguir el nuevo reparto.
- Elementos ambientales sutiles, como las órbitas de la pantalla inicial, coherentes con la estética de consola retrofuturista.

Las animaciones deben sentirse ágiles, mantener la navegación por teclado y respetar la preferencia del sistema de reducir movimiento. No deben introducir esperas obligatorias ni entorpecer el objetivo de concretar una idea en 5–10 minutos. Su implementación se comprobará en la aplicación; documentar este requisito no significa que todas estas animaciones estén ya realizadas.

Criterio de aceptación: completar el flujo en menos de diez minutos, identificar un foco de práctica, obtener un alcance compacto, guardar y reabrir el concepto. Registrar por separado pruebas de lógica, interfaz, compilación por plataforma y ejecución nativa.
