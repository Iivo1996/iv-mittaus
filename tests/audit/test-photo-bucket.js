const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('work/current-index.html','utf8'),{runScripts:'dangerously',url:'https://example.test/',beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=f=>f();}}),w=dom.window;
(async()=>{
 await new Promise(r=>setTimeout(r,80));w.eval('cloudUser={id:"owner"};cloudSession={access_token:"fake"};data=emptyData()');
 const calls=[],blob=new w.Blob(['photo'],{type:'image/jpeg'});w.cloudFetch=async(path,options={})=>{calls.push({path,options});return{blob:async()=>blob,json:async()=>path.includes('app_backup_versions')?[]:[]}};
 const photo={id:'image',localKey:'image',data:'embedded'};await w.uploadPhotoBlob(photo,blob,'project','entry');assert.equal(photo.storagePath,'owner/project/entry/image.jpg');assert.equal(photo.data,undefined);assert.equal(calls[0].path,'/storage/v1/object/Project-photos/owner/project/entry/image.jpg');
 assert.equal(await w.fetchStoragePhoto(photo.storagePath),blob);assert.equal(calls[1].path,'/storage/v1/object/authenticated/Project-photos/owner/project/entry/image.jpg');
 w.localStorage.setItem('iv_projects','[]');w.localStorage.setItem('iv_proto',JSON.stringify(w.eval('emptyData()')));w.queuePhotoCleanup([photo]);assert(await w.cleanupPhotoAssets());const removal=calls.find(call=>call.options.method==='DELETE');assert.equal(removal.path,'/storage/v1/object/Project-photos');assert.deepEqual(JSON.parse(removal.options.body).prefixes,[photo.storagePath]);
 console.log('upload, authenticated read and reference-safe deletion use the existing Project-photos bucket');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>w.close());
