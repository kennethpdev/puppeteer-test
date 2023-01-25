import puppeteer from 'puppeteer-core';
import { isEmpty } from 'lodash';
const ChromiumSolver = require('puppeteer-chromium-resolver');
import { findchrome } from './findchrome';

(async () => {
  const executablePath: string = await new Promise(async resolve => {
    const path = findchrome();
    const execPath = path.shift();
    if (!isEmpty(execPath)) return resolve(execPath || '');

    // use resolver if not found
    const stats = await ChromiumSolver({
      revision: '',
      detectionPath: '',
      folderName: '.chromium-browser-snapshots',
      defaultHosts: [
        'https://storage.googleapis.com',
        'https://npm.taobao.org/mirrors',
      ],
      hosts: [],
      cacheRevisions: 2,
      retry: 3,
      silent: true,
    });

    resolve(stats.executablePath);
  });

  console.log('chrome path:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
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
