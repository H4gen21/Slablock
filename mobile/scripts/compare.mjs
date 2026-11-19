import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOBILE_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(MOBILE_DIR, '..');
const REF_HTML_PATH = path.resolve(ROOT_DIR, 'docs', 'design', 'reference.html');
const COMPARE_DIR = path.resolve(MOBILE_DIR, 'compare');
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 860 }
];

const SCREENS = [
  'signin',
  'home',
  'collection',
  'scan',
  'activity',
  'profile',
  'detail-charizard',
  'detail-pikachu',
  'replay'
];

async function navigateReference(page, refUrl, screen) {
  await page.goto(`${refUrl}?screen=${screen}&demo=1`, {
    waitUntil: 'domcontentloaded'
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);

  if (screen === 'signin') {
    return;
  }

  // Click through Sign In -> Alex Tan if the reference doesn't auto-route via query param
  const googleBtn = page.getByText('Continue with Google', { exact: false });
  if ((await googleBtn.count()) > 0 && (await googleBtn.first().isVisible())) {
    await googleBtn.first().click();
    await page.waitForTimeout(200);
    const alexBtn = page.getByText('Alex Tan', { exact: false });
    if ((await alexBtn.count()) > 0 && (await alexBtn.first().isVisible())) {
      await alexBtn.first().click();
      await page.waitForTimeout(1050);
    }
  }

  if (screen === 'home') {
    return;
  }

  if (screen === 'collection') {
    const seeAll = page.getByText('See all', { exact: false });
    if ((await seeAll.count()) > 0 && (await seeAll.first().isVisible())) {
      await seeAll.first().click();
    } else {
      const tab = page.locator('[aria-label="Collection"], [data-tab="collection"]').first();
      if ((await tab.count()) > 0) await tab.click();
    }
    await page.waitForTimeout(300);
    return;
  }

  if (screen === 'activity') {
    const bell = page.locator('[aria-label*="Activity"], [aria-label*="Notifications"], [data-tab="activity"]').first();
    if ((await bell.count()) > 0) await bell.click();
    await page.waitForTimeout(300);
    return;
  }

  if (screen === 'profile') {
    const prof = page.locator('[aria-label*="Profile"], [aria-label*="Open profile"], [data-tab="profile"]').first();
    if ((await prof.count()) > 0) await prof.click();
    await page.waitForTimeout(300);
    return;
  }

  // Scan / Detail / Replay flows go via "Scan a slab"
  const scanBtn = page.getByText('Scan a slab', { exact: false });
  if ((await scanBtn.count()) > 0 && (await scanBtn.first().isVisible())) {
    await scanBtn.first().click();
    await page.waitForTimeout(300);
  }

  if (screen === 'scan') {
    return;
  }

  if (screen === 'detail-charizard') {
    const row = page.getByText('Charizard #4', { exact: false });
    if ((await row.count()) > 0) {
      await row.first().click();
      await page.waitForTimeout(1500);
    }
    return;
  }

  if (screen === 'detail-pikachu') {
    const row = page.getByText('Pikachu #58', { exact: false });
    if ((await row.count()) > 0) {
      await row.first().click();
      await page.waitForTimeout(1500);
    }
    return;
  }

  if (screen === 'replay') {
    const row = page.getByText('Replay', { exact: false });
    if ((await row.count()) > 0) {
      await row.last().click();
      await page.waitForTimeout(1500);
    }
  }
}

async function buildSideBySideDiff(browser, refPath, appPath, diffPath, width, height) {
  const page = await browser.newPage({
    viewport: { width: width * 2 + 24, height: height + 40 }
  });

  const refB64 = fs.existsSync(refPath)
    ? fs.readFileSync(refPath).toString('base64')
    : null;
  const appB64 = fs.readFileSync(appPath).toString('base64');

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0;
    background: #1B1534;
    color: #FFFFFF;
    font-family: system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .labels {
    display: flex;
    width: 100%;
    height: 32px;
    align-items: center;
    justify-content: space-around;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .row {
    display: flex;
    gap: 8px;
    padding: 4px 8px;
  }
  img, .missing {
    width: ${width}px;
    height: ${height}px;
    object-fit: cover;
    border-radius: 6px;
    background: #2E147A;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>
<body>
  <div class="labels">
    <span>REFERENCE (${width}×${height})</span>
    <span>APP (${width}×${height})</span>
  </div>
  <div class="row">
    ${
      refB64
        ? `<img src="data:image/png;base64,${refB64}" />`
        : `<div class="missing">docs/design/reference.html not found</div>`
    }
    <img src="data:image/png;base64,${appB64}" />
  </div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: diffPath });
  await page.close();
}

async function main() {
  fs.mkdirSync(COMPARE_DIR, { recursive: true });
  const hasRef = fs.existsSync(REF_HTML_PATH);
  const refUrl = hasRef ? pathToFileURL(REF_HTML_PATH).href : null;

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce'
    });

    for (const screen of SCREENS) {
      const refPng = path.join(COMPARE_DIR, `${screen}-${vp.width}-ref.png`);
      const appPng = path.join(COMPARE_DIR, `${screen}-${vp.width}-app.png`);
      const diffPng = path.join(COMPARE_DIR, `${screen}-${vp.width}-diff.png`);

      if (hasRef && refUrl) {
        const refPage = await context.newPage();
        await navigateReference(refPage, refUrl, screen);
        await refPage.screenshot({ path: refPng });
        await refPage.close();
      }

      const appPage = await context.newPage();
      await appPage.goto(`${APP_BASE_URL}/?screen=${screen}&demo=1`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await appPage.waitForFunction(
        () => (document.body?.innerText || '').trim().length > 10,
        { timeout: 60000 }
      );
      await appPage.evaluate(() => document.fonts.ready);
      await appPage.waitForTimeout(800);
      await appPage.screenshot({ path: appPng });
      await appPage.close();

      await buildSideBySideDiff(
        browser,
        refPng,
        appPng,
        diffPng,
        vp.width,
        vp.height
      );
      console.log(`Captured ${screen} @ ${vp.width}×${vp.height}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`Done! Saved comparison images to ${COMPARE_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
