// Renders .github/assets/*.html to PNG (2x). Usage: node scripts/render-banner.mjs
// Uses sharp (if present) to palette-quantise the gradients so PNGs stay small.
import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { writeFile } from 'node:fs/promises';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../.github/assets');
const jobs = [
  ['banner', 1600, 520],
  ['social-preview', 1280, 640],
];
let sharp;
try { sharp = (await import('sharp')).default; } catch { /* optional */ }

const browser = await chromium.launch();
try {
  for (const [name, width, height] of jobs) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(resolve(dir, `${name}.html`)).href);
    await page.evaluate(() => document.fonts.ready);
    let png = await page.screenshot({ clip: { x: 0, y: 0, width, height } });
    if (sharp) png = await sharp(png).png({ palette: true, quality: 90, effort: 10, dither: 1 }).toBuffer();
    await writeFile(resolve(dir, `${name}.png`), png);
    await page.close();
    console.log(`rendered ${name}.png (${Math.round(png.length / 1024)} KB)`);
  }
} finally {
  await browser.close();
}
