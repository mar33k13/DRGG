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

## Interfaz compacta y actualizador 0.2.0 (19 de octubre)

- UI en commit `8f816a9`: componentes compartidos, controles compactos, ayuda de la selección actual, agrupación de herramientas y acceso móvil a Acerca de DRGG. Revisión de 1320×900, 780×620 y 390×844; WebKit nativo revisado en Apple Silicon.
- Actualizador: 16 pruebas de lógica, 2 del ensamblador/firmas y 5 nativas Rust. Recorridos Playwright incluyen biblioteca, modelos de desarrollo y 6 casos del actualizador. Una comparación visual se ajustó a precisión de un decimal por una diferencia de coma flotante de 0,00003 px; una espera de scroll con cinco workers se repitió satisfactoriamente con dos. No se cambiaron criterios funcionales.
- Ensayo nativo independiente 0.2.0 → 0.2.1: paquete alterado rechazado, descarga original aceptada, cancelar sin instalar, guardar antes de instalar, reinicio automático y recuperación del título y notas en la ficha. Versiones iguales/inferiores no ofrecidas y conexión rechazada mostrada como error recuperable.
- SHA-256 de biblioteca y copia del ensayo: `f29fb2b89fd4fed6e6563eb090ae9ce128ccc266ca3f51e0c4b8d6cbeb702c13`. Se consumió el marcador de recuperación. Biblioteca original del usuario intacta: `f18134820e91a984b507c6ec1b5ea9ad860c6ac496171c6b4291354598d36565`.
- La feature local `updater-e2e` se usa exclusivamente con identificador separado, clave de ensayo y endpoint loopback. Los paquetes de distribución se compilan sin esa feature, con HTTPS y clave pública de producción.
- Pendiente de recorrido manual entre dos versiones: Windows EXE/MSI, Linux AppImage y macOS Intel. DEB/RPM tienen descarga manual. No hay certificados de distribución Windows ni notarización Apple; la firma criptográfica del actualizador sí se exige.

### Instalación local de 0.2.0

La app de `~/Applications/DRGG.app` se sustituyó por la compilación de producción de `aba97259`, versión 0.2.0. La app anterior se conserva en `~/Applications/.DRGG-backups/`. Se verificaron la firma del archivo de actualización y su versión, el arranque nativo, la revisión visible, los tres conceptos existentes y la respuesta del canal estable: no ofrece el borrador. La biblioteca conserva el hash original citado arriba.

Esta compilación tiene la firma ad hoc del ejecutable producida por el enlazador, sin certificado de distribución ni sellado completo del bundle; por ello `codesign --verify --deep --strict` no pasa. Esto no se presenta como notarización ni validación de Gatekeeper. La firma del actualizador se verifica por separado y sí pasó.

[Checks del commit de distribución](https://github.com/mar33k13/DRGG/actions/runs/39271172578): 16 pruebas de lógica, 2 de integridad del ensamblado, 14 recorridos de interfaz y compilación frontend correctos.

### Borrador multiplataforma 0.2.0

- [Desktop packages 39271172659](https://github.com/mar33k13/DRGG/actions/runs/39271172659): cuatro compilaciones y ensamblado completados correctamente desde `aba97259a369ba3d0cfdc58259f6afb654475b4b`; las cinco pruebas Rust pasaron en cada destino.
- Siete instaladores nuevos (Windows EXE/MSI, Mac ARM/Intel DMG, Linux AppImage/DEB/RPM), dos paquetes de actualización de Mac, siete firmas, `latest.json` y SHA-256: 18 assets. Comprobadas las arquitecturas Mach-O de ambos paquetes de Mac, versión e identificador. Verificadas las siete firmas y su versión firmada, los 17 hashes del manifiesto y todas las rutas de actualización.
- El mismo borrador se actualizó al tag `v0.2.0`, objetivo `aba97259`, conservando `draft: true` y `prerelease: true`. [Abrir borrador](https://github.com/mar33k13/DRGG/releases/tag/untagged-25ee3d171ba29b89bf37). GitHub devuelve tamaño, estado `uploaded` y SHA-256 idénticos a los archivos locales para los 18 assets. Los siete instaladores anteriores se retiraron después de verificar su copia local.
- [Sumas de los assets 0.2.0](releases/v0.2.0-SHA256SUMS.txt). Los cuatro destinos proceden de Actions; la app local del Mac fue compilada y probada en el propio equipo desde el mismo commit. Las firmas de actualización no sustituyen los certificados de distribución del sistema operativo.
- El borrador permanece fuera del canal estable. Los ensayos reales de actualización en Windows, Linux AppImage y Mac Intel continúan pendientes; la prueba real completada corresponde a Mac Apple Silicon.
