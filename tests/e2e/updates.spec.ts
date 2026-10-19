import { test, expect, type Page } from '@playwright/test';
async function nativePage(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript((config) => {
    window.updateMockConfig = config;
  }, settings);
  await page.route('**/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace('/src/main.tsx', '/tests/e2e/update-mock.ts'),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Acerca de DRGG', exact: true }).click();
}
async function readyUpdate(page: Page) {
  await page.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await page.getByRole('button', { name: 'Descargar actualización' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '50');
  await page.evaluate(() => window.updateMock.finish?.());
  await expect(
    page.getByRole('button', { name: 'Instalar y reiniciar', exact: true }),
  ).toBeVisible();
}
test('manual checks, network retry, verified download, persistent progress and safe notes', async ({
  page,
}) => {
  await nativePage(page);
  expect(
    await page.evaluate(() => window.updateMock.calls.filter((c) => c === 'check_update')),
  ).toHaveLength(0);
  await page.evaluate(() => {
    window.updateMock.checkError = 'network';
  });
  await page.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await expect(page.getByText('No se pudo conectar.', { exact: false })).toBeVisible();
  await expect(page.getByText('Tienes la versión estable más reciente.')).toHaveCount(0);
  await page.evaluate(() => {
    window.updateMock.checkError = '';
  });
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await page.getByText('Novedades', { exact: true }).click();
  await expect(page.locator('.update-notes p')).toContainText('<b>Notas seguras</b>');
  await expect(page.locator('.update-notes b')).toHaveCount(0);
  await page.getByRole('button', { name: 'Descargar actualización' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '50');
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.evaluate(() => window.updateMock.finish?.());
  await page.getByRole('button', { name: 'Acerca de DRGG', exact: true }).click();
  await expect(page.getByText('Paquete verificado.', { exact: false })).toBeVisible();
});
test('invalid signature cannot install and can be downloaded again', async ({ page }) => {
  await nativePage(page);
  await page.evaluate(() => {
    window.updateMock.downloadError = 'signature';
  });
  await page.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await page.getByRole('button', { name: 'Descargar actualización' }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await page.evaluate(() => window.updateMock.finish?.());
  await expect(page.getByText('La firma o la versión', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Instalar y reiniciar' })).toHaveCount(0);
  await page.evaluate(() => {
    window.updateMock.downloadError = '';
  });
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await page.evaluate(() => window.updateMock.finish?.());
  await expect(page.getByRole('button', { name: 'Instalar y reiniciar' })).toBeVisible();
});
test('unsaved changes: cancel, failed save blocks install, successful save precedes install', async ({
  page,
}) => {
  await nativePage(page);
  await readyUpdate(page);
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByRole('button', { name: /Tu concepto/ }).click();
  await page.getByLabel('Nombre del concepto').fill('Conservar antes de actualizar');
  await page.getByRole('button', { name: 'Acerca de DRGG', exact: true }).click();
  await page.getByRole('button', { name: 'Instalar y reiniciar', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await page.evaluate(() => window.updateMock.installed)).toBeNull();
  await page.getByRole('button', { name: 'Instalar y reiniciar', exact: true }).click();
  await page.evaluate(() => {
    window.updateMock.saveError = true;
  });
  await page.getByRole('button', { name: 'Guardar e instalar', exact: true }).click();
  await expect(page.locator('.toast')).toBeVisible();
  expect(await page.evaluate(() => window.updateMock.installed)).toBeNull();
  await page.evaluate(() => {
    window.updateMock.saveError = false;
  });
  await page.getByRole('button', { name: 'Instalar y reiniciar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar e instalar', exact: true }).click();
  await expect(page.getByText('No se pudo instalar.', { exact: false })).toBeVisible();
  const evidence = await page.evaluate(() => ({
    calls: window.updateMock.calls,
    install: window.updateMock.installed,
    library: JSON.parse(localStorage.getItem('drgg.library.v1')!),
  }));
  expect(evidence.calls.lastIndexOf('save_library')).toBeLessThan(
    evidence.calls.lastIndexOf('install_update'),
  );
  expect(evidence.install).toEqual({
    choice: { conceptId: evidence.library.concepts[0].id, screen: 'wizard', step: 4 },
  });
  expect(evidence.library.concepts[0].title).toBe('Conservar antes de actualizar');
});
test('discard does not persist a new unsaved concept; unavailable channel never claims current', async ({
  page,
}) => {
  await nativePage(page);
  await page.evaluate(() => {
    window.updateMock.checkError = 'channel';
  });
  await page.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await expect(page.getByText('El canal estable', { exact: false })).toBeVisible();
  await page.evaluate(() => {
    window.updateMock.checkError = '';
  });
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await page.getByRole('button', { name: 'Descargar actualización' }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await page.evaluate(() => window.updateMock.finish?.());
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByLabel('Tu equipo', { exact: true }).selectOption('2-3');
  await page.getByRole('button', { name: 'Acerca de DRGG', exact: true }).click();
  await page.getByRole('button', { name: 'Instalar y reiniciar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar e instalar', exact: true }).click();
  await expect(page.getByText('No se pudo instalar.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('drgg.library.v1'))).toBeNull();
  expect(await page.evaluate(() => window.updateMock.installed)).toEqual({
    choice: { conceptId: null, screen: 'home', step: 0 },
  });
});

test('manual packages open official downloads and current version is reported only after success', async ({
  page,
}) => {
  await nativePage(page, { manual: true });
  await page.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await expect(page.getByText('Este formato se actualiza', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar actualización' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Descargas oficiales' }).click();
  expect(await page.evaluate(() => window.updateMock.calls)).toContain('open_update_download');
  await page.reload();
  await page.evaluate(() => {
    window.updateMock.current = true;
  });
  await page.getByRole('button', { name: 'Acerca de DRGG', exact: true }).click();
  await page.getByRole('button', { name: 'Buscar actualizaciones' }).click();
  await expect(page.getByText('Tienes la versión estable más reciente.')).toBeVisible();
});
test('completed update restores saved concept and update panel fits small viewports in English', async ({
  page,
}) => {
  // Create a valid concept through the existing workflow, then simulate the native restart marker.
  await nativePage(page);
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByRole('button', { name: /Tu concepto/ }).click();
  await page.getByLabel('Nombre del concepto').fill('Sesión recuperada');
  await page.getByRole('button', { name: 'Guardar concepto', exact: true }).click();
  const id = await page.evaluate(
    () => JSON.parse(localStorage.getItem('drgg.library.v1')!).concepts[0].id,
  );
  await page.addInitScript((conceptId) => {
    window.updateMockConfig = {
      resume: { updated: true, version: '0.2.1', choice: { conceptId, screen: 'wizard', step: 4 } },
    };
  }, id);
  await page.reload();
  await expect(page.getByLabel('Nombre del concepto')).toHaveValue('Sesión recuperada');
  await expect(page.locator('.toast')).toContainText('DRGG se ha actualizado a 0.2.1');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  for (const viewport of [
    { width: 780, height: 620 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'About DRGG', exact: true }).click();
    await page.getByRole('button', { name: 'Check for updates' }).click();
    await expect(page.getByRole('button', { name: 'Download update' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    // Return the state to idle for the next viewport without losing the recovered concept.
    if (viewport.width === 780) {
      await page.reload();
      await expect(page.getByLabel('Concept name')).toHaveValue('Sesión recuperada');
    }
  }
});
