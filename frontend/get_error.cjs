const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('Page Error:', err.message);
    console.log('Stack:', err.stack);
  });

  await page.goto('http://localhost:5173/perkuliahan/materi/1', { waitUntil: 'networkidle0' });
  await browser.close();
})();
