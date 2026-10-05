const fs=require('fs'),vm=require('vm');
const listeners={},puts=[],handlers=new Map(),cache={match:async key=>null,put:async(key,response)=>{puts.push(key)}};
const context={URL,Promise,self:{location:{origin:'https://iivo1996.github.io'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:()=>{},clients:{claim:()=>{}}},caches:{open:async()=>cache,match:async()=>null,keys:async()=>[]},fetch:async req=>({ok:req.testStatus!==500,clone(){return this}})};
vm.runInNewContext(fs.readFileSync('work/service-worker.js','utf8'),context);
function request(url,authorization=false,mode='cors',testStatus){let promise;listeners.fetch({request:{url,mode,method:'GET',headers:{has:key=>authorization&&key==='Authorization'},testStatus},respondWith:p=>{promise=p}});return promise}
(async()=>{
  if(request('https://example.supabase.co/rest/v1/app_backups')!==undefined)throw Error('Cross-origin request intercepted');
  if(request('https://iivo1996.github.io/iv-mittaus/private',true)!==undefined)throw Error('Authorization request intercepted');
  await request('https://iivo1996.github.io/iv-mittaus/',false,'navigate',500);
  await new Promise(resolve=>setTimeout(resolve,0));if(puts.length)throw Error('Error page cached');
  await request('https://iivo1996.github.io/iv-mittaus/',false,'navigate',200);
  await new Promise(resolve=>setTimeout(resolve,0));if(puts.length!==1||puts[0]!=='./')throw Error('App shell navigation not cached');
  console.log('service worker ignores cloud/auth requests and caches only successful app pages');
})().catch(error=>{console.error(error);process.exitCode=1});
