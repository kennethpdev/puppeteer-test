import puppeteer from 'puppeteer-core';
import { findchrome } from './findchrome';

(async () => {
  const path = findchrome();
  console.log('chrome path:', path);

  const browser = await puppeteer.launch({
    executablePath: '/bin/chromium-browser',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--single-process',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0'
  );
  await page.goto('http://google.com', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot.png' });

  console.log('all done');

  await browser.close();
})();
