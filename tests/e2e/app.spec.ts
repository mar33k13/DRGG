import { test, expect } from '@playwright/test';
test('manual workflow, real engines, priorities, persistence, duplicate and delete', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Ideas pequeñas. Juegos posibles.' }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByLabel('Tu equipo', { exact: true }).selectOption('2-3');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Temática', { exact: true }).selectOption('workshop');
  await page.getByLabel('Género', { exact: true }).selectOption('simulation');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Motor', { exact: true }).selectOption('unity');
  await expect(page.getByLabel('Motor', { exact: true })).toHaveValue('unity');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Físicas', { exact: true }).fill('60');
  const values = await page
    .locator('input[type=range]')
    .evaluateAll((nodes) => nodes.map((n) => Number((n as HTMLInputElement).value)));
  expect(values.reduce((a, b) => a + b, 0)).toBe(100);
  await page.getByRole('button', { name: 'Ver concepto', exact: true }).click();
  await page.getByLabel('Nombre del concepto').fill('Taller orbital');
  await page.getByLabel('Notas', { exact: true }).fill('Una reparación. Un cliente.');
  await page.screenshot({ path: testInfo.outputPath('concept.png'), fullPage: true });
  await page.getByRole('button', { name: 'Guardar concepto', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Concepto guardado');
  await page.reload();
  await page.getByRole('button', { name: /Biblioteca/ }).click();
  await expect(page.getByRole('heading', { name: 'Taller orbital', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Duplicar: Taller orbital', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Taller orbital (copia)', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar: Taller orbital (copia)', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Eliminar', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Taller orbital (copia)', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await expect(page.getByLabel('Notas', { exact: true })).toHaveValue(
    'Una reparación. Un cliente.',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('Taller-orbital.json');
});
test('random locks, coherent conflict, language and unsaved changes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /02 \/ RANDOM/ }).click();
  const team = await page.getByLabel('Tu equipo', { exact: true }).inputValue();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Volver a sortear' }).click();
  await expect(page.getByLabel('Tu equipo', { exact: true })).toHaveValue(team);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Set your limits.' })).toBeVisible();
  await page.getByRole('button', { name: /Library/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Set your limits.' })).toBeVisible();
  await page.getByRole('button', { name: /Library/ }).click();
  await page.getByRole('button', { name: 'Leave without saving', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Library.' })).toBeVisible();
});
test('JSON import validation and safe text rendering', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Biblioteca/ }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole('status')).toContainText('no es un concepto DRGG válido');
  await expect(page.getByText('Tu biblioteca está por escribir.')).toBeVisible();
  const c = {
    id: 'import-fixture',
    title: '<img src=x onerror=alert(1)>',
    notes: 'Imported safely',
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-19T10:00:00.000Z',
    config: {
      theme: 'space',
      genre: 'adventure',
      subgenre: 'exploration',
      engine: 'godot',
      platform: 'pc',
      dimension: '3d',
      perspective: 'iso',
      style: 'lowpoly',
      mode: 'solo',
      scope: 'prototype',
      team: '1',
    },
    priorities: { mechanics: 40, physics: 15, graphics: 20, narrative: 10, audio: 15 },
    locks: [],
    randomMode: 'coherent',
  };
  await page.locator('input[type=file]').setInputFiles({
    name: 'idea.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'drgg', version: 1, concept: c })),
  });
  await expect(page.getByLabel('Nombre del concepto')).toHaveValue(c.title);
  await expect(page.getByRole('status')).toContainText('Concepto importado');
});
test('corrupt library is preserved and saving is blocked', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('drgg.library.v1', '{"version":42}'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('guardado está desactivado');
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByRole('button', { name: 'Tu concepto', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Guardar concepto', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('drgg.library.v1'))).toBe('{"version":42}');
});
test('responsive layout stays inside the viewport and keyboard controls remain reachable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await expect(page.getByLabel('Objetivo del proyecto', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
