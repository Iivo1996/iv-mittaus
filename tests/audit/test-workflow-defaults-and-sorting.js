const fs=require("fs");
const {JSDOM}=require("jsdom");
const html=fs.readFileSync("work/current-index.html","utf8");

const vent=(type,valve,adjusted,marker)=>({space:"OH",type,valve,kpl:"1",pa:"12",target:"8",adjusted,position:"-3",marker});
const original={
  projectId:"safety-project",kohde:"Säilyvyystesti",paiva:"2026-10-01",mittaaja:"Tekijä",valine:"Mittari",
  workTypes:["measurement"],customWorkType:"",cleaningItems:[],customCleaningItem:"",conditionRatings:{},
  workEntries:[{id:"entry-1",date:"2026-10-01",target:"A12",title:"Kesken",text:"Älä hävitä",cleaningItems:[],customCleaningItem:"",conditionRatings:{},photos:[{id:"photo-1",localKey:"photo-1",storagePath:"user/project/photo.jpg",width:800,height:600}]}],
  apartments:[
    {name:"B2",comments:"B2 kommentti",vents:[vent("exhaust","KSO-B2","7","B2")],pressureEnabled:true,pressureDifference:"-5",speedEnabled:true,measurementSpeed:"60 %",customApartmentValue:"keep-B2"},
    {name:"A12",comments:"A12 kommentti",vents:[vent("supply","KTS-A12","9","A12")],pressureEnabled:false,pressureDifference:"",speedEnabled:false,measurementSpeed:""},
    {name:"A2",comments:"A2 kommentti",vents:[vent("exhaust","KSO-A2","8","A2")],pressureEnabled:false,pressureDifference:"",speedEnabled:false,measurementSpeed:""},
    {name:"B1",comments:"B1 kommentti",vents:[vent("supply","KTS-B1","6","B1")],pressureEnabled:false,pressureDifference:"",speedEnabled:false,measurementSpeed:""},
    {name:"A1",comments:"A1 kommentti",vents:[vent("exhaust","KSO-A1","10","A1")],pressureEnabled:false,pressureDifference:"",speedEnabled:false,measurementSpeed:""},
    {name:"C1",comments:"Vanha ilman type-kenttää",vents:[{space:"PH",valve:"Vanha",kpl:"1",pa:"9",target:"5",adjusted:"5",position:"2",marker:"legacy-missing-type"}],pressureEnabled:false,pressureDifference:"",speedEnabled:false,measurementSpeed:""}
  ]
};

const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://example.test/",beforeParse(window){
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.scrollTo=()=>{};window.requestAnimationFrame=fn=>fn();window.localStorage.setItem("iv_proto",JSON.stringify(original));
}});
dom.window.HTMLElement.prototype.scrollIntoView=()=>{};

setTimeout(async()=>{
  const names=()=>JSON.parse(dom.window.localStorage.getItem("iv_proto")).apartments.map(a=>a.name);
  dom.window.save();
  let saved=JSON.parse(dom.window.localStorage.getItem("iv_proto"));
  if(names().join(",")!=="A1,A2,A12,B1,B2,C1")throw new Error("Natural apartment order failed: "+names().join(","));
  const byName=Object.fromEntries(saved.apartments.map(a=>[a.name,a]));
  if(byName.A12.vents[0].type!=="supply"||byName.A2.vents[0].type!=="exhaust")throw new Error("Existing vent types changed");
  if(byName.C1.vents[0].type!=="supply")throw new Error("Legacy missing type must keep the old supply fallback");
  if(byName.B2.comments!=="B2 kommentti"||byName.B2.pressureDifference!=="-5"||byName.B2.measurementSpeed!=="60 %"||byName.B2.customApartmentValue!=="keep-B2")throw new Error("Existing apartment content changed");
  if(saved.workEntries[0].text!=="Älä hävitä"||saved.workEntries[0].photos[0].storagePath!=="user/project/photo.jpg")throw new Error("Work entry or photo reference changed");

  const defaultInput=dom.window.document.getElementById("default-exhaust-valve");defaultInput.value="KSO-125";defaultInput.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
  saved=JSON.parse(dom.window.localStorage.getItem("iv_proto"));
  const a1Index=saved.apartments.findIndex(a=>a.name==="A1");
  dom.window.addVent(a1Index);
  saved=JSON.parse(dom.window.localStorage.getItem("iv_proto"));
  const added=saved.apartments.find(a=>a.name==="A1").vents.at(-1);
  if(added.type!=="exhaust"||added.valve!=="KSO-125")throw new Error("New vent defaults failed");
  const oldVent=saved.apartments.find(a=>a.name==="A1").vents[0];
  if(oldVent.valve!=="KSO-A1"||oldVent.adjusted!=="10"||oldVent.marker!=="A1")throw new Error("Adding a vent changed an existing vent");

  dom.window.toggleApartmentOption(a1Index,"pressureEnabled");
  saved=JSON.parse(dom.window.localStorage.getItem("iv_proto"));
  if(saved.apartments.find(a=>a.name==="A1").pressureDifference!=="-")throw new Error("New pressure difference did not default to minus");
  const b2Index=saved.apartments.findIndex(a=>a.name==="B2");dom.window.toggleApartmentOption(b2Index,"pressureEnabled");dom.window.toggleApartmentOption(b2Index,"pressureEnabled");
  saved=JSON.parse(dom.window.localStorage.getItem("iv_proto"));
  if(saved.apartments.find(a=>a.name==="B2").pressureDifference!=="-5")throw new Error("Existing pressure difference changed");

  const pdf=await dom.window.makePdf(),raw=Buffer.from(pdf).toString("latin1"),positions=["A1","A2","A12","B1","B2","C1"].map(name=>raw.lastIndexOf("("+name+") Tj"));
  if(positions.some(position=>position<0)||positions.some((position,index)=>index&&position<=positions[index-1]))throw new Error("PDF apartment order failed: "+positions.join(","));

  console.log("workflow defaults, natural sorting, PDF order and data preservation ok");
},120);
