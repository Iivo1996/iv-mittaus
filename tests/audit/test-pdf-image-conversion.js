const fs=require("fs"),{JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync("work/current-index.html","utf8"),{runScripts:"dangerously",url:"https://example.test/",beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.requestAnimationFrame=f=>f();}});
const w=dom.window;
setTimeout(async()=>{try{
  let drawn=false,converted=false;
  w.URL.createObjectURL=()=>"blob:photo";w.URL.revokeObjectURL=()=>{};
  w.Image=class{naturalWidth=64;naturalHeight=32;set src(value){queueMicrotask(()=>this.onload())}};
  const original=w.document.createElement.bind(w.document);
  w.document.createElement=function(name){if(name!=="canvas")return original(name);return{width:0,height:0,getContext(){return{fillStyle:"",fillRect(){},drawImage(){drawn=true}}},toBlob(callback,type){converted=type==="image/jpeg";callback(new w.Blob([new Uint8Array([255,216,255,217])],{type}))}}};
  const asset=await w.pdfJpegAsset(new w.Blob([new Uint8Array([137,80,78,71])],{type:"image/png"}));
  if(!drawn||!converted||asset.width!==64||asset.height!==32||asset.bytes[0]!==255||asset.bytes[1]!==216)throw new Error("PNG was not converted to RGB JPEG for PDF");
  console.log("PDF image decode and JPEG conversion path ok");
}catch(e){console.error(e);process.exitCode=1}finally{w.close()}},80);
