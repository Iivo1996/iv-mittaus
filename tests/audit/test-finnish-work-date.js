const fs=require("fs"),{JSDOM}=require("jsdom");
const dom=new JSDOM(fs.readFileSync("work/current-index.html","utf8"),{runScripts:"dangerously",url:"https://example.test/",beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.requestAnimationFrame=f=>f();}});
setTimeout(()=>{try{
  const w=dom.window;
  w.eval("Date=class extends Date{constructor(...args){super(...(args.length?args:['2026-07-31T21:30:00Z']))}}");
  if(w.eval("todayInFinland()")!=="2026-08-01"||w.eval("emptyData().paiva")!=="2026-08-01")throw new Error("Summer midnight used UTC date");
  w.eval("Date=class extends Date{constructor(...args){super(...(args.length?args:['2026-12-31T22:30:00Z']))}}");
  if(w.eval("todayInFinland()")!=="2027-01-01"||w.eval("emptyData().paiva")!=="2027-01-01")throw new Error("Winter midnight used UTC date");
  console.log("Finnish dates across summer and winter midnight ok");
}catch(e){console.error(e);process.exitCode=1}finally{dom.window.close()}},80);
