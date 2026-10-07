const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const names=['Toimisto/tauko','Pyykkihuolto ja henkilökunnan pukuhuone','W'.repeat(700)];
const project={projectId:'pdf-wrap-test',kohde:'Rivitystesti',workTypes:['measurement'],apartments:[{name:'A1',vents:Array.from({length:45},(_,i)=>({space:names[i%3],type:'supply',valve:'KTS-160',kpl:'1',target:'15',adjusted:'22',position:'15'}))}]};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'dangerously',url:'https://example.test/',beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=f=>f();w.localStorage.setItem('iv_proto',JSON.stringify(project));}});
setTimeout(async()=>{try{
  const raw=Buffer.from(await dom.window.makePdf()).toString('latin1');
  const cells=[...raw.matchAll(/6\.60 Tf 35 ([\d.]+) Td \(([^)]*)\) Tj/g)];
  assert.equal(cells.map(m=>m[2]).join('').replace(/\s/g,''),project.apartments[0].vents.map(v=>v.space).join('').replace(/\s/g,''));
  assert(cells.every(m=>Number(m[1])>=42&&Number(m[1])<758),'Wrapped names must remain within the page');
  assert(raw.includes('(tauko) Tj'),'Slash-separated name must keep its ending');
  assert(!cells.some(m=>m[2].includes('...')),'Space names must never be ellipsized');
  assert.equal(JSON.parse(dom.window.localStorage.getItem('iv_proto')).apartments[0].vents[0].space,'Toimisto/tauko');
  console.log('PDF complete space names, wide/long names, pagination and source preservation PASS');
}catch(e){console.error(e);process.exitCode=1}finally{dom.window.close()}},100);
