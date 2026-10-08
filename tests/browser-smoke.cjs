const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const base = process.env.YCT_TEST_BASE_URL || 'http://127.0.0.1:3002';
const output = process.env.YCT_TEST_OUTPUT || '/tmp/yct-browser-results';
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
 const browser = await chromium.launch({ executablePath: process.env.YCT_CHROMIUM_PATH || '/usr/bin/chromium', headless:true, args:['--no-sandbox'] });
 const results=[];
 try {
  for (const width of [320,375,768,1440]) {
   const context=await browser.newContext({viewport:{width,height:900}});
   if(process.env.YCT_BROWSER_VERIFY_WITH_CURL==='1') await context.route('https://**/*',verifiedRequest);
   const page=await context.newPage(), errors=[];
   page.on('pageerror', e=>errors.push(e.message));
   for (const pathname of ['/','/login','/signup']) {
    const response=await page.goto(base+pathname,{waitUntil:'networkidle',timeout:60000});
    assert.equal(response.status(),200,`${pathname} HTTP status`);
    assert.ok(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${pathname} overflow at ${width}`);
    assert.equal(await page.locator('h1').count(),1);
    assert.ok(await page.locator('img[src="/yabatech-logo.png"]').first().evaluate(e=>e.complete && e.naturalWidth>0),`YABATECH logo loaded on ${pathname}`);
    if(pathname==='/signup') {
     await page.getByText('Supervisor',{exact:true}).click();
     assert.equal(await page.locator('#matric').count(),0,'staff do not need a matric number');
     await page.getByText('Student',{exact:true}).click();
     await page.locator('#matric').fill('P/ND/24/3211001');
     if (width <= 640) assert.ok(parseFloat(await page.locator('#matric').evaluate(e=>getComputedStyle(e).fontSize))>=16,`mobile input text remains legible at ${width}`);
    }
    await page.screenshot({path:`${output}/${width}-${pathname==='/'?'home':pathname.slice(1)}.png`,fullPage:true});
    results.push({width,path:pathname,status:response.status()});
   }
   assert.deepEqual(errors,[],`JavaScript errors at ${width}`);
   await context.close();
  }
  console.log(JSON.stringify({passed:results.length,results},null,2));
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
