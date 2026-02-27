import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, 'screenshots');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);

  const screenshotPath = join(outputDir, 'login.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await browser.close();
}
