#!/usr/bin/env python3
"""Real Chromium/Playwright contract tests for TableGate's backend and knowledge UI.
The browser is navigation-restricted in this environment, so production modules are injected
unchanged into an in-memory page. Only the knowledge browser base URL is redirected to a local
Playwright route. Backend requests use fixtures shaped from the supplied Backend V3 routes.
"""
from __future__ import annotations
import json, mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'docs/audits/BROWSER_CONTRACT_TEST_v10.json'
SCREENSHOT=ROOT/'docs/audits/browser_backend_center_v10.png'

class Fixtures:
    def __init__(self):
        self.projects=[]; self.items={}; self.next_id=1
    def response(self,a,p):
        if a=='health': return {'status':'ok','apiVersion':'3.0.0','schemaVersion':'3'}
        if a=='listTablegates': return [{'id':'tg_test','name':'Release Test Campaign','ownerId':'usr_test','permissions':8388607}]
        if a=='getTablegate': return {'tablegate':{'id':'tg_test','name':'Release Test Campaign'},'categories':[],'channels':[{'id':'chn_general','name':'general','type':'TEXT'}],'members':[],'roles':[],'permissions':8388607}
        if a=='forgotPassword': return {'sent':True,'delivery':'email-code'}
        if a=='listTablegateSystems': return [
          {'id':'tgs1','tablegateId':'tg_test','systemId':'sys_dnd5e','label':'Dungeons & Dragons 5e','isPrimary':True,'enabled':True,'system':{'id':'sys_dnd5e','name':'Dungeons & Dragons 5e'}},
          {'id':'tgs2','tablegateId':'tg_test','systemId':'sys_pf2e','label':'Pathfinder 2e','isPrimary':False,'enabled':True,'system':{'id':'sys_pf2e','name':'Pathfinder 2e'}}]
        if a=='listSystemDocuments': return []
        if a=='createSystemDocument': return {'id':'sdoc1','tablegateId':'tg_test','systemId':p.get('systemId',''),'title':p.get('title','Rules'),'documentType':p.get('documentType','RULES_REFERENCE'),'version':'','attachmentId':p.get('attachmentId','att1'),'metadata':p.get('metadata',{}),'visibility':'TABLEGATE','createdAt':'2026-07-30T20:00:00Z','updatedAt':'2026-07-30T20:00:00Z'}
        if a=='searchKnowledge': return [{'id':'knw1','title':'Test Rules','metadata':{'system':'D&D 5e'},'snippet':'A grounded rules excerpt.','score':1.0,'sourceUrl':''}]
        if a=='listProjects': return self.projects
        if a=='createProject':
            pr={'id':f'prj{self.next_id}','tablegateId':p.get('tablegateId',''),'name':p.get('name',''),'projectType':p.get('projectType','GENERAL'),'description':p.get('description',''),'settings':p.get('settings',{})}; self.next_id+=1; self.projects.append(pr); self.items[pr['id']]=[]; return pr
        if a=='getProject':
            pr=next(x for x in self.projects if x['id']==p.get('projectId')); return {'project':pr,'items':self.items.get(pr['id'],[])}
        if a=='listProjectItems': return self.items.get(p.get('projectId'),[])
        if a=='createProjectItem':
            it={'id':f'pit{self.next_id}','projectId':p.get('projectId'),'parentId':p.get('parentId',''),'itemType':p.get('itemType','ARTIFACT'),'name':p.get('name',''),'status':p.get('status','DRAFT'),'attachmentId':p.get('attachmentId',''),'data':p.get('data',{}),'orderIndex':p.get('orderIndex',0)}; self.next_id+=1; self.items.setdefault(it['projectId'],[]).append(it); return it
        if a=='updateProjectItem':
            for arr in self.items.values():
                for it in arr:
                    if it['id']==p.get('itemId'): it.update({k:v for k,v in p.items() if k!='itemId'}); return it
            return {}
        if a=='deleteProjectItem':
            for key,arr in list(self.items.items()): self.items[key]=[x for x in arr if x['id']!=p.get('itemId')]
            return {'deleted':True}
        if a=='updateProject': return next((x for x in self.projects if x['id']==p.get('projectId')), {})
        if a=='rollDice': return {'expression':p.get('expression','1d20'),'total':14,'detail':[{'type':'dice','count':1,'sides':20,'rolls':[14],'subtotal':14}]}
        return {'fixture':True,'action':a,'echo':p}

def main():
    tests=[]; browser_errors=[]; console_errors=[]; fixtures=Fixtures(); unhandled=[]
    def check(name,passed,details=''): tests.append({'name':name,'passed':bool(passed),'details':details})
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
            context=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block')
            page=context.new_page()
            page.on('pageerror',lambda e: browser_errors.append(str(e)))
            page.on('console',lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
            def backend_route(route):
                try:
                    payload=json.loads(route.request.post_data or '{}'); data=fixtures.response(payload.get('action',''),payload)
                    route.fulfill(status=200,headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},body=json.dumps({'ok':True,'data':data}))
                except Exception as e:
                    route.fulfill(status=200,headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},body=json.dumps({'ok':False,'error':{'code':'FIXTURE_ERROR','message':str(e)}}))
            def local_route(route):
                rel=unquote(urlparse(route.request.url).path).lstrip('/'); target=(ROOT/rel).resolve()
                if not str(target).startswith(str(ROOT.resolve())) or not target.is_file(): return route.fulfill(status=404,body='not found')
                route.fulfill(status=200,headers={'Content-Type':mimetypes.guess_type(target.name)[0] or 'application/octet-stream','Access-Control-Allow-Origin':'*'},body=target.read_bytes())
            page.route('https://script.google.com/**',backend_route)
            page.route('https://tablegate.test/**',local_route)
            page.set_content('<!doctype html><html><head></head><body><section id="workspace-shell"></section><div id="toasts"></div><div id="modal-root"></div><div id="context-root"></div><div id="remote-media"></div></body></html>')
            page.evaluate("""(()=>{const data=new Map();const ls={getItem:k=>data.has(String(k))?data.get(String(k)):null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:i=>[...data.keys()][i]??null,get length(){return data.size}};Object.defineProperty(window,'localStorage',{value:ls,configurable:true});window.__testUnhandled=[];addEventListener('unhandledrejection',e=>window.__testUnhandled.push(String(e.reason?.message||e.reason)));addEventListener('error',e=>window.__testUnhandled.push(String(e.message||e.error)));})()""")
            for css in ['css/messenger.css','css/organizer.css','css/responsive.css','css/backend-center.css']:
                page.add_style_tag(content=(ROOT/css).read_text(errors='replace'))
            page.add_script_tag(content=(ROOT/'js/messenger-core.js').read_text(errors='replace'))
            page.evaluate("""State.token='test-token';State.user={id:'usr_test',username:'Release Tester'};State.server={id:'tg_test',name:'Release Test Campaign',ownerId:'usr_test',permissions:8388607};State.channel={id:'chn_general',name:'general'};State.serverDetail={permissions:8388607};window.Workspace={current:'backend',render(){const shell=document.querySelector('#workspace-shell');shell.innerHTML=this.current==='backend'?TableGateBackendCenter.render():TableGateKnowledgeBrowser.render();if(this.current==='backend')TableGateBackendCenter.bind(shell);else TableGateKnowledgeBrowser.bind(shell)}};""")
            for js in ['js/backend-route-catalog.js','js/knowledge-pack-catalog.js','js/backend-capability-center.js']:
                page.add_script_tag(content=(ROOT/js).read_text(errors='replace'))
            kb=(ROOT/'js/knowledge-pack-browser.js').read_text(errors='replace').replace("const rootUrl=new URL('./json/knowledge-pack/',location.href);","const rootUrl=new URL('https://tablegate.test/json/knowledge-pack/');")
            page.add_script_tag(content=kb)
            check('browser loaded production API compatibility module',page.evaluate("typeof API==='object' && typeof API.call==='function'"))
            check('legacy listServers maps to supplied listTablegates',page.evaluate("API.call('listServers').then(x=>Array.isArray(x)&&x[0].id==='tg_test')"))
            check('legacy getServer normalizes tablegate result',page.evaluate("API.call('getServer',{serverId:'tg_test'}).then(x=>x.server.id==='tg_test'&&x.channels.length===1)"))
            check('password reset request maps to forgotPassword',page.evaluate("API.call('requestPasswordReset',{email:'test@example.com'},false).then(x=>x.sent===true)"))
            check('system document adapter resolves attached system',page.evaluate("API.call('createSystemDocument',{serverId:'tg_test',systemName:'Dungeons & Dragons 5e',attachmentId:'att1',title:'Rules',fileType:'PDF',mimeType:'application/pdf',tags:['rules']}).then(x=>x.systemId==='sys_dnd5e'&&x.systemName==='Dungeons & Dragons 5e')"))
            check('existing project routes persist studio data',page.evaluate("API.call('saveTablegateStudio',{serverId:'tg_test',studio:{hello:'world'}}).then(()=>API.call('getTablegateStudio',{serverId:'tg_test'})).then(x=>x.studio.hello==='world')"))
            check('rules assistant uses supplied searchKnowledge route',page.evaluate("API.call('askRulesAssistant',{serverId:'tg_test',query:'How do I roll 1d20?',limit:6}).then(x=>x.sources.length===1&&x.suggestedRoll==='1d20')"))
            page.evaluate("Workspace.current='backend';Workspace.render()")
            check('backend center renders in Chromium',page.locator('[data-backend-run]').count()==1)
            check('all 223 supplied routes are visible',page.evaluate("TableGateBackendCenter.catalog.routes.length===223&&document.querySelectorAll('[data-backend-route]').length===223"))
            page.locator('[data-backend-run]').click(); page.wait_for_function("document.querySelector('[data-backend-result]').textContent.includes('status')",timeout=15000)
            check('backend center executes selected route',True)
            page.screenshot(path=str(SCREENSHOT),full_page=True)
            page.evaluate("Workspace.current='knowledge';Workspace.render()")
            check('knowledge browser renders in Chromium',page.locator('[data-knowledge-load]').count()==1)
            check('all 244 JSON files are visible',page.evaluate("TableGateKnowledgeBrowser.catalog.files.length===244&&document.querySelectorAll('[data-knowledge-file]').length===244"))
            page.locator('[data-knowledge-load]').click(); page.wait_for_selector('.knowledge-preview',timeout=30000)
            check('embedded JSON preview loads from packaged file',True)
            page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(250)
            overflow=page.evaluate("document.documentElement.scrollWidth-window.innerWidth")
            check('mobile viewport has no major horizontal overflow',overflow<=8,f'overflow={overflow}px')
            unhandled=page.evaluate("window.__testUnhandled||[]")
            browser.close()
        substantive=[x for x in console_errors if 'failed to load resource' not in x.lower()]
        check('no uncaught browser exceptions',not browser_errors and not unhandled,' | '.join((browser_errors+unhandled)[:5]))
        check('no substantive console errors',not substantive,' | '.join(substantive[:5]))
    except Exception as e:
        check('browser test infrastructure completed',False,str(e))
    report={'suite':'TableGate v10 Chromium module and UI contract','browser':'System Chromium via Python Playwright; in-memory page because all browser navigation is administratively blocked','scope':'Production messenger-core API adapter, backend route catalog/center, knowledge catalog/browser, responsive rendering, backend-shaped network requests','backendMode':'Browser-only interception with supplied Backend V3 response shapes; no replacement backend is included in the release.','tests':tests,'passed':sum(x['passed'] for x in tests),'failed':sum(not x['passed'] for x in tests),'screenshot':str(SCREENSHOT.relative_to(ROOT)) if SCREENSHOT.exists() else '', 'generatedAt':'2026-07-30T21:00:00Z'}
    REPORT.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    if report['failed']: raise SystemExit(1)

if __name__=='__main__': main()
