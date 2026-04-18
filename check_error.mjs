import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:8089', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('GOTO ERR', e.message));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log('ROOT HTML LENGTH:', rootHtml?.length);
  
  await browser.close();
})();
