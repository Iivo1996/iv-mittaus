const fs=require("fs");
const {JSDOM}=require("jsdom");
const html=fs.readFileSync("work/current-index.html","utf8");
const saved={id:"saved",name:"Toinen",savedAt:"2026-10-01T00:00:00Z",data:{projectId:"saved",kohde:"Toinen",paiva:"2026-10-01",mittaaja:"",valine:"",apartments:[],workEntries:[]}};
const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.test/",beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=f=>f();w.localStorage.setItem("iv_projects",JSON.stringify([saved]));}});
dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
const w=dom.window;
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const current={projectId:"current",kohde:"Kesken",paiva:"2026-10-05",mittaaja:"Tekijä",valine:"",workTypes:[],workEntries:[],apartments:[{name:"A1",comments:"",vents:[{space:"K",type:"exhaust",valve:"KSO-100",kpl:"1",pa:"20",adjusted:"11",target:"",position:"5"}]}]};
setTimeout(async()=>{
  try{
    w.eval("data=normalizeData("+JSON.stringify(current)+")");w.render();w.loadProject("saved");
    let projects=JSON.parse(w.localStorage.getItem("iv_projects"));
    assert(projects.find(p=>p.id==="current")?.data.apartments[0].vents[0].adjusted==="11","Switch lost unsaved measurement");
    assert(JSON.parse(w.localStorage.getItem("iv_proto")).kohde==="Toinen","Target was not opened");
    w.eval("data=normalizeData("+JSON.stringify({...current,projectId:"current",apartments:[{...current.apartments[0],vents:[{...current.apartments[0].vents[0],adjusted:"12"}]}]})+")");w.render();
    const file={text:async()=>JSON.stringify({format:"iv-mittaus-project",version:1,project:{...saved.data,projectId:"imported",kohde:"Tuotu"}})};
    await w.importProjectFile(file);
    projects=JSON.parse(w.localStorage.getItem("iv_projects"));
    assert(projects.find(p=>p.id==="current")?.data.apartments[0].vents[0].adjusted==="12","Import lost current measurement");
    assert(JSON.parse(w.localStorage.getItem("iv_proto")).kohde==="Tuotu","Import did not open imported project");
    w.eval("data=normalizeData("+JSON.stringify({...current,projectId:"current"})+")");w.render();
    const original=w.Storage.prototype.setItem;
    w.Storage.prototype.setItem=function(key,value){if(key==="iv_projects")throw new Error("QuotaExceededError");return original.call(this,key,value)};
    w.loadProject("saved");
    assert(w.eval("data.kohde")==="Kesken","Failed snapshot switched away from current work");
    await w.importProjectFile(file);
    assert(w.eval("data.kohde")==="Kesken","Failed snapshot import switched away from current work");
    console.log("project switch/import preservation ok");
  }catch(error){console.error(error);process.exitCode=1}finally{w.close()}
},80);
