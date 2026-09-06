const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', exception => {
    console.log(`Uncaught exception: "${exception}"`);
    console.log(exception.stack);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console error: "${msg.text()}"`);
    }
  });
  await page.goto('http://localhost:5173/perkuliahan/materi/1', { waitUntil: 'networkidle' });
  await browser.close();
})();
