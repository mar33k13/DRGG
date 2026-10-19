# Contribuir / Contributing

Mantengamos DRGG pequeño y útil. Referencia: [docs/PRODUCT.md](docs/PRODUCT.md).

1. Abre una incidencia para cambios grandes. Para correcciones pequeñas, envía una pull request.
2. Amplía `src/data/catalog.json` con IDs estables y etiquetas `es`/`en`. No elimines IDs sin una migración de conceptos guardados. Documenta compatibilidades.
3. Los géneros nuevos necesitan tres mecánicas en `src/data/mechanics.json` y asociaciones de subgénero. Traducciones de interfaz: `src/i18n.ts`.
4. Añade pruebas de comportamiento para generación, importación y almacenamiento. Ejecuta `pnpm test`, `pnpm build` y, si cambia el flujo, `pnpm test:ui`.
5. No añadas IA, telemetría, cuentas o servicios obligatorios sin discutirlo. Usa recursos originales o con licencia compatible y créditos.
6. Contribuciones bajo GPL-3.0-only, conservando créditos y avisos. No publiques secretos ni contenido personal.

**English:** Use stable catalog IDs, bilingual labels and documented compatibility. Update mechanics for new genres. Add behavior tests for logic changes and run the checks above. Submit original or appropriately licensed work under GPL-3.0-only. Discuss major changes first.
