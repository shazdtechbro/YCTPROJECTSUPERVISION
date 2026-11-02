"""Populate only newly created demo accounts through the application's normal APIs.
No Firebase admin key, Vercel token, or production configuration change is needed.
Run after the cloud network configuration is applied. State makes successful steps resumable.
"""
import urllib.request,urllib.error,http.cookiejar,json,re,secrets,uuid,base64,datetime,os,getpass
from pathlib import Path
ROOT=Path(__file__).resolve().parent; BASE='https://project-supervision-system.vercel.app'
STATE=ROOT/'resume-state.json'
def request(opener,url,method='GET',body=None,headers=None):
 data=None if body is None else body if isinstance(body,bytes) else json.dumps(body).encode()
 hdr={'User-Agent':'CampusFlow-Owner-Demo-Setup'}
 if body is not None:hdr['Content-Type']='application/json'
 hdr.update(headers or {})
 try:
  with opener.open(urllib.request.Request(url,data=data,headers=hdr,method=method),timeout=60) as response:
   raw=response.read();return json.loads(raw) if 'json' in response.headers.get('Content-Type','') else raw
 except urllib.error.HTTPError as e:
  try:msg=json.loads(e.read()).get('error',{});msg=msg.get('message','Request rejected') if isinstance(msg,dict) else str(msg)
  except Exception:msg='Request rejected'
  raise RuntimeError(f'{method} request failed ({e.code}): {msg}') from None
PUBLIC=urllib.request.build_opener()
# Preflight before generating credentials or creating any account.
html=request(PUBLIC,BASE+'/signup').decode()
config=ROOT/'public-config.json'
if not config.exists():
 for src in dict.fromkeys(re.findall(r'<script[^>]+src="([^"]+)"',html)):
  js=request(PUBLIC,BASE+src).decode();m=re.search(r'apiKey\s*:\s*["\'](AIza[^"\']+)',js)
  if m:config.write_text(json.dumps({'apiKey':m.group(1)}));break
 if not config.exists():raise RuntimeError('Public Firebase configuration not located')
KEY=json.loads(config.read_text())['apiKey']
state=json.loads(STATE.read_text()) if STATE.exists() else {'steps':{}}
def save():
 safe=json.loads(json.dumps(state))
 for account in safe.get('accounts',{}).values():account.pop('password',None)
 STATE.write_text(json.dumps(safe,indent=2));os.chmod(STATE,0o600)
def google(action,body):return request(PUBLIC,'https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+KEY,'POST',body)
# This mode NEVER creates accounts or a new project.
PROJECT_ID = "XleeJC3EGAIg5gNmbrHL"
student_password = os.environ.get("YCT_DEMO_STUDENT_PASSWORD") or getpass.getpass("Existing student password: ")
lecturer_password = os.environ.get("YCT_DEMO_LECTURER_PASSWORD") or getpass.getpass("Existing lecturer password: ")
state['projectId'] = PROJECT_ID
state['accounts'] = {
 'student': {'name':'Shazily Sanni (Demo)','matricNumber':'F/HD/26/9991102','email':'f_hd_26_9991102@students.project-supervision.invalid','password':student_password},
 'supervisor': {'name':'Dr. Amina Bello (Demo)','email':'lecturer.demo.7k4q9m@yct-demo.invalid','password':lecturer_password},
}
# Preserve work confirmed complete in the owner's handoff; do not duplicate it.
for key in ['topic-approved','proposal-date','activity-open','activity-resolved','activity-close','extension-request','extension-approved']:
 state['steps'].setdefault(key, {'preserved':True})
sessions={};tokens={}
for role,account in state['accounts'].items():
 login=google('signInWithPassword',{'email':account['email'],'password':account['password'],'returnSecureToken':True})
 payload=json.loads(base64.urlsafe_b64decode(login['idToken'].split('.')[1]+'==='))
 account['uid']=login['localId']
 payload=json.loads(base64.urlsafe_b64decode(login['idToken'].split('.')[1]+'==='))
 if payload.get('role')!=role:raise RuntimeError('Unexpected demo-account role')
 jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));request(opener,BASE+'/api/session','POST',{'idToken':login['idToken']});sessions[role]=opener;tokens[role]=login['idToken'];state['firebaseProject']=payload['aud'];save();print(role+' existing account login and session verified.',flush=True)
def api(role,path,method='GET',body=None):return request(sessions[role],BASE+path,method,body)
def once(key,fn):
 if key not in state['steps']:state['steps'][key]=fn();save()
 return state['steps'][key]
TOPIC='CampusFlow: Digital Project Supervision and Progress Tracking'
P='/api/projects/'+state['projectId'];today=datetime.date.today();date=lambda days:(today+datetime.timedelta(days=days)).isoformat()
verify_url=f'https://firestore.googleapis.com/v1/projects/{state["firebaseProject"]}/databases/(default)/documents/projects/{PROJECT_ID}'
existing=request(PUBLIC,verify_url,headers={'Authorization':'Bearer '+tokens['student']})['fields']
assert existing['studentId']['stringValue']==state['accounts']['student']['uid'], 'Student does not own the expected demo project'
assert existing['supervisorId']['stringValue']==state['accounts']['supervisor']['uid'], 'Lecturer is not assigned to the expected demo project'
assert existing['topicStatus']['stringValue']=='approved', 'Expected existing topic approval'
# Recover previously created submission IDs after an interrupted run.
subs_url=verify_url+'/submissions?pageSize=1000'
existing_subs=request(PUBLIC,subs_url,headers={'Authorization':'Bearer '+tokens['student']}).get('documents',[])
by_file={doc['fields'].get('fileName',{}).get('stringValue'):doc['name'].split('/')[-1] for doc in existing_subs}
for key in ['proposal','chapter-1','chapter-2','chapter-3','chapter-4-v1','chapter-4-v2']:
 if key+'.pdf' in by_file:state['steps'].setdefault(key,{'submissionId':by_file[key+'.pdf']})
for doc in existing_subs:
 fields=doc.get('fields',{});name=fields.get('fileName',{}).get('stringValue','').removesuffix('.pdf')
 review_key={'proposal':'proposal-review','chapter-1':'chapter-1-review','chapter-2':'chapter-2-review','chapter-3':'chapter-3-review','chapter-4-v1':'chapter-4-review'}.get(name)
 expected='changes_requested' if name=='chapter-4-v1' else 'approved'
 if review_key and fields.get('status',{}).get('stringValue')==expected:state['steps'].setdefault(review_key,{'preserved':True})
save()
once('topic-approved',lambda:api('supervisor',P,'PATCH',{'topicStatus':'approved','topicDecisionNote':'The scope is clear and suitable. Proceed with the chapter-by-chapter implementation and document the review workflow.'}))
once('proposal-date',lambda:api('supervisor',P,'PATCH',{'proposalDate':date(14)}))
def submit(file,kind,chapter=None):
 sign=api('student','/api/submissions/sign-upload','POST',{'projectId':state['projectId'],'submissionId':str(uuid.uuid4()),'fileName':file+'.pdf'})
 raw=(ROOT/'pdfs'/(file+'.pdf')).read_bytes();request(PUBLIC,sign['signedUrl'],'PUT',raw,{'Content-Type':'application/pdf','x-upsert':'true'})
 return api('student',P+'/submissions','POST',{'kind':kind,'title':TOPIC,'storagePath':sign['path'],'fileName':sign['fileName'],'fileSize':len(raw),**({'chapterNumber':chapter} if chapter else {})})
def review(key,status,feedback):
 return api('supervisor',P+'/submissions/'+state['steps'][key]['submissionId'],'PATCH',{'status':status,'feedback':feedback,'revisionDueDate':date(7) if status=='changes_requested' else None})
once('proposal',lambda:submit('proposal','proposal'))
once('proposal-review',lambda:review('proposal','approved','Good project focus. The expected user roles and workflow are clearly defined.'))
for n,feedback in [(1,'The problem statement, aim and scope are clear. Chapter One is approved.'),(2,'The review identifies relevant supervision, feedback and document-management themes. Chapter Two is approved.'),(3,'The architecture and milestone rules are explained clearly. Chapter Three is approved.')]:
 key='chapter-'+str(n);once(key,lambda n=n:submit('chapter-'+str(n),'chapter',n));once(key+'-review',lambda key=key,feedback=feedback:review(key,'approved',feedback))
once('chapter-4-v1',lambda:submit('chapter-4-v1','chapter',4))
once('chapter-4-review',lambda:review('chapter-4-v1','changes_requested','Please explain the version-history interface and how private document access is authorised. Upload a revised Chapter Four before the revision date.'))
once('student-comment',lambda:api('student',P+'/submissions/'+state['steps']['chapter-4-v1']['submissionId']+'/comments','POST',{'body':'Thank you. I have added the version-history explanation and the access-control details in the revised draft.'}))
once('supervisor-comment',lambda:api('supervisor',P+'/submissions/'+state['steps']['chapter-4-v1']['submissionId']+'/comments','POST',{'body':'That addresses the requested scope. Please submit the revised PDF so I can review the current version.'}))
once('chapter-4-v2',lambda:submit('chapter-4-v2','revision',4))
once('activity-open',lambda:api('student',P+'/tickets','POST',{'title':'Prepare Chapter Five and final demonstration','body':'Draft the conclusion and recommendations after Chapter Four review. Prepare a short walkthrough of the student dashboard, lecturer review and document history.','priority':'medium','dueDate':date(10)}))
once('activity-resolved',lambda:api('student',P+'/tickets','POST',{'title':'Confirm project scope and chapter plan','body':'Agree the project scope and the five chapter stages with the assigned lecturer before implementation.','priority':'low','dueDate':date(2)}))
once('activity-close',lambda:api('supervisor',P+'/tickets/'+state['steps']['activity-resolved']['ticketId'],'PATCH',{'status':'done'}))
once('extension-request',lambda:api('student',P,'PATCH',{'extensionRequestedUntil':date(10)}))
once('extension-approved',lambda:api('supervisor',P,'PATCH',{'extensionStatus':'approved','extensionDecisionNote':'Extension granted to complete the final documentation and demonstration preparation.'}))
activity=api('student',P+'/activity');print('Project populated with six PDFs, three approved chapters, a revision awaiting lecturer review, comments, activities and an approved extension.',flush=True)
print('Verified activity events:',len(activity.get('events',[])),flush=True)
# Check actual stored progress with the student's own Firebase credentials.
url=f'https://firestore.googleapis.com/v1/projects/{state["firebaseProject"]}/databases/(default)/documents/projects/{state["projectId"]}'
doc=request(PUBLIC,url,headers={'Authorization':'Bearer '+tokens['student']});assert float(doc['fields']['progressPct'].get('integerValue',doc['fields']['progressPct'].get('doubleValue',-1))) == 60
for key in ['proposal','chapter-1','chapter-2','chapter-3','chapter-4-v1','chapter-4-v2']:
 document=api('supervisor',P+'/submissions/'+state['steps'][key]['submissionId']+'/file')
 assert isinstance(document,bytes) and document.startswith(b'%PDF-'), 'Lecturer file access did not return a PDF'
 assert document==(ROOT/'pdfs'/(key+'.pdf')).read_bytes(), 'Downloaded document differs from the uploaded PDF'
print('Verified lecturer can access all six uploaded PDFs.',flush=True)
state['verified']=True;save();print('Verified project progress: 60%. Credentials saved privately; no source-code changes.',flush=True)
