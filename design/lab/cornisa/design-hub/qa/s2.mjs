import { chromium } from '@playwright/test';
const b = await chromium.launch(); const errs=[];
for (const w of [1440,393,320]) {
  const p = await b.newPage({viewport:{width:Math.max(w+60,700),height:900}}); p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://localhost:4399/lab/isla/r02/index.html');
  await p.addStyleTag({content:'.wf-ctl{position:static!important}'});
  await p.click(`[data-w="${w}"]`); await p.uncheck('#wf-notes');
  for (const [s,n] of [['compact',0],['expanded',0],['long',0],['error',0],['compact',1]]) {
    if (n) await p.check('#opt-notch');
    await p.selectOption('#wf-state','default'); await p.selectOption('#wf-state', s); await p.waitForTimeout(300);
    const f = await p.locator('#wf-frame').boundingBox();
    await p.screenshot({path:`evidence/r02-${s}${n?'-notch':''}-${w}.png`, clip:{x:f.x+(w>600?f.width/2-320:0),y:f.y,width:w>600?640:f.width,height:260}});
  }
  await p.close();
}
console.log('errors',errs); await b.close();
