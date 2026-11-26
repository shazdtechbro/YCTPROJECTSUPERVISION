const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const output = process.env.YCT_TEST_OUTPUT || '/tmp/yct-feedback-browser';
fs.mkdirSync(output, { recursive: true });
let requestId = 0;
// Optional proxy bridge: curl uses the installed system CA bundle and verifies
// HTTPS. This preserves TLS validation where Chromium lacks the proxy CA.
async function verifiedRequest(route) {
  const id = ++requestId, headersFile = `${output}/${id}.headers`, bodyFile = `${output}/${id}.body`;
  const request = route.request();
  const args = ['--silent','--show-error','--location','--compressed','--max-time','30','--dump-header',headersFile,'--output',bodyFile,'--request',request.method()];
  for (const [key,value] of Object.entries(request.headers())) if (!['host','content-length','accept-encoding'].includes(key)) args.push('--header',`${key}: ${value}`);
  if (request.postData()) args.push('--data-binary','@-');
  args.push(request.url());
  try {
    await new Promise((resolve,reject) => { const child=spawn('curl',args); let error=''; child.stderr.on('data', d => error+=d); child.on('error',reject); child.on('exit', code => code===0 ? resolve() : reject(new Error(error))); child.stdin.end(request.postData()??''); });
    const blocks=fs.readFileSync(headersFile,'utf8').trim().split(/\r?\n\r?\n/), lines=blocks.at(-1).split(/\r?\n/);
    const status=Number(lines[0].split(' ')[1]), headers={};
    for (const line of lines.slice(1)) { const at=line.indexOf(':'); if(at>0) { const key=line.slice(0,at).toLowerCase(); if(!['content-encoding','content-length','transfer-encoding'].includes(key)) headers[key]=line.slice(at+1).trim(); } }
    await route.fulfill({status,headers,body:fs.readFileSync(bodyFile)});
  } finally { for(const file of [headersFile,bodyFile]) if(fs.existsSync(file)) fs.unlinkSync(file); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.YCT_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const base = process.env.YCT_BROWSER_BASE_URL || 'http://127.0.0.1:3100';
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      if (process.env.YCT_BROWSER_VERIFY_WITH_CURL === '1') await page.route('https://**/*', verifiedRequest);
      await page.goto(base + '/signup');
      const role = page.getByRole('combobox').first();
      assert.equal(await page.getByLabel('Email', { exact: true }).count(), 0);
      assert.equal(await page.getByLabel('Matriculation number', { exact: true }).count(), 1);
      await page.getByLabel('Password', { exact: true }).fill('private-password');
      await page.getByRole('button', { name: 'Show password', exact: true }).click();
      assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
      await page.getByRole('button', { name: 'Hide password', exact: true }).click();
      assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'password');
      await role.click(); await page.getByRole('option', { name: 'Supervisor', exact: true }).click();
      assert.equal(await page.getByLabel('Email', { exact: true }).count(), 1);
      assert.equal(await page.getByLabel('Matriculation number', { exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.goto(base + '/login');
      assert.equal(await page.getByLabel('Matriculation number', { exact: true }).count(), 1);
      assert.equal(await page.getByRole('button', { name: 'Continue with Google' }).count(), 0);
      await page.getByRole('combobox').click(); await page.getByRole('option', { name: 'Supervisor', exact: true }).click();
      assert.equal(await page.getByLabel('Email', { exact: true }).count(), 1);
      assert.equal(await page.getByLabel('Matriculation number', { exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.goto(base + '/');
      const badge = page.getByText('YABATECH HND · Final-year projects', { exact: true });
      assert.equal(await badge.evaluate(el => getComputedStyle(el).transform), 'none');
      console.log(`Passed feedback form checks at ${width}px`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
