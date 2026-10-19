# Validación de DRGG 0.1

19 de octubre de 2026. Evidencia local, sin dar por verificados sistemas donde no se ha ejecutado la aplicación.

## Versión inicial comprobada (`2eabc37`)

- TypeScript estricto e interfaz de producción compilados.
- 11 pruebas de lógica: 1.000 generaciones coherentes, conservación y conflictos de bloqueos, todos los motores, presupuesto de 100 puntos tras 2.000 modificaciones, validación de JSON y exportación bilingüe.
- 5 recorridos Playwright en Chrome aislado: creación/edición/guardado/reapertura/duplicado/borrado/exportación; aleatoriedad y límites bloqueados; idioma y cambios sin guardar; importación válida/inválida; biblioteca dañada; diseño a 390 píxeles sin desbordamiento horizontal.
- Prueba Rust de reemplazo atómico y límites de lectura: 1 prueba superada.
- Compilación nativa local Apple Silicon: app y DMG.
- Ejecución macOS real: interfaz Tauri, creación de concepto, escritura en biblioteca, exportación JSON mediante diálogo nativo e importación del archivo exportado. JSON de salida comprobado: formato `drgg`, versión 1 y prioridades sumando 100.
- Reapertura de la compilación final: conserva los dos conceptos de ejemplo creados durante las pruebas y permite consultar GPLv3 y avisos de dependencias sin conexión.
- [Checks de GitHub Actions](https://github.com/mar33k13/DRGG/actions/runs/39244621036): compilación de interfaz y pruebas de lógica/interfaz superadas para el commit `2eabc37142b6585e8430e3ad6feaa7324a76c5a8`.

Paquete macOS Apple Silicon local: `DRGG_0.1.0_aarch64.dmg`. SHA-256: `0568fae7dc2e4845f52e98c6aeceffa7b313973a62249846284b6f90425c751f`. Sin firma de distribución/notarización.

## Compilaciones en GitHub

[Desktop packages](https://github.com/mar33k13/DRGG/actions/runs/39244667554), commit de aplicación `2eabc37142b6585e8430e3ad6feaa7324a76c5a8`: pruebas Rust y empaquetado superados en macOS Apple Silicon, macOS Intel, Windows x64 y Linux x64. Instaladores generados: DMG para ambas arquitecturas macOS; EXE y MSI para Windows; AppImage, DEB y RPM para Linux. No se afirma ejecución manual de esos instaladores fuera del Mac Apple Silicon local.

## Renovación de interfaz y modelos de desarrollo (revisión del 19 de octubre)

- 16 pruebas Vitest superadas: generación, bloqueos, esfuerzo, intercambio bilingüe, migración v1→v2, rechazo de modelos malformados y separación de complejidad técnica frente a equipo condicionado por tareas de IA.
- 8 recorridos Playwright en Chrome superados. Añaden persistencia/exportación del modelo híbrido, tarjetas con teclado, Roblox coherente y bloqueado, preferencia de movimiento local/sistema y todas las etapas a 390 píxeles sin desbordamiento horizontal.
- 2 pruebas Rust superadas: escritura atómica/límites y persistencia v1/v2 con rechazo de una versión desconocida sin sobrescritura.
- TypeScript, Vite de producción y Prettier superados. Vite mantiene el aviso del paquete grande por los textos legales incluidos; no hay nuevas dependencias.
- Revisión visual en navegador y WebKit nativo macOS Apple Silicon; tamaño de los selectores normalizado y flecha empaquetada como recurso local compatible con la política de contenidos nativa. Tarjetas de motores, nueva paleta, modelo de desarrollo, ficha y biblioteca revisados. Las transiciones no bloquean los controles; movimiento reducido comprobado automáticamente. No se ha medido el rendimiento en máquinas externas.
- Prueba nativa real: guardar «Órbita híbrida — ejemplo» con programación y arte, cerrar, reabrir y recuperar sus selecciones. Archivo en disco comprobado: versión 2, tres conceptos; los dos ejemplos anteriores se conservan como humanos sin áreas.
- App y DMG Apple Silicon reconstruidos desde `e10653c`. SHA-256 del DMG final: `16bc2ac5479c6776fa19f5d320e1b490d95886eeced88ce0595cc15db345c2cb`. El primer empaquetado del DMG falló en el sandbox (`hdiutil: Device not configured`); el segundo, con acceso al empaquetador de macOS, terminó correctamente.
- El borrador se actualizó posteriormente con esta revisión; véase la entrega de instaladores siguiente. Las compilaciones iniciales enlazadas arriba se conservan como evidencia histórica.

## Instaladores actualizados y app del Mac (19 de octubre)

- [Desktop packages, ejecución 39262217951](https://github.com/mar33k13/DRGG/actions/runs/39262217951), commit `67fe14f6311c31051ca720e825efe4eb438fc2b7`: los cuatro destinos completaron compilación, pruebas y empaquetado. Sin pasos fallidos. [Checks de interfaz del mismo commit](https://github.com/mar33k13/DRGG/actions/runs/39249143483) también completados correctamente.
- Sustituidos los siete instaladores de `preview-0.1.0`: dos DMG, EXE, MSI, AppImage, DEB y RPM. Windows, Linux e Intel proceden de esa ejecución; Apple Silicon usa el DMG local probado desde `e10653c`, cuyo código de aplicación es idéntico al de `67fe14f` (solo documentación, capturas y pruebas difieren entre ambos commits).
- Actualizados el título, las notas, el commit objetivo y las sumas de integridad del [borrador](https://github.com/mar33k13/DRGG/releases/tag/untagged-04d8d80830e077fb597e). Verificados nombre, tamaño, estado de carga y SHA-256 de los ocho assets de GitHub contra los archivos locales. Todos los hashes difieren de la revisión anterior. Se conserva `draft: true` y `prerelease: true`; no se ha publicado. [Manifiesto de los siete instaladores](releases/preview-0.1.0-SHA256SUMS.txt).
- Instalada la app local actual en `~/Applications/DRGG.app`, con todos sus archivos idénticos al bundle probado. Apertura nativa desde esa ubicación, biblioteca de tres conceptos y reapertura del concepto híbrido con programación/arte comprobadas. Hash de la biblioteca idéntico antes y después; contenido v2 conservado. App abierta en Inicio al terminar.
- La versión sigue siendo 0.1.0 durante este borrador sin publicar. La [compactación adicional de interfaz](NEXT_UI.md) y el [actualizador interno](UPDATES_PLAN.md) son propuestas para otra entrega, sin cambios funcionales en estos paquetes.

## Límites

La ejecución real en Windows, Linux y macOS Intel sigue pendiente de revisión en sus sistemas; una compilación correcta no la sustituye. La firma/notarización no está configurada. No se han validado instaladores en equipos ajenos ni lectura de bibliotecas de versiones futuras. Las referencias de licencia de paquetes sin archivos de licencia propios deben revisarse antes de una distribución de producción.

## Herramientas locales

El checkout se preparó con Node 22.22.2, pnpm 11.24.0 y Rust estable 1.99.1 instalado **solo** en `.tools/` (ignoradas por Git). No se modificó el perfil de shell del usuario. El SDK 27 predeterminado contiene una arquitectura no reconocida por el enlazador instalado y los SDK 15.x presentes están incompletos. La compilación funcionó seleccionando el SDK 26.5 completo únicamente para ese proceso:

```sh
SDKROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk \
CARGO_HOME="$PWD/.tools/cargo" \
RUSTUP_HOME="$PWD/.tools/rustup" \
PATH="$PWD/.tools/cargo/bin:/Library/Developer/CommandLineTools/usr/bin:$PATH" \
pnpm tauri build --bundles app,dmg
```

Este ajuste es específico de este Mac y no forma parte de los requisitos generales. Los primeros intentos con SDK 27 y 15.5 fallaron; no se consideran compilaciones válidas.
