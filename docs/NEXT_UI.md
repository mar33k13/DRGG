# Próxima iteración de interfaz

Propuesta del 19 de octubre de 2026, después de probar la primera versión. Estado: plan; estos ajustes adicionales no forman parte de los instaladores de la revisión `67fe14f`.

## Objetivo

Conservar la identidad cálida de consola, las animaciones y las cinco etapas, haciendo que todas las pantallas parezcan parte del mismo sistema. Compactar las opciones debe reducir desplazamientos y repetición sin reducir la legibilidad ni esconder decisiones esenciales.

## Cambios propuestos

1. **Una estructura común.** Misma anchura de contenido, cabecera de etapa, separaciones, bordes y barra de acciones en Límites, Idea, Herramientas, Esfuerzo y Ficha. Biblioteca y Acerca de reutilizan paneles, encabezados y botones. Inicio conserva su composición de bienvenida.
2. **Tarjetas más compactas.** Motor, género, dimensiones y modelo de desarrollo comparten tamaños, foco, selección y bloqueo. Icono y nombre siempre visibles; una ayuda breve para la opción seleccionada sustituye a las descripciones repetidas de todas las tarjetas. Ayuda accesible con teclado, sin depender de pasar el ratón.
3. **Agrupaciones claras.** Herramientas organiza motor/plataforma y presentación visual en grupos alineados. Mantener las selecciones y sus bloqueos a la vista; solo las explicaciones largas van en «Ver detalles». Las áreas de IA aparecen junto al modelo elegido.
4. **Ficha y biblioteca consistentes.** Igual jerarquía para título, etiquetas, complejidad y acciones. Resumen de concepto compacto, mecánicas y recortes en columnas cuando hay espacio. Avisos técnicos y cambios sin guardar mantienen su visibilidad.
5. **Movimiento consistente.** Compartir duración y recorrido de transiciones, confirmaciones y cambios de selección. Mantener la reducción de movimiento del sistema y la preferencia local.

## Orden de implementación y commits

1. `refactor(ui): share panel and control styles`: extraer las piezas repetidas y consolidar los estilos que hoy se sobreescriben; conservar el comportamiento.
2. `feat(ui): compact concept options and align screens`: aplicar densidad y agrupaciones a todas las etapas, biblioteca y Acerca de; revisar textos ES/EN.
3. `test(ui): verify unified layouts and keyboard flows`: adaptar los recorridos existentes a los cambios relevantes y registrar revisión visual nativa.

## Criterios de aceptación

- Comparativas antes/después en la ventana habitual de 1320×900 y en el mínimo nativo de 780×620. Verificación adicional a 390 px para la interfaz web.
- Reducir el espacio ocupado por opciones repetidas y los desplazamientos en Límites y Herramientas, manteniendo textos legibles y controles cómodos.
- Sin controles cortados, acciones tapadas por la barra inferior ni saltos de disposición al seleccionar.
- Misma apariencia para un mismo tipo de control en cualquier pantalla; estados de foco, bloqueo, error y selección distinguibles.
- Mantener navegación por teclado, español/inglés, movimientos reducidos, generador coherente, conservación de bloqueos y biblioteca.
- Validar visualmente en WebKit nativo además de los recorridos automáticos en navegador. No convertir un cambio visual en una modificación de las reglas de complejidad.
