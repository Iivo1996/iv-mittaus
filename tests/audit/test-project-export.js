const fs=require("fs");
const {JSDOM}=require("jsdom");
const html=fs.readFileSync("work/current-index.html","utf8");
let exportedBlob=null,downloadName="";
const project={projectId:"project-1",kohde:"Varmuuskopio",paiva:"2026-10-01",mittaaja:"Tekijä",valine:"",workTypes:[],customWorkType:"",cleaningItems:[],customCleaningItem:"",conditionRatings:{},apartments:[{name:"A1",comments:"Kesken",vents:[{space:"OH",type:"exhaust",valve:"KSO-125",kpl:"1",pa:"10",target:"8",adjusted:"7",position:"-3"}],pressureEnabled:true,pressureDifference:"-4",speedEnabled:false,measurementSpeed:""}],workEntries:[{id:"entry-1",date:"2026-10-01",target:"A1",title:"Kuvat",text:"Säilytä",cleaningItems:[],customCleaningItem:"",conditionRatings:{},photos:[{id:"photo-1",localKey:"photo-1",width:2,height:2}]}]};
const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.test/",beforeParse(window){window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};window.requestAnimationFrame=fn=>fn();window.localStorage.setItem("iv_proto",JSON.stringify(project));window.URL.createObjectURL=blob=>{exportedBlob=blob;return"blob:test"};window.URL.revokeObjectURL=()=>{}}});
dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
dom.window.HTMLAnchorElement.prototype.click=function(){downloadName=this.download};
const readText=blob=>new Promise((resolve,reject)=>{const reader=new dom.window.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsText(blob)});
setTimeout(async()=>{
  await dom.window.cachePhotoBlob("photo-1",new dom.window.Blob([new Uint8Array([1,2,3,4])],{type:"image/jpeg"}));
  await dom.window.exportCurrentProject();
  if(!exportedBlob||downloadName!=="Varmuuskopio.ivprojekti.json")throw new Error("Project backup was not downloaded");
  const payload=JSON.parse(await readText(exportedBlob)),photo=payload.project.workEntries[0].photos[0];
  if(payload.format!=="iv-mittaus-project"||payload.version!==1)throw new Error("Backup envelope is invalid");
  if(payload.project.apartments[0].vents[0].adjusted!=="7"||payload.project.apartments[0].pressureDifference!=="-4")throw new Error("Measurement data changed during export");
  if(!String(photo.data||"").startsWith("data:image/jpeg;base64,"))throw new Error("Locally stored photo was not embedded in backup");
  console.log("project JSON backup preserves measurements and embeds local photos");process.exit(0);
},120);
