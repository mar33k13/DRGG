# Actualizaciones desde DRGG

19 de octubre de 2026. Implementado en 0.2.0. La primera instalación de esta versión se hace mediante instalador; 0.1.0 no tiene actualizador.

## Experiencia

En **Acerca de DRGG → Actualizaciones**, la app muestra versión y revisión. La consulta es manual: no hay comprobación al arrancar, telemetría ni envío de conceptos o notas. Solo se accede a GitHub al solicitar una comprobación/descarga. Generación y biblioteca funcionan sin conexión.

La consulta distingue una versión vigente de un fallo de conexión o canal todavía no disponible. Una versión nueva muestra novedades como texto seguro. Se puede seguir usando la app mientras descarga; el progreso no implica que la firma ya esté verificada. Solo un paquete verificado habilita **Instalar y reiniciar**. No se ejecutan dos operaciones a la vez.

Antes de reiniciar, los cambios pendientes ofrecen **Guardar e instalar**, **Descartar e instalar** o **Cancelar**. Un fallo al guardar detiene el proceso. La parte nativa verifica de nuevo el paquete, crea una copia exacta de la biblioteca en `backups/` y escribe el concepto/pantalla que se recuperarán al arrancar. Si falla la copia o el registro de sesión, no instala. El archivo de biblioteca permanece fuera del paquete.

## Integración y formatos

Se usa `tauri-plugin-updater`, con clave pública incluida, HTTPS, rechazo de versiones iguales/inferiores o prerelease y `requireSignedVersion: true`. La firma debe vincular también la versión anunciada. Los comandos nativos mantienen el paquete en memoria y restringen las URLs al repositorio oficial. El renderer no recibe permisos genéricos de updater/opener ni URLs arbitrarias para abrir. [Plugin oficial](https://v2.tauri.app/plugin/updater/).

| Instalación                      | Comportamiento                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| macOS Apple Silicon / Intel      | `.app.tar.gz` firmado, instalación y reinicio; DMG para instalación inicial.              |
| Windows EXE / NSIS               | Actualiza con EXE firmado, asistente pasivo visible y reinicio.                           |
| Windows MSI                      | Usa su propio MSI firmado; no cambia a NSIS.                                              |
| Linux AppImage                   | Actualiza el AppImage si su ubicación permite escritura.                                  |
| Linux DEB / RPM                  | Consulta la versión y abre el paquete oficial correspondiente para el gestor de paquetes. |
| Desarrollo o formato desconocido | Descarga manual; instalación integrada deshabilitada.                                     |

La firma del actualizador es independiente de los certificados de distribución Windows y de la notarización Apple, aún no configurados. No se promete reversión automática de versiones. Para recuperar una versión anterior, conservar primero los datos actuales y usar un instalador y una copia de biblioteca compatibles.

## Compilación y publicación

- La clave privada está fuera del repositorio, con una copia local protegida y el secreto cifrado `TAURI_SIGNING_PRIVATE_KEY` en el repositorio DRGG de GitHub. Nunca se incluye en código, logs, instaladores ni manifiestos. No rotarla sin planificar la transición de clientes que confían en la clave anterior.
- Sincronizar versiones de package.json, Cargo y tauri.conf.json y añadir `docs/releases/VERSION.md`.
- Actions compila los cuatro destinos desde un commit, genera firmas y reúne todo. Los archivos de actualización de Mac incluyen arquitectura en el nombre.
- `scripts/prepare-release.mjs` exige los nueve paquetes (siete instaladores y dos actualizadores de Mac), verifica las firmas de los cinco formatos de actualización y su versión firmada, genera `latest.json` y SHA-256. Valida cualquier otra firma presente. Windows tiene entradas independientes NSIS/MSI.
- `workflow_dispatch` produce `drgg-release-complete` sin publicar. Un tag `vVERSION` prepara únicamente un borrador y rechaza sobrescribir una release ya publicada.
- El canal es `https://github.com/mar33k13/DRGG/releases/latest/download/latest.json`. GitHub excluye borradores y prereleases del canal estable. Hasta publicar una release estable con ese asset, la app indicará que el canal no está disponible. Nunca incrustar un token de GitHub en la app. [GitHub Releases](https://docs.github.com/en/rest/releases/releases#get-the-latest-release).

## Evidencia y límites de validación

- macOS Apple Silicon: recorrido real 0.2.0 → 0.2.1 con dos builds de ensayo, firma inválida rechazada, reintento válido, cancelación, guardado previo, instalación, reinicio y recuperación del concepto con sus notas. Biblioteca y backup idénticos byte por byte. Versiones iguales e inferiores no ofrecidas; fallo de conexión real distinguido de estar actualizado.
- El ensayo usa un identificador `.update-test`, una clave de prueba y servidor loopback aislados. La feature `updater-e2e` rechaza arrancar con el identificador de producción. El transporte HTTP solo está en la configuración de prueba; no se distribuye ni se habilita en los builds normales.
- Pruebas de interfaz cubren error de guardado, descarte sin persistir, descarga en segundo plano, errores, notas como texto, rutas manuales, recuperación y ES/EN en vistas pequeñas. Pruebas nativas cubren copia, límites, navegación y origen de descarga. El ensamblador rechaza payload, firma, versión y claves alterados o destinos ausentes.
- Las compilaciones y pruebas automatizadas de Windows, Linux y Mac Intel se registran en [VALIDATION.md](VALIDATION.md). Un recorrido real entre versiones en esos tres entornos sigue pendiente: compilar no demuestra instalación/reinicio ni todos los casos de permisos del sistema. La entrega permanece como borrador de prueba.

## Repetir el ensayo local

Crear dos configuraciones locales no versionadas con versiones A/B, productName de prueba, identificador terminado en `.update-test`, clave propia y endpoint `http://127.0.0.1:18472/latest.json`. Compilar ambas con `pnpm tauri build --features updater-e2e --config RUTA --bundles app`, proporcionando la clave por variable de entorno. Servir el `.app.tar.gz` de B y su firma, instalar A en un directorio de prueba y completar el recorrido en su UI. Alterar primero un byte del paquete para comprobar el rechazo. No usar la biblioteca ni el identificador de producción.
