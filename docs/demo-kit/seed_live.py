"""Populate only newly created demo accounts through the application's normal APIs.
No Firebase admin key, Vercel token, or production configuration change is needed.
Run after the cloud network configuration is applied. State makes successful steps resumable.
"""
import urllib.request,urllib.error,http.cookiejar,json,re,secrets,uuid,base64,datetime,os
from pathlib import Path
ROOT=Path('/workspace/demo-setup'); BASE='https://project-supervision-system.vercel.app'
STATE=ROOT/'demo-state.json'
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
 STATE.write_text(json.dumps(state,indent=2));os.chmod(STATE,0o600)
def google(action,body):return request(PUBLIC,'https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+KEY,'POST',body)
if 'accounts' not in state:
 suffix=secrets.token_hex(3)
 state['accounts']={
  'student':{'name':'Shazily Sanni (Demo)','matricNumber':'F/HD/26/9'+str(secrets.randbelow(1000000)).zfill(6),'password':secrets.token_urlsafe(15)},
  'supervisor':{'name':'Dr. Amina Bello (Demo)','email':f'lecturer.demo.{suffix}@yct-demo.invalid','password':secrets.token_urlsafe(15)}}
 state['accounts']['student']['email']=state['accounts']['student']['matricNumber'].lower().replace('/','_')+'@students.project-supervision.invalid';save()
sessions={};tokens={}
for role,account in state['accounts'].items():
 if not account.get('uid'):
  result=google('signUp',{'email':account['email'],'password':account['password'],'returnSecureToken':True});account['uid']=result['localId'];save()
 login=google('signInWithPassword',{'email':account['email'],'password':account['password'],'returnSecureToken':True})
 payload=json.loads(base64.urlsafe_b64decode(login['idToken'].split('.')[1]+'==='))
 if payload.get('name') != account['name']:
  google('update', {'idToken':login['idToken'],'displayName':account['name'],'returnSecureToken':True})
  login=google('signInWithPassword',{'email':account['email'],'password':account['password'],'returnSecureToken':True})
  payload=json.loads(base64.urlsafe_b64decode(login['idToken'].split('.')[1]+'==='))
 if not payload.get('role'):
  request(PUBLIC,BASE+'/api/auth/provision','POST',{'idToken':login['idToken'],'role':role,'department':'Computer Science','displayName':account['name'],**({'matricNumber':account['matricNumber']} if role=='student' else {})})
  login=google('signInWithPassword',{'email':account['email'],'password':account['password'],'returnSecureToken':True})
 payload=json.loads(base64.urlsafe_b64decode(login['idToken'].split('.')[1]+'==='))
 if payload.get('role')!=role:raise RuntimeError('Unexpected demo-account role')
 jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));request(opener,BASE+'/api/session','POST',{'idToken':login['idToken']});sessions[role]=opener;tokens[role]=login['idToken'];state['firebaseProject']=payload['aud'];save();print(role+' demo account provisioned and session verified.',flush=True)
def api(role,path,method='GET',body=None):return request(sessions[role],BASE+path,method,body)
def once(key,fn):
 if key not in state['steps']:state['steps'][key]=fn();save()
 return state['steps'][key]
TOPIC='CampusFlow: Digital Project Supervision and Progress Tracking'
if not state.get('projectId'):
 # Recover a previously linked project if a response was interrupted.
 uid=state['accounts']['student']['uid'];url=f'https://firestore.googleapis.com/v1/projects/{state["firebaseProject"]}/databases/(default)/documents/users/{uid}'
 profile=request(PUBLIC,url,headers={'Authorization':'Bearer '+tokens['student']});linked=profile.get('fields',{}).get('projectId',{}).get('stringValue')
 result={'projectId':linked} if linked else api('student','/api/projects','POST',{'supervisorId':state['accounts']['supervisor']['uid'],'title':TOPIC,'abstract':'A role-based workspace for student project supervision: private document uploads, chapter approvals, revision feedback, activity history and progress tracking.','partnerMatricNumbers':[]})
 state['projectId']=result['projectId'];save()
P='/api/projects/'+state['projectId'];today=datetime.date.today();date=lambda days:(today+datetime.timedelta(days=days)).isoformat()
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
state['verified']=True;save();print('Verified project progress: 60%. Credentials saved privately; no source-code changes.',flush=True)
