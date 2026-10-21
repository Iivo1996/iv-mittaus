const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const project={projectId:'sections',workTypes:['measurement','cleaning'],apartments:[{name:'A1',vents:[{space:'PH',type:'exhaust',target:'10',adjusted:'10'}]}],workEntries:[{id:'work',title:'Havainto',target:'A1',text:'VAIN_HAVAINTORAPORTISSA',photos:[]}]};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'dangerously',url:'https://example.test/',beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=f=>f();w.localStorage.setItem('iv_proto',JSON.stringify(project));}});
setTimeout(async()=>{try{const w=dom.window,before=JSON.stringify(w.eval('data'));
 const measurement=Buffer.from(await w.makePdf('measurements')).toString('latin1');assert(!measurement.includes('VAIN_HAVAINTORAPORTISSA'));assert(measurement.includes('MITTAUSTULOKSET'));assert(!measurement.includes('TYÖMERKINNÄT'));
 const work=Buffer.from(await w.makePdf('work')).toString('latin1');assert(work.includes('VAIN_HAVAINTORAPORTISSA'));assert(!work.includes('MITTAUSTULOKSET'));assert(!work.includes('MITTAUSVÄLINE'));
 const all=Buffer.from(await w.makePdf('all')).toString('latin1');assert(all.includes('VAIN_HAVAINTORAPORTISSA'));assert(all.includes('MITTAUSTULOKSET'));
 w.document.getElementById('pdf-content-select').value='measurements';assert(!Buffer.from(await w.makePdf()).toString('latin1').includes('VAIN_HAVAINTORAPORTISSA'));assert.equal(JSON.stringify(w.eval('data')),before);await assert.rejects(w.makePdf('invalid'));console.log('Independent PDF sections, selector, combined export and full source preservation PASS');
}catch(e){console.error(e);process.exitCode=1}finally{dom.window.close()}},80);
