const fs=require("fs"),{JSDOM}=require("jsdom");
const html=fs.readFileSync("work/current-index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.test/",beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=f=>f();}});
const w=dom.window,session={access_token:"access",refresh_token:"refresh",expires_at:Math.floor(Date.now()/1000)+3600};
const assert=(v,m)=>{if(!v)throw new Error(m)};
setTimeout(async()=>{try{
  w.eval("storeCloudSession("+JSON.stringify(session)+")");
  w.fetch=async()=>{throw new Error("offline")};
  assert(await w.refreshCloudSession()===false,"Offline refresh succeeded");
  assert(!!w.localStorage.getItem("iv_cloud_session"),"Offline refresh deleted the session");
  try{await w.loadCloudUser()}catch(e){}
  assert(!!w.localStorage.getItem("iv_cloud_session"),"Offline user lookup deleted the session");
  w.fetch=async()=>({ok:false,status:400,json:async()=>({message:"Invalid Refresh Token"})});
  assert(await w.refreshCloudSession()===false,"Invalid refresh token succeeded");
  assert(!w.localStorage.getItem("iv_cloud_session"),"Invalid refresh token was retained");
  console.log("offline auth retains session, invalid token clears it");
}catch(e){console.error(e);process.exitCode=1}finally{w.close()}},80);
