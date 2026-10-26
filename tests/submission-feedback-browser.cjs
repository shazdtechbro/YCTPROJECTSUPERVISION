/** Exercise the real React components with deterministic data and transfer doubles.
 * Run: YCT_ESBUILD=/path/to/esbuild node tests/submission-feedback-browser.cjs
 * esbuild is an external test tool; it is not needed by the deployed app.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createServer } = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'yct-review-ui-'));
const esbuild = process.env.YCT_ESBUILD;
if (!esbuild) throw new Error('Set YCT_ESBUILD to the esbuild executable');
fs.writeFileSync(path.join(work, 'data.js'), `export async function getSubmissionsPage(){return { items: [window.fixture], hasMore:false, cursor:null }};`);
fs.writeFileSync(path.join(work, 'api.js'), `export const api = { setSubmissionStatus: async (...args) => {window.saved=args;}, createSubmission: async (...args) => {window.uploaded=args;} };`);
fs.writeFileSync(path.join(work, 'storage.js'), `export const ACCEPT_ATTR='.pdf,.docx'; export const validateSubmissionFile=()=>null; export const uploadSubmissionFile=async ({file})=>({storagePath:'projects/p/submissions/revised/file.pdf',fileName:file.name,fileSize:file.size});`);
fs.writeFileSync(path.join(work, 'entry.jsx'), `import React from 'react';import {createRoot} from 'react-dom/client';
import {SubmissionRow} from '${root}/components/shared/submission-list';
import {FeedbackPanel} from '${root}/components/shared/feedback-panel';
const mode=new URLSearchParams(location.search).get('mode');
window.fixture={id:'s',title:'Approved project topic',kind:mode==='final'?'final':'proposal',status:'changes_requested',version:2,fileName:'proposal-v2.pdf',fileSize:100,reviewFeedback:'Please expand the methodology',revisionDueDate:'2026-11-10',createdAt:null};
const older={...window.fixture,id:'old',version:1,fileName:'proposal-v1.pdf'};
createRoot(document.getElementById('root')).render(mode==='feedback'?<FeedbackPanel projectId="p"/>:<ul><SubmissionRow projectId="p" projectTopic="Approved project topic" submission={window.fixture} versions={[window.fixture,older]} canReview={mode!=='student'} canUpload={mode==='student'} allChaptersApproved={mode==='final'} onChanged={()=>{}}/></ul>);`);
const bundler = require(path.resolve(path.dirname(esbuild), '../esbuild/lib/main.js'));

(async()=>{
 await bundler.build({entryPoints:[path.join(work,'entry.jsx')],bundle:true,format:'iife',jsx:'automatic',outfile:path.join(work,'bundle.js'),tsconfig:path.join(root,'tsconfig.json'),alias:{react:path.join(root,'node_modules/react'),'react-dom':path.join(root,'node_modules/react-dom'),'@/lib/api':path.join(work,'api.js'),'@/lib/storage/submissions':path.join(work,'storage.js')},plugins:[{name:'data-and-discussion-doubles',setup(build){
 build.onResolve({filter:/^@\/lib\/firestore$/},()=>({path:path.join(work,'data.js')}));
 build.onLoad({filter:/comment-thread\.tsx$/},()=>({contents:'export function CommentThread(){return <div>Discussion thread</div>}',loader:'jsx'}));
 }}]});
 const styles = fs.readdirSync(path.join(root,'.next/static/css')).filter(n=>n.endsWith('.css')).map(n=>fs.readFileSync(path.join(root,'.next/static/css',n),'utf8')).join('\n');
 const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url.startsWith('/bundle.js')?'text/javascript':'text/html');res.end(req.url.startsWith('/bundle.js')?fs.readFileSync(path.join(work,'bundle.js')):`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.YCT_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(base+'/?mode=supervisor');
  await page.getByText('Review and feedback',{exact:true}).click();
  assert.equal(await page.getByLabel('Final grade (0–100)').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByLabel('Review decision',{exact:true}).click();
  assert.deepEqual(await page.getByRole('option').allTextContents(),['Changes requested','Approved']);
  await page.getByRole('option',{name:'Changes requested',exact:true}).click();
  await page.getByLabel('Comment / feedback',{exact:true}).fill('Add a clearer methodology');
  await page.getByLabel('Revision due date (optional)',{exact:true}).fill('2026-11-12');
  await page.getByRole('button',{name:'Save review',exact:true}).click();
  await page.waitForFunction(()=>!!window.saved);
  assert.deepEqual(await page.evaluate(()=>window.saved.slice(2)),['changes_requested',{feedback:'Add a clearer methodology',revisionDueDate:'2026-11-12'}]);
  await page.getByText('Files and version history (2)',{exact:true}).click();
  assert.equal(await page.getByRole('link',{name:'Download',exact:true}).count(),2);
  assert.equal(await page.getByRole('link',{name:'View file',exact:true}).count(),2);
  assert.equal(await page.getByRole('link',{name:'Download',exact:true}).first().getAttribute('href'),'/api/projects/p/submissions/s/file?download=1');
  await page.goto(base+'/?mode=student');
  assert.ok(await page.getByRole('region',{name:'Supervisor feedback'}).innerText().then(t=>t.includes('Please expand the methodology')));
  await page.getByRole('button',{name:'Upload revision',exact:true}).click();
  assert.equal(await page.locator('#s-title').count(),0);
  assert.equal(await page.getByText('Project topic',{exact:true}).count(),1);
  assert.equal(await page.getByLabel('Document category',{exact:true}).count(),1);
  await page.locator('input[type=file]').setInputFiles({name:'revised.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 test')});
  await page.getByRole('button',{name:'Upload submission',exact:true}).click();
  await page.waitForFunction(()=>!!window.uploaded);
  assert.equal(await page.evaluate(()=>window.uploaded[1].title),'Approved project topic');
  await page.goto(base+'/?mode=feedback');
  await page.getByRole('region',{name:'Supervisor feedback'}).waitFor();
  assert.match(await page.getByRole('region',{name:'Supervisor feedback'}).innerText(),/Please expand the methodology/);
  await page.goto(base+'/?mode=final');
  await page.getByText('Final review and grading',{exact:true}).click();
  assert.equal(await page.getByLabel('Final grade (0–100)',{exact:true}).count(),1);
  await page.close();console.log('Passed mobile component checks: decisions, feedback, date, history, revision upload, final-only grading.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(work,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
