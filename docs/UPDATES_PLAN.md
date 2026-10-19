# Propuesta: actualizar DRGG desde la aplicación

19 de octubre de 2026. Estado: diseño para una próxima versión; el borrador 0.1.0 actual no incluye un actualizador. No se han creado claves ni configurado secretos de publicación.

## Decisión propuesta

Usar el complemento oficial de actualización de Tauri y GitHub Releases, aprovechando el repositorio y la matriz de compilación existentes. Comprobación manual inicialmente, sin cuenta de usuario, servidor propio ni instalación silenciosa al arrancar. La generación y la biblioteca siguen funcionando sin conexión.

El complemento verifica paquetes firmados y admite un manifiesto estático por sistema/arquitectura. Proponemos `createUpdaterArtifacts: true`, HTTPS y clave pública incluida en DRGG. La clave privada se custodiaría como secreto de GitHub Actions y con copia de recuperación fuera del repositorio. La firma del actualizador es distinta de la firma/notarización exigida o recomendada por cada sistema. [Documentación de Tauri](https://v2.tauri.app/plugin/updater/).

## Experiencia de uso

En **Acerca de DRGG → Actualizaciones**:

1. Mostrar versión instalada, revisión y botón **Buscar actualizaciones**.
2. Si hay una versión nueva, mostrar novedades, versión y **Descargar actualización**. Si no hay conexión, indicar que no se pudo comprobar y ofrecer reintento; no confundirlo con estar actualizado.
3. Mostrar progreso de descarga y comprobación. Permitir seguir usando la app durante la descarga; evitar consultas o instalaciones simultáneas.
4. Ofrecer **Instalar y reiniciar** cuando el paquete esté listo. Ante cambios sin guardar: **Guardar e instalar**, **Descartar e instalar** o **Cancelar**. Un guardado fallido impide instalar. Guardar también el estado mínimo para recuperar el concepto abierto.
5. Tras reiniciar, mostrar la versión instalada y una confirmación discreta. Si falla la descarga o la comprobación, conservar la app actual y ofrecer reintento o acceso al instalador oficial.

El guardado se completa antes de llamar al instalador: en Windows Tauri cierra el proceso para instalar. Las notas de versión se muestran como texto seguro, sin ejecutar HTML remoto. Los estados y mensajes se traducen a ES/EN. [Comportamiento de instalación](https://v2.tauri.app/plugin/updater/#windows-before-exit-hook).

## Distribución

| Sistema                     | Ruta propuesta                                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS Apple Silicon e Intel | Paquete de actualización `.app.tar.gz` firmado; DMG para instalación inicial.                                                                                              |
| Windows x64                 | Instalador firmado correspondiente al formato instalado, con progreso visible. Verificar por separado NSIS/EXE y MSI; evitar cambiar de formato durante una actualización. |
| Linux x64, AppImage         | Actualización de AppImage firmada si la ubicación permite escritura.                                                                                                       |
| Linux, DEB/RPM              | Mostrar versión nueva y abrir el paquete correspondiente; conservar la instalación mediante el gestor de paquetes.                                                         |

Los formatos de actualización proceden de la [documentación oficial](https://v2.tauri.app/plugin/updater/#building). Las rutas por tipo de instalación y la experiencia de recuperación son decisiones propuestas para DRGG y necesitan pruebas reales.

## Versiones y publicación

- Primera entrega con actualizador, por ejemplo **0.2.0**, instalada manualmente. La 0.1.0 no puede incorporar esta función por sí sola. Probar después una actualización real a **0.2.1**.
- Una versión nueva por entrega; sincronizar package.json, Cargo y configuración Tauri. El borrador de prueba actual conserva 0.1.0 porque aún no se ha publicado; mostrar revisión de compilación en futuras entregas evitará ambigüedades.
- Canal estable inicial con `https://github.com/mar33k13/DRGG/releases/latest/download/latest.json`. Ese recurso aún no existe: se incorporaría al preparar la primera versión compatible.
- GitHub `latest` excluye borradores y prereleases. Por tanto, el borrador actual no se ofrecería a los usuarios. Un canal beta futuro necesita su propio manifiesto público; nunca incrustar un token de GitHub en la app. [Reglas de GitHub Releases](https://docs.github.com/en/rest/releases/releases#get-the-latest-release).
- Compilar los cuatro destinos sobre un mismo commit, reunir instaladores, firmas y manifiesto, validar todas las entradas y preparar un borrador completo. Publicar una versión estable solo después de revisar ese conjunto. Conservar los artefactos de versiones publicadas sin sustituirlos.
- La app solo consulta información de versión y descarga paquetes al solicitarlo. No enviar conceptos, notas o biblioteca; las peticiones siguen exponiendo al proveedor los metadatos normales de una conexión.

## Datos y recuperación

Antes de cualquier migración futura, crear una copia local de la biblioteca con su versión y verificar la escritura. Mantener la biblioteca fuera del paquete de aplicación. Si no se puede preservar el trabajo o crear la copia necesaria, explicar el fallo y detener la instalación/migración.

No prometer una vuelta automática a versiones antiguas: pueden no leer el formato nuevo. Documentar recuperación manual con instalador anterior y copia compatible, conservando también los datos recientes para evitar pérdidas. Tratar instalaciones sin permisos de escritura como un caso explícito con descarga manual.

## Entrega por partes

1. **Integración nativa y pruebas de estados:** dependencias Tauri, permisos mínimos, consulta/descarga separadas, comprobación de versión y de firmas; servicio de actualización independiente del generador.
2. **Interfaz y conservación del trabajo:** pantalla de actualizaciones, progreso, errores, novedades, guardado y reinicio. Reutilizar los componentes del [plan de interfaz](NEXT_UI.md).
3. **Compilación y distribución:** claves custodiadas, paquetes firmados, manifiesto completo, versiones y proceso de borrador/publicación. Tratar certificados de distribución de macOS/Windows como preparación independiente.
4. **Prueba entre dos versiones:** instalar A y actualizar a B en Windows, macOS ARM/Intel y Linux AppImage; comprobar bibliotecas, arquitectura, permisos, reinicio y versión. Para DEB/RPM, verificar la ruta al paquete correcto.

Criterios de cierre: actualización real completada por plataforma; firma alterada rechazada; fallo de red recuperable; biblioteca intacta; cambios sin guardar protegidos; cancelación sin pérdida; versión igual/inferior no instalada; borrador no ofrecido por el canal estable. Una compilación correcta por sí sola no acredita estos recorridos.
