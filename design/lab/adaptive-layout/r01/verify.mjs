import assert from 'node:assert/strict';
import {plan,allocate,signature} from './engine.mjs';
let checks=0;function ok(condition,message){assert.ok(condition,message);checks++}
const items=[signature({kind:'text',labelMin:48}),signature({kind:'number',integerOnly:true,numberMin:0,numberMax:9,labelMin:70}),signature({kind:'number',integerOnly:true,numberMin:0,numberMax:9,labelMin:70})];
const rows=plan(items,428);ok(rows.length===2,'calle y dos números: dos líneas');ok(rows[0].indices.join()==='0'&&rows[1].indices.join()==='1,2','calle arriba y números juntos');ok(rows[1].widths.every(w=>w<=70.01),'números no llenan ancho');
for(const width of [40,100,240,320,428,720,1120])for(let count=1;count<=20;count++){
 const source=Array.from({length:count},(_,i)=>({min:44+(i%3)*30,preferred:80+(i%4)*70,max:i%2?180:Infinity,weight:1+i%3}));const result=plan(source,width);
 ok(result.flatMap(r=>r.indices).join()===source.map((_,i)=>i).join(),'orden');
 for(const row of result){ok(row.widths.reduce((a,b)=>a+b,0)+12*(row.indices.length-1)<=width+.1,'sin desborde');row.indices.forEach((i,k)=>ok(row.widths[k]<=Math.max(source[i].min,source[i].max)+.1,'máximo'))}
}
ok(allocate([{min:44,preferred:80,max:100,weight:1}],460)[0]===100,'compacto solo limitado');
ok(signature({kind:'number',integerOnly:true,numberMin:0,numberMax:9}).origin==='rango numérico','pista de rango');
console.log(`${checks} comprobaciones del motor correctas`);
