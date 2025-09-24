/*
  Generate PNG mockups from HTML files in docs/reports/mockups using Puppeteer.
  Usage:
    cd backend && node scripts/generate-report-mockups.js

  Notes:
  - Requires puppeteer to be installed (already a backend dependency).
  - Outputs PNGs to docs/reports/mockups/png.
*/
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..', '..');
const htmlDir = path.join(ROOT, 'docs', 'reports', 'mockups');
const outDir = path.join(htmlDir, 'png');

const files = [
  'sales-by-month.html',
  'sales-by-salesman.html',
  'sales-by-customer.html',
  'tax-by-state.html',
  'unpaid-invoices.html',
  'ar-aging.html',
];

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  try {
    for (const file of files) {
      const page = await browser.newPage();
      const filePath = 'file://' + path.join(htmlDir, file);
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
      await page.goto(filePath, { waitUntil: 'networkidle0' });
      const outPath = path.join(outDir, file.replace('.html', '.png'));
      await page.screenshot({ path: outPath, fullPage: true });
      await page.close();
      console.log('Saved', outPath);
    }
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});

