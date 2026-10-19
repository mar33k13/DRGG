# Validación de DRGG 0.1

19 de octubre de 2026. Evidencia local, sin dar por verificados sistemas donde no se ha ejecutado la aplicación.

## Comprobado

- TypeScript estricto e interfaz de producción compilados.
- 11 pruebas de lógica: 1.000 generaciones coherentes, conservación y conflictos de bloqueos, todos los motores, presupuesto de 100 puntos tras 2.000 modificaciones, validación de JSON y exportación bilingüe.
- 5 recorridos Playwright en Chrome aislado: creación/edición/guardado/reapertura/duplicado/borrado/exportación; aleatoriedad y límites bloqueados; idioma y cambios sin guardar; importación válida/inválida; biblioteca dañada; diseño a 390 píxeles sin desbordamiento horizontal.
- Prueba Rust de reemplazo atómico y límites de lectura: 1 prueba superada.
- Compilación nativa local Apple Silicon: app y DMG.
- Ejecución macOS real: interfaz Tauri, creación de concepto, escritura en biblioteca, exportación JSON mediante diálogo nativo e importación del archivo exportado. JSON de salida comprobado: formato `drgg`, versión 1 y prioridades sumando 100.

## Límites

Windows, Linux y macOS Intel requieren compilación y pruebas de ejecución propias. Los workflows de Actions preparan esas compilaciones, pero su existencia no demuestra que hayan pasado. La firma/notarización no está configurada. No se han validado instaladores en equipos ajenos ni lectura de bibliotecas de versiones futuras. Las referencias de licencia de paquetes sin archivos de licencia propios deben revisarse antes de una distribución de producción.

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
