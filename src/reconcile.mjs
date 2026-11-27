function parseCsv(text) {
  text=text.replace(/^\uFEFF/,"");
  const rows=[]; let row=[],field="",quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c===","){row.push(field);field="";closed=false;}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(field);if(row.some(v=>v!==""))rows.push(row);row=[];field="";closed=false;}
    else if(c==='"'&&!field&&!closed)quoted=true;
    else if(c==='"'||closed)throw new Error("Malformed CSV quoting");
    else field+=c;
  }
  if(quoted)throw new Error("Unclosed CSV field");
  if(field||row.length||closed){row.push(field);if(row.some(v=>v!==""))rows.push(row);}
  if(!rows.length)throw new Error("CSV is empty");
  const header=rows.shift().map(v=>v.trim());
  if(header.length!==3||new Set(header).size!==3||!["sku","warehouse","quantity"].every(v=>header.includes(v)))throw new Error("Expected columns: sku, warehouse, quantity");
  if(rows.length>100000)throw new Error("Maximum 100,000 records per file");
  return rows.map((r,i)=>({line:i+2,sku:r[header.indexOf("sku")]?.trim()??"",warehouse:r[header.indexOf("warehouse")]?.trim()??"",quantity:r[header.indexOf("quantity")]?.trim()??"",width:r.length}));
}

function reconcile(source,target,tolerance=0){
  if(!Number.isSafeInteger(tolerance)||tolerance<0||tolerance>1000000000)throw new Error("Tolerance must be a nonnegative integer up to 1 billion");
  const issues=[], blocked=new Set();
  function index(rows,side){
    const groups=new Map();
    for(const row of rows){
      const key=JSON.stringify([row.sku,row.warehouse]);
      const validKey=Boolean(row.sku&&row.warehouse);
      if(row.width!==3||!validKey||!/^\d+$/.test(row.quantity)||Number(row.quantity)>1000000000){
        issues.push({type:"invalid",side,sku:row.sku,warehouse:row.warehouse,detail:"Record "+row.line+": invalid key, quantity or column count"});
        if(validKey)blocked.add(key);
        continue;
      }
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(Number(row.quantity));
    }
    const result=new Map();
    for(const [key,values] of groups){
      const [sku,warehouse]=JSON.parse(key);
      if(values.length>1){blocked.add(key);issues.push({type:"duplicate",side,sku,warehouse,detail:values.length+" records share this key"});}
      else result.set(key,values[0]);
    }
    return result;
  }
  const a=index(source,"source"),b=index(target,"target");
  let matched=0,withinTolerance=0,compared=0;
  for(const key of new Set([...a.keys(),...b.keys()])){
    if(blocked.has(key))continue;
    const [sku,warehouse]=JSON.parse(key);
    const s=a.get(key),t=b.get(key);
    if(s===undefined)issues.push({type:"unexpected",side:"target",sku,warehouse,detail:"Target quantity "+t+" has no source record"});
    else if(t===undefined)issues.push({type:"missing",side:"target",sku,warehouse,detail:"Source quantity "+s+" has no target record"});
    else {compared++;const delta=t-s;if(delta===0)matched++;else if(Math.abs(delta)<=tolerance)withinTolerance++;else issues.push({type:"mismatch",side:"both",sku,warehouse,detail:"Source "+s+", target "+t+", delta "+delta});}
  }
  if(!source.length||!target.length)issues.push({type:"empty",side:!source.length&&!target.length?"both":!source.length?"source":"target",sku:"",warehouse:"",detail:"At least one dataset has no records"});
  return {status:issues.length?"BLOCKED":"READY",sourceRecords:source.length,targetRecords:target.length,compared,matched,withinTolerance,tolerance,issues};
}

export {parseCsv,reconcile};
