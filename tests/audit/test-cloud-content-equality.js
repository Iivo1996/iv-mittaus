const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('work/current-index.html','utf8'),{runScripts:'dangerously',url:'https://example.test/',beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=f=>f();}});
try {
 const first={version:1,current:{kohde:'Test',apartments:[{name:'A1',vents:[{pa:'25',type:'exhaust'}]}]},projects:[],pdfSettings:{},localUpdatedAt:'2026-10-05T12:00:00Z'};
 const second={projects:[],pdfSettings:{},localUpdatedAt:'2026-10-05T12:01:00Z',current:{apartments:[{vents:[{type:'exhaust',pa:'25'}],name:'A1'}],kohde:'Test'},version:1};
 assert(dom.window.cloudPayloadMatches(first,second),'Reordered JSONB keys and timestamp-only edits must match');
 second.current.apartments[0].vents[0].pa='26';
 assert(!dom.window.cloudPayloadMatches(first,second),'Actual measurement change must differ');
 second.current.apartments.push({name:'A2'});first.current.apartments.push({name:'A2'});
 second.current.apartments[0].vents[0].pa='25';second.current.apartments.reverse();
 assert(!dom.window.cloudPayloadMatches(first,second),'Array ordering must be preserved');
 console.log('Cloud content comparison ignores object-key order and top-level save time, detects measurement and array-order changes');
}finally{dom.window.close()}
