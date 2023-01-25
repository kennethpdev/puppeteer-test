"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _puppeteerCore = /*#__PURE__*/ _interopRequireDefault(require("puppeteer-core"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ChromiumSolver = require('puppeteer-chromium-resolver');
(async ()=>{
    // use resolver if not found
    const stats = await ChromiumSolver({
        revision: '',
        detectionPath: '',
        folderName: '.chromium-browser-snapshots',
        defaultHosts: [
            'https://storage.googleapis.com',
            'https://npm.taobao.org/mirrors'
        ],
        hosts: [],
        cacheRevisions: 2,
        retry: 3,
        silent: true
    });
    console.log('chrome path:', stats.executablePath);
    const browser = await _puppeteerCore.default.launch({
        executablePath: stats.executablePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-gpu',
            '--single-process',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0');
    await page.goto('http://google.com', {
        waitUntil: 'networkidle0'
    });
    await page.screenshot({
        path: 'screenshot.png'
    });
    console.log('all done');
    await browser.close();
})();
