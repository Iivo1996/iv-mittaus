const fs=require('fs'),cp=require('child_process');
let failures=0;
for(const file of fs.readdirSync('tests/audit').filter(f=>f.endsWith('.js'))){
 const result=cp.spawnSync(process.execPath,['tests/audit/'+file],{stdio:'inherit',timeout:30000});
 if(result.status!==0){console.error('FAILED: '+file);failures++}
}
process.exitCode=failures?1:0;
