const fs=require("fs"),{JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync("work/current-index.html","utf8"),{runScripts:"dangerously",url:"https://example.test/",beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=f=>f();}});
const w=dom.window;
setTimeout(async()=>{try{
  w.eval('cloudUser={id:"new-user",email:"a@example.test"}');
  const source='data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');
  const project={projectId:"other-project",kohde:"Tuotu",apartments:[],workEntries:[{id:"entry",date:"2026-10-05",photos:[{id:"photo",storagePath:"old-user/project/entry/photo.jpg",data:source}]}]};
  await w.importProjectFile({text:async()=>JSON.stringify({format:"iv-mittaus-project",version:1,project})});
  const imported=JSON.parse(w.localStorage.getItem("iv_proto"));
  const photo=imported.workEntries[0].photos[0];
  if(photo.storagePath?.startsWith("old-user/"))throw new Error("Imported photo still points to another owner");
  if(!photo.data&&!photo.localKey)throw new Error("Imported photo bytes not retained");
  if(w.eval('ownPhotoStoragePath("new-user/../entry/photo.jpg")'))throw new Error("Traversal path accepted");
  if(w.eval('ownPhotoStoragePath("old-user/project/entry/photo.jpg")'))throw new Error("Other owner path accepted");
  console.log("imported photo ownership and path checks ok");
}catch(e){console.error(e);process.exitCode=1}finally{w.close()}},80);
