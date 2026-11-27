import {readFileSync,statSync} from 'node:fs';
import {parseCsv,reconcile} from './reconcile.mjs';

function load(path){
  if(statSync(path).size>10000000)throw new Error('Input exceeds 10 MB: '+path);
  return parseCsv(readFileSync(path,'utf8'));
}

try {
  const [source,target,tolerance='0',...extra]=process.argv.slice(2);
  if(!source||!target||extra.length||!/^\d+$/.test(tolerance))throw new Error('Usage: node src/cli.mjs SOURCE.csv TARGET.csv [tolerance]');
  const report=reconcile(load(source),load(target),Number(tolerance));
  console.log(JSON.stringify(report,null,2));
  process.exitCode=report.status==='READY'?0:2;
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
