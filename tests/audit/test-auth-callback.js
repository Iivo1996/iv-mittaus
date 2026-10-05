const fs=require('fs'),{JSDOM}=require('jsdom'),html=fs.readFileSync('work/current-index.html','utf8');
const response=(body,status=200)=>({ok:status<400,status,json:async()=>body});
async function scenario(name,{pending,existing,userEmail},expectedAccepted){
  const calls=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/#access_token=attacker-token&refresh_token=attacker-refresh&expires_in=3600',beforeParse(w){
    w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=fn=>fn();
    w.localStorage.setItem('iv_proto',JSON.stringify({kohde:'Säilytettävä projekti',apartments:[],workEntries:[]}));
    if(pending)w.localStorage.setItem('iv_pending_signup',JSON.stringify({email:'owner@example.com',expiresAt:Date.now()+3600000}));
    if(existing)w.localStorage.setItem('iv_cloud_session',JSON.stringify({access_token:'existing-token',refresh_token:'existing-refresh',expires_at:Date.now()/1000+3600}));
    w.fetch=async(url,options={})=>{calls.push({url:String(url),options});if(String(url).endsWith('/auth/v1/user'))return response({id:'user-1',email:userEmail});if(String(url).includes('/rest/v1/app_backups'))return response([]);if(String(url).includes('/rest/v1/app_backup_versions'))return response([]);return response({})};
  }});
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  await new Promise(resolve=>setTimeout(resolve,150));
  const stored=JSON.parse(dom.window.localStorage.getItem('iv_cloud_session')||'null');
  if((stored?.access_token==='attacker-token')!==expectedAccepted)throw Error(name+': invalid callback result');
  if(existing&&stored.access_token!=='existing-token')throw Error(name+': existing session replaced');
  if(!expectedAccepted&&calls.some(call=>call.url.includes('/storage/v1/object')))throw Error(name+': uploaded photos');
  if(dom.window.location.hash)throw Error(name+': token left in URL');
  if(JSON.parse(dom.window.localStorage.getItem('iv_proto')).kohde!=='Säilytettävä projekti')throw Error(name+': local project changed');
  dom.window.close();
}
(async()=>{await scenario('unsolicited',{},false);await scenario('existing',{pending:true,existing:true,userEmail:'owner@example.com'},false);await scenario('wrong email',{pending:true,userEmail:'attacker@example.com'},false);await scenario('legitimate',{pending:true,userEmail:'owner@example.com'},true);console.log('unsolicited auth links rejected; matching signup verified before cloud initialization')})().catch(e=>{console.error(e);process.exitCode=1});
