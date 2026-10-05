// Kiwi: motor experimental puro. No API pública ni implementación de packages.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function normalize(item){
 const min=Math.max(0,Number(item.min)||0), max=Math.max(min,Number.isFinite(item.max)?item.max:Infinity);
 return {...item,min,preferred:clamp(Number(item.preferred)||min,min,max),max,weight:Math.max(.01,Number(item.weight)||1)};
}
export function allocate(source,width,gap=12){
 const items=source.map(normalize), available=Math.max(0,width-gap*Math.max(0,items.length-1));
 const minimum=items.reduce((s,x)=>s+x.min,0);
 if(minimum>available)return items.map(x=>minimum?available*x.min/minimum:0);
 let result=items.map(x=>x.preferred), total=result.reduce((a,b)=>a+b,0);
 if(total>available){const capacity=total-minimum;return result.map((v,i)=>v-(total-available)*(v-items[i].min)/capacity)}
 let remaining=available-total, active=items.map((_,i)=>i).filter(i=>result[i]<items[i].max);
 while(remaining>.01&&active.length){
  const weights=active.reduce((s,i)=>s+items[i].weight,0);let used=0;
  for(const i of active){const addition=Math.min(remaining*items[i].weight/weights,items[i].max-result[i]);result[i]+=addition;used+=addition}
  if(used<.0001)break;remaining-=used;active=active.filter(i=>result[i]+.01<items[i].max);
 }
 return result;
}
export function plan(source,width,gap=12){
 const items=source.map(normalize), n=items.length, best=Array(n+1);best[n]={cost:0,rows:[]};
 for(let start=n-1;start>=0;start--){
  for(let end=start+1;end<=n;end++){
   const row=items.slice(start,end), sum=row.reduce((s,x)=>s+x.min,0)+gap*(row.length-1);
   if(row.length>1&&sum>width+.1)break;
   const widths=allocate(row,width,gap);
   const compression=row.reduce((s,x,i)=>s+Math.pow(Math.max(0,x.preferred-widths[i])/Math.max(1,x.preferred),2),0);
   const cost=1+24*compression+best[end].cost;
   if(!best[start]||cost<best[start].cost-.0001)best[start]={cost,rows:[{indices:Array.from({length:end-start},(_,i)=>start+i),widths},...best[end].rows]};
  }
 }
 return best[0]?.rows||[];
}
// Longitud semántica opcional: número acotado, formato o maxlength; nunca valor actual.
export function signature({kind='text',labelMin=0,characters,numberMin,numberMax,integerOnly=false,formatLength,capacity,unit=8}){
 let length=characters,origin='pista explícita';
 if(!Number.isFinite(length)&&kind==='number'&&integerOnly&&Number.isFinite(numberMin)&&Number.isFinite(numberMax)){length=Math.max(String(numberMin).length,String(numberMax).length);origin='rango numérico'}
 if(!Number.isFinite(length)&&Number.isFinite(formatLength)){length=formatLength;origin='formato'}
 if(!Number.isFinite(length)&&Number.isFinite(capacity)){length=Math.min(capacity,32);origin='capacidad, limitada como pista visual'}
 if(!Number.isFinite(length)){length=kind==='text'?40:18;origin='perfil de respaldo'}
 const min=Math.max(44,labelMin,kind==='text'?unit*18:unit*7);
 const preferred=Math.max(min,unit*(length+4));
 const max=kind==='text'?Infinity:Math.max(preferred,min);
 return {min,preferred,max,weight:kind==='text'?3:1,origin};
}
