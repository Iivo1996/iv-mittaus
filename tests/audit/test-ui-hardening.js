const fs=require('fs'),assert=require('assert'),crypto=require('crypto'),{JSDOM}=require('jsdom'),html=fs.readFileSync('work/current-index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/',beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.requestAnimationFrame=f=>f();}}),w=dom.window;
try{
 const csp=w.document.querySelector('[http-equiv="Content-Security-Policy"]').content,script=w.document.querySelector('script').textContent;assert(csp.includes("'sha256-"+crypto.createHash('sha256').update(script).digest('base64')+"'"));assert(csp.includes("script-src-attr 'none'"));
 assert(!w.document.querySelector('[onclick],[oninput],[onchange]'));
 w.document.querySelector('[data-ui-click="addApartment()"]').click();assert.equal(w.eval('data.apartments.length'),1);
 w.document.querySelector('[data-ui-click="addVent(0)"]').click();const input=w.document.querySelector('[data-ui-input="updateVent(0,0,\'adjusted\',this.value)"]');input.value='10';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(w.eval('data.apartments[0].vents[0].adjusted'),'10');
 const kpl=w.document.querySelector('[data-ui-input="updateVent(0,0,\'kpl\',this.value)"]');kpl.value='2';kpl.dispatchEvent(new w.Event('input',{bubbles:true}));assert(w.document.querySelector('#summary-exhaust-0').textContent.includes('20'));
 w.document.querySelector('[data-ui-click="toggleWorkType(\'cleaning\')"]').click();const cleaning=w.document.querySelector('#project-cleaning-grid [data-ui-click]');cleaning.click();assert.equal(w.eval('data.cleaningItems.length'),1);
 w.pendingPdfSettings={logoData:'x" onerror="window.pwned=1',logo2Data:'x" onerror="window.pwned=1'};w.renderLogoPreview();w.renderSecondLogoPreview();assert(!w.document.querySelector('[onerror]'));
 for(const path of ['owner/a%2f../e/p.jpg','owner/a/e/p.jpg?x','owner/a//p.jpg','owner/a.b/e/p.jpg']){w.eval('cloudUser={id:"owner"}');assert(!w.ownPhotoStoragePath(path))}
 const button=w.document.createElement('button');button.setAttribute('data-ui-click','window.pwned=1');w.document.body.append(button);button.click();assert(!w.pwned);
 w.openProjects();w.document.querySelector('#projects-modal').click();assert(!w.document.querySelector('#projects-modal').classList.contains('open'));
 console.log('CSP hash matches; delegated inputs/buttons/overlays work; logo attributes and storage paths reject injection');
}catch(e){console.error(e);process.exitCode=1}finally{w.close()}
