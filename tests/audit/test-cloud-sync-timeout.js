const fs=require("fs");
const {JSDOM}=require("jsdom");
const html=fs.readFileSync("work/current-index.html","utf8");
const base={projectId:"p1",kohde:"Kesken oleva mittaus",paiva:"2026-10-01",mittaaja:"",valine:"",workTypes:[],customWorkType:"",cleaningItems:[],customCleaningItem:"",conditionRatings:{},workEntries:[],apartments:[{name:"A1",vents:[{space:"K",pa:"25"}]}]};
const remote={version:1,current:{...base,kohde:"Vanha kopio"},projects:[],pdfSettings:{},localUpdatedAt:"2026-09-30T10:00:00.000Z"};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
async function scenario(failingStage){
  const calls=[];let saved=null,savedAt="",dom;
  dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.test/",beforeParse(window){
    window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};window.requestAnimationFrame=fn=>fn();
    window.localStorage.setItem("iv_proto",JSON.stringify(base));window.localStorage.setItem("iv_local_updated_at","2026-10-01T10:00:00.000Z");
    window.localStorage.setItem("iv_cloud_session",JSON.stringify({access_token:"token",refresh_token:"refresh",expires_at:Date.now()/1000+3600}));
    window.fetch=async(url,options={})=>{
      const path=String(url).replace(/^https?:\/\/[^/]+/,""),method=options.method||"GET";calls.push({path,method});
      if(path==="/auth/v1/user")return response({id:"user-1",email:"test@example.com"});
      if(path.startsWith("/rest/v1/app_backups?")&&method==="GET")return response(saved?[{payload:saved,updated_at:savedAt}]:[{payload:remote,updated_at:"2026-09-30T10:00:00.000Z"}]);
      if(path==="/rest/v1/app_backup_versions"&&method==="POST")return failingStage==="version"?response({message:"canceling statement due to statement timeout"},500):response(null,201);
      if(path.startsWith("/rest/v1/app_backups?on_conflict")&&method==="POST"){
        if(failingStage==="upsert")return response({message:"canceling statement due to statement timeout"},500);
        const body=JSON.parse(options.body);saved=body.payload;savedAt=body.updated_at;return response(null,201);
      }
      if(path.startsWith("/rest/v1/app_backup_versions?select=id"))return failingStage==="cleanup"?response({message:"canceling statement due to statement timeout"},500):response([]);
      return response([]);
    };
  }});
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  await new Promise(resolve=>setTimeout(resolve,100));
  const result=await dom.window.syncCloudNow(true);
  const current=JSON.parse(dom.window.localStorage.getItem("iv_proto"));
  if(current.kohde!==base.kohde||current.apartments[0].vents[0].pa!=="25")throw new Error(failingStage+": local measurements changed");
  if(failingStage==="version"||failingStage==="upsert"){
    if(result!==false)throw new Error(failingStage+": failure incorrectly marked as success");
    if(!dom.window.document.getElementById("cloud-detail").textContent.includes(failingStage==="version"?"palautuspisteen tallennus":"projektin tallennus"))throw new Error(failingStage+": wrong error stage");
  }else if(result!==true||!saved||saved.current.apartments[0].vents[0].pa!=="25")throw new Error(failingStage+": current copy not saved");
  if(failingStage==="version"&&calls.some(call=>call.path.includes("on_conflict")))throw new Error("Overwrote remote without a recovery version");
  if(failingStage==="cleanup"){
    await new Promise(resolve=>setTimeout(resolve,1150));
    if(!calls.some(call=>call.path.includes("offset=20&limit=10")))throw new Error("Cleanup was not bounded");
    if(!dom.window.document.getElementById("cloud-detail").textContent.includes("Kaikki tiedot"))throw new Error("Cleanup failure hid successful backup");
  }
  dom.window.close();
}
async function concurrentEdit(){
  const calls=[];let dom,remoteCopy=null,remoteAt="",edited=false;
  dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.test/",beforeParse(window){
    window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};window.requestAnimationFrame=fn=>fn();
    window.localStorage.setItem("iv_proto",JSON.stringify(base));window.localStorage.setItem("iv_local_updated_at","2026-10-01T10:00:00.000Z");
    window.localStorage.setItem("iv_cloud_session",JSON.stringify({access_token:"token",refresh_token:"refresh",expires_at:Date.now()/1000+3600}));
    window.fetch=async(url,options={})=>{
      const path=String(url).replace(/^https?:\/\/[^/]+/,""),method=options.method||"GET";calls.push({path,method});
      if(path==="/auth/v1/user")return response({id:"user-1",email:"test@example.com"});
      if(path.startsWith("/rest/v1/app_backups?")&&method==="GET")return response(remoteCopy?[{payload:remoteCopy,updated_at:remoteAt}]:[{payload:remote,updated_at:"2026-09-30T10:00:00.000Z"}]);
      if(path==="/rest/v1/app_backup_versions"&&method==="POST")return response(null,201);
      if(path.startsWith("/rest/v1/app_backups?on_conflict")&&method==="POST"){
        const body=JSON.parse(options.body);remoteCopy=body.payload;remoteAt=body.updated_at;
        if(!edited){edited=true;window.localStorage.setItem("iv_local_updated_at","2026-10-01T10:01:00.000Z");dom.window.eval('data.apartments[0].vents[0].pa="26"');window.localStorage.setItem("iv_proto",JSON.stringify(dom.window.eval("data")))}
        return response(null,201);
      }
      if(path.startsWith("/rest/v1/app_backup_versions?select=id"))return response([]);
      return response([]);
    };
  }});
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  await new Promise(resolve=>setTimeout(resolve,400));
  if(remoteCopy?.current.apartments[0].vents[0].pa!=="26"||calls.filter(call=>call.path.includes("on_conflict")).length<2)throw new Error("A measurement changed during sync was not sent in the follow-up sync");
  dom.window.close();
}
(async()=>{for(const stage of ["version","upsert","cleanup"])await scenario(stage);await concurrentEdit();console.log("cloud sync timeout and concurrent-edit scenarios preserve measurements")})().catch(error=>{console.error(error);process.exitCode=1});
