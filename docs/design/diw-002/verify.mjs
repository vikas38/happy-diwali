import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root=fileURLToPath(new URL('.',import.meta.url))
mkdirSync(root+'review',{recursive:true})
const browser=await chromium.launch()
const page=await browser.newPage()
const results=[]
try {
  for(const [name,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390],['narrow',320,712],['state-preparation',390,844],['state-reward',390,844],['state-library',390,844]]) {
    await page.setViewportSize({width,height})
    await page.goto(new URL(name+'.svg',import.meta.url).href)
    const dimensions=await page.locator('svg').evaluate(el=>({width:el.width.baseVal.value,height:el.height.baseVal.value}))
    if(dimensions.width!==width||dimensions.height!==height)throw Error(name+' dimensions mismatch')
    await page.screenshot({path:root+'review/'+name+'.png'})
    results.push({name,...dimensions})
  }
  await page.setViewportSize({width:1440,height:900})
  await page.goto(new URL('index.html',import.meta.url).href)
  const imageCount=await page.locator('img').count()
  const loaded=await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))
  if(imageCount!==12||!loaded)throw Error('Storyboard image loading failed')
  await page.screenshot({path:root+'review/storyboard.png'})
  const lum=hex=>{const rgb=hex.match(/\w\w/g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
  const pairs=[['ivory / panel','FFF4DF','271B35'],['secondary / raised','D6C6B2','382543'],['primary text / marigold','281A15','F3BB56'],['teal / panel','61C9BE','271B35'],['marigold / raised','F3BB56','382543']].map(([name,a,b])=>{const l=[lum(a),lum(b)].sort((a,b)=>b-a);return{name,ratio:Number(((l[0]+.05)/(l[1]+.05)).toFixed(2))}})
  if(pairs.some(p=>p.ratio<4.5))throw Error('Palette contrast failed')
  writeFileSync(root+'validation.json',JSON.stringify({date:'2026-10-24',scope:'Static design compositions; no production accessibility certification',dimensions:results,storyboard:{imageCount,loaded},contrast:pairs},null,2)+'\n')
  console.log(JSON.stringify({dimensions:results,storyboard:{imageCount,loaded},contrast:pairs},null,2))
}finally{await browser.close()}
