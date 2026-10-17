import { chromium } from 'playwright';

async function testGithub() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://github.com', { waitUntil: 'load', timeout: 15000 });
  const domUrls = await page.evaluate(() => {
    const urls = [];
    document.querySelectorAll('script[src], link[href], img[src]').forEach((el) => {
      const u = el.src || el.href;
      if (u && (u.startsWith('http://') || u.startsWith('https://'))) {
        urls.push({ url: u, tag: el.tagName });
      }
    });
    return urls;
  });

  console.log('GitHub DOM URLs discovered:', domUrls.length);
  console.log('Sample:', domUrls.slice(0, 5));
  await browser.close();
}

testGithub().catch(console.error);
