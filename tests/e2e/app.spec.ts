import { test, expect } from '@playwright/test';
test('manual workflow, real engines, priorities, persistence, duplicate and delete', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Ideas pequeñas. Juegos posibles.' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('home.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByLabel('Tu equipo', { exact: true }).selectOption('2-3');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Temática', { exact: true }).selectOption('workshop');
  await page.getByRole('radio', { name: 'Simulación', exact: true }).check();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('radio', { name: 'Unity', exact: true }).check();
  await expect(page.getByRole('radio', { name: 'Unity', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByLabel('Físicas', { exact: true }).fill('60');
  const values = await page
    .locator('input[type=range]')
    .evaluateAll((nodes) => nodes.map((n) => Number((n as HTMLInputElement).value)));
  expect(values.reduce((a, b) => a + b, 0)).toBe(100);
  await page.getByRole('button', { name: 'Ver concepto', exact: true }).click();
  await page.getByLabel('Nombre del concepto').fill('Taller orbital');
  await page.getByLabel('Notas', { exact: true }).fill('Una reparación. Un cliente.');
  if (await page.getByRole('status').isVisible()) {
    await page.getByRole('status').getByRole('button', { name: 'Cerrar' }).click();
  }
  await page.getByRole('heading', { name: 'Tu concepto.' }).focus();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath('concept.png'),
    fullPage: true,
    animations: 'disabled',
  });
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
test('shared layouts keep all stages, library and About inside the viewport', async ({ page }) => {
  for (const viewport of [
    { width: 1320, height: 900 },
    { width: 780, height: 620 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
    for (let step = 0; step < 5; step++) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      if (step === 2) {
        const engine = page.locator('[data-field=engine]');
        const before = await engine.boundingBox();
        await page.getByRole('radio', { name: 'Unity', exact: true }).check();
        await expect(
          page.getByRole('radio', { name: 'Unity', exact: true }),
        ).toHaveAccessibleDescription(/Componentes/);
        expect((await engine.boundingBox())!.height).toBeCloseTo(before!.height, 1);
      }
      const action = page.getByRole('button', {
        name: step === 4 ? 'Guardar concepto' : step === 3 ? 'Ver concepto' : 'Siguiente',
        exact: true,
      });
      await action.scrollIntoViewIfNeeded();
      await expect(action).toBeInViewport();
      if (step < 4) await action.click();
    }
    await page.getByRole('button', { name: /Biblioteca/ }).click();
    await page.getByRole('button', { name: 'Salir sin guardar', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    await page.getByRole('button', { name: 'Acerca de DRGG', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeInViewport();
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText(
      'Acerca de DRGG.',
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});

test('development model survives rolls, persistence and JSON export with visible guidance', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByRole('button', { name: /Híbrido/ }).click();
  await page.getByRole('checkbox', { name: 'Programación', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Arte', exact: true }).check();
  await page.getByRole('button', { name: 'Volver a sortear' }).click();
  await expect(page.getByRole('button', { name: /Híbrido/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('checkbox', { name: 'Programación', exact: true })).toBeChecked();
  await page.getByText('Cómo influye tu modelo', { exact: true }).click();
  await expect(page.getByText(/Escenario orientativo: el apoyo/)).toBeVisible();
  await page.getByRole('button', { name: 'Tu concepto', exact: false }).click();
  await page.getByLabel('Nombre del concepto').fill('Equipo híbrido');
  await page.getByRole('button', { name: 'Guardar concepto', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Concepto guardado');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('drgg.library.v1')!));
  expect(saved.version).toBe(2);
  expect(saved.concepts[0].development).toEqual({ mode: 'hybrid', areas: ['code', 'art'] });
  await page.reload();
  await page.getByRole('button', { name: /Biblioteca/ }).click();
  await page.getByRole('button', { name: 'Abrir', exact: true }).click();
  await expect(page.locator('.development-summary')).toContainText('Híbrido');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const downloaded = await downloadEvent;
  const stream = await downloaded.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.version).toBe(2);
  expect(exported.concept.development).toEqual(saved.concepts[0].development);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('.development-summary')).toContainText('Hybrid');
});

test('engine cards work by keyboard and Roblox remains coherent and locked', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByRole('button', { name: /Elige tus herramientas/ }).click();
  await page.getByRole('radio', { name: 'Godot', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Unity', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Roblox Studio', exact: true }).check();
  await expect(page.getByLabel('Plataforma', { exact: true })).toHaveValue('roblox');
  await expect(page.getByRole('radio', { name: '3D', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Bloquear: Motor', exact: true }).click();
  await page.getByRole('button', { name: 'Volver a sortear' }).click();
  await expect(page.getByRole('radio', { name: 'Roblox Studio', exact: true })).toBeChecked();
  expect(
    await page.locator('[data-field=engine]').evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await expect(page.getByRole('button', { name: 'Volver a sortear' })).toBeFocused();
});

test('motion preference persists, follows the system and leaves every mobile stage usable', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  expect(await page.locator('.ring-a').evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'orbit-a',
  );
  await page.getByRole('button', { name: 'Reducir animaciones', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  expect(await page.locator('.ring-a').evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  );
  await page.getByRole('button', { name: 'Reducir animaciones', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(
    page.getByRole('button', { name: 'Reducir animaciones', exact: true }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await page.getByRole('button', { name: /Principalmente con IA/ }).click();
  await page.getByRole('checkbox', { name: 'Programación', exact: true }).check();
  for (let step = 0; step < 5; step++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    expect(
      await page.locator('.stage-panel').evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    if (step < 4)
      await page
        .getByRole('button', { name: step === 3 ? 'Ver concepto' : 'Siguiente', exact: true })
        .click();
  }
  await expect(page.locator('.development-summary')).toContainText('Principalmente con IA');
  await page.getByLabel('Nombre del concepto').fill('Prototipo asistido');
  await page.getByRole('button', { name: 'Guardar concepto', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Concepto guardado', exact: true })).toBeVisible();
});

test('active concept and save state stay truthful across edits and reopening', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /01 \/ MANUAL/ }).click();
  await expect(page.locator('.save-state')).toHaveText('Sin guardar');
  await expect(page.locator('.step-progress')).toHaveText('Paso 1 de 5');
  await page.getByRole('button', { name: /Tu concepto/ }).click();
  await page.getByLabel('Nombre del concepto').fill('Mi concepto activo');
  await expect(page.locator('.active-context')).toHaveText('Mi concepto activo');
  await expect(page.locator('.save-state')).toHaveText('Sin guardar');
  await page.getByRole('button', { name: 'Guardar concepto', exact: true }).click();
  await expect(page.locator('.save-state')).toHaveText('Guardado');
  await page.getByLabel('Notas', { exact: true }).fill('Revisar una mecánica');
  await expect(page.locator('.save-state')).toHaveText('Cambios sin guardar');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('.save-state')).toHaveText('Unsaved changes');
  await expect(page.locator('.step-progress')).toHaveText('Step 5 of 5');
  await page.getByRole('button', { name: /Library/ }).click();
  await page.getByRole('button', { name: 'Leave without saving', exact: true }).click();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.locator('.save-state')).toHaveText('Saved');
  await expect(page.getByLabel('Notes', { exact: true })).toHaveValue('');
});
