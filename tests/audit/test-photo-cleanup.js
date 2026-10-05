const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('work/current-index.html','utf8'),{runScripts:'dangerously',url:'https://example.test/',beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=f=>f();}}),w=dom.window;
const photo=id=>({id,localKey:id,storagePath:'owner/project/entry/'+id+'.jpg'}),project=photos=>({...w.eval("emptyData()"),workEntries:[{id:'entry',photos}]}),payload=photos=>({current:project(photos),projects:[]});
(async()=>{await new Promise(r=>setTimeout(r,80));w.eval('cloudUser={id:"owner"}; cloudSession={access_token:"token"};');let remote=payload([]),history=[],fail=false,deleted=[];
 w.cloudFetch=async(path,opts={})=>{if(fail)throw Error('network');if(opts.method==='DELETE'){deleted.push(...JSON.parse(opts.body).prefixes);return{}};return{json:async()=>path.includes('app_backup_versions')?history:[{payload:remote}]}};
 const shared=photo('shared'),old=photo('old'),orphan=photo('orphan');for(const p of [shared,old,orphan])await w.cachePhotoBlob(p.id,new w.Blob(['image']));
 w.eval('data=emptyData()');w.localStorage.setItem('iv_proto',JSON.stringify(project([shared])));w.localStorage.setItem('iv_projects','[]');history=[{payload:payload([old])}];w.queuePhotoCleanup([shared,old,orphan]);assert(await w.cleanupPhotoAssets());assert.deepEqual(deleted,[orphan.storagePath]);assert(await w.cachedPhotoBlob('shared'));assert(await w.cachedPhotoBlob('old'));assert.equal(await w.cachedPhotoBlob('orphan'),null);
 // When history cannot be checked, nothing else is removed.
 fail=true;w.localStorage.setItem('iv_proto',JSON.stringify(project([])));history=[];assert.equal(await w.cleanupPhotoAssets(),false);assert(await w.cachedPhotoBlob('old'));assert.equal(deleted.length,1);
 // Current cloud backup is a reference even after local deletion.
 fail=false;remote=payload([old]);assert(await w.cleanupPhotoAssets());assert(await w.cachedPhotoBlob('old'));assert(!deleted.includes(old.storagePath));
 // A shared saved-project reference survives deleting the visible entry.
 w.localStorage.setItem('iv_projects',JSON.stringify([{id:'saved',data:project([old])}]));remote=payload([]);assert(await w.cleanupPhotoAssets());assert(await w.cachedPhotoBlob('old'));
 // Only after all references disappear can both the object and cache be removed.
 w.localStorage.setItem('iv_projects','[]');assert(await w.cleanupPhotoAssets());assert.equal(await w.cachedPhotoBlob('old'),null);assert(deleted.includes(old.storagePath));
 // A failed local save rolls back entry deletion and cannot remove its image.
 const guarded={id:'guard',title:'Test',photos:[photo('guard')]};w.eval('data=emptyData()');w.eval('data.workEntries='+JSON.stringify([guarded]));w.confirm=()=>true;w.save=()=>false;w.deleteWorkEntry('guard');assert.equal(w.eval('data.workEntries.length'),1);
 console.log('photo cleanup preserves current/saved/cloud/history references; network failures defer deletion; failed save retains entry');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>w.close());
