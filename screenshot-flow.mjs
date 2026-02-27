import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, 'screenshots');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  // 1. Navigate to the app
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Screenshot 1: Initial page view
  await page.screenshot({ path: join(outputDir, '1-initial.png'), fullPage: false });
  console.log('Screenshot 1 saved: 1-initial.png');

  // 2. Scroll down
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(800);

  // Screenshot 2: Scrolled view
  await page.screenshot({ path: join(outputDir, '2-scrolled.png'), fullPage: false });
  console.log('Screenshot 2 saved: 2-scrolled.png');

  // 3. Click on a research card (View Details link or card link)
  const cardLink = page.locator('a[href^="/pesquisa/"]').first();
  const count = await cardLink.count();
  if (count > 0) {
    await cardLink.click();
    await page.waitForTimeout(1500);

    // Screenshot 3: Detail page
    await page.screenshot({ path: join(outputDir, '3-detail.png'), fullPage: true });
    console.log('Screenshot 3 saved: 3-detail.png');
  } else {
    // No research cards (e.g. login page) - take screenshot of current state
    await page.screenshot({ path: join(outputDir, '3-detail.png'), fullPage: true });
    console.log('Screenshot 3 saved (no cards found - may be login page): 3-detail.png');
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await browser.close();
}
