/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — PDF Engine Direct Verification
   ════════════════════════════════════════════════════════ */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

console.log('Testing PDF Engine with browser:', BROWSER_PATH);

async function testPdf() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setContent(`<!DOCTYPE html><html><head><style>@page{size:A4;margin:15mm;}body{font-family:sans-serif;}</style></head><body><h1>Official MCGM PDF Test</h1><p>Testing direct PDF generation.</p></body></html>`);
  
  const pdfBuf = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  fs.writeFileSync('test_direct.pdf', pdfBuf);
  console.log('Direct PDF generated successfully:', pdfBuf.length, 'bytes');
}

testPdf().catch(err => {
  console.error('Test PDF failed:', err);
  process.exit(1);
});
