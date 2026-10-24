// Reproducible vector design boards. These are specifications, not game UI.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
const C = { sky:'#11122B', plum:'#30203D', panel:'#271B35', raised:'#382543', ink:'#FFF4DF', muted:'#D6C6B2', gold:'#F3BB56', dark:'#281A15', teal:'#61C9BE', rose:'#E981A0' }
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
const rect=(x,y,w,h,fill,r=0,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`
const text=(x,y,s,size=16,fill=C.ink,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(s)}</text>`
const button=(x,y,w,label,primary=false)=>rect(x,y,w,44,primary?C.gold:C.raised,12)+text(x+12,y+28,label,14,primary?C.dark:C.ink,600)
const states = [
  ['selection','Choose your light','Start with Phuljhari, a gentle sparkle.','Choose Phuljhari','Browse all','No selection yet · no automatic preview'],
  ['details','Phuljhari','A small shower of warm golden sparks.','Ask grown-up to light','Choose another','Selected · Ground · Gentle sound'],
  ['preparation','Off to our watching spot','The grown-up will light the pretend fuse.','Pause','Cancel show','Preparing · the fuse is still unlit'],
  ['countdown','Ready in 3','Stay at the watching spot with Pip.','Pause','Cancel show','3 → 2 → 1 → Glow · visible text'],
  ['show','Golden sparks, just for you','Enjoy the show from your watching spot.','Pause','Stop show','Playing · Phuljhari'],
  ['reward','Your first Phuljhari!','1 new sticker · +3 stars','Play again','Choose another','Complete · replay earns +1 star'],
  ['pause','A little breathing room','Your show is paused. Take your time.','Resume','Finish for now','Paused · restarting show uses countdown'],
  ['library','Find your next light','All 10 · Ground · Sky · Favourites','Use Anar','Back to selection','Browsing · preview is silent and reward-free'],
]
function scene(x,y,w,h,state,annotated) {
  let s=rect(x,y,w,h,'url(#sky)',20)
  s+=`<circle cx="${x+w*.84}" cy="${y+h*.14}" r="15" fill="${C.ink}" opacity=".7"/>`
  for(let i=0;i<12;i++) s+=`<circle cx="${x+24+(i*73)%(w-48)}" cy="${y+30+(i*31)%(h*.38)}" r="1.2" fill="${C.ink}" opacity=".4"/>`
  s+=rect(x,y+h*.67,w,h*.33,C.plum)
  for(const bx of [x,x+w*.82]) {
    s+=rect(bx,y+h*.49,w*.18,h*.27,'#251D38',4)
    for(let j=0;j<3;j++) s+=rect(bx+8+j*w*.05,y+h*.55,w*.035,h*.15,'#48304A',12)
    s+=`<path d="M${bx+2} ${y+h*.49} Q${bx+w*.09} ${y+h*.55} ${bx+w*.18-2} ${y+h*.49}" fill="none" stroke="${C.gold}" opacity=".55"/>`
    for(let j=0;j<5;j++) s+=`<circle cx="${bx+8+j*w*.033}" cy="${y+h*.515}" r="2" fill="${C.gold}"/>`
  }
  s+=`<ellipse cx="${x+w*.6}" cy="${y+h*.85}" rx="${w*.10}" ry="${h*.025}" fill="none" stroke="${C.muted}" opacity=".6"/>`
  const cx=x+w*.21, cy=y+h*.80
  s+=`<ellipse cx="${cx}" cy="${cy+25}" rx="25" ry="6" fill="#171326"/><circle cx="${cx}" cy="${cy-28}" r="12" fill="#C88C60"/>`
  s+=rect(cx-12,cy-15,24,35,C.gold,8)+text(cx-32,cy+48,'Watching spot',12,C.muted)
  if(['preparation','countdown'].includes(state)) s+=rect(x+w*.7,y+h*.7,20,42,C.teal,8)+text(x+w*.7-10,y+h*.7-8,'Grown-up',12,C.ink)
  const fx=x+w*.6, fy=y+h*.64
  if(['show','reward'].includes(state)) for(let i=0;i<28;i++) {
    const a=(i/28)*Math.PI*2, r=Math.min(w*.22,h*.27)
    s+=`<path d="M${fx+Math.cos(a)*r*.28} ${fy+Math.sin(a)*r*.28} L${fx+Math.cos(a)*r} ${fy+Math.sin(a)*r}" stroke="${i%3?C.gold:C.rose}" stroke-width="2" stroke-linecap="round"/>`
  } else s+=`<path d="M${fx-6} ${y+h*.82} L${fx+9} ${y+h*.72}" stroke="${C.gold}" stroke-width="4"/>`
  if(state==='countdown') s+=text(x+w*.47,y+h*.38,'3',64,C.ink,600)
  if(annotated) {
    s+=`<rect x="${x+w*.26}" y="${y+h*.17}" width="${w*.49}" height="${h*.48}" fill="none" stroke="${C.teal}" stroke-dasharray="5 6"/>`
    s+=text(x+w*.27,y+h*.17-8,'② Clear effect area',14,C.teal)
  }
  return s
}
function board(w,h,state='details',annotated=false) {
 const mobile=w<600, landscape=w>600&&h<500, header=mobile?64:56
 const row=states.find(s=>s[0]===state), [id,title,desc,primary,secondary,status]=row
 const stageH=mobile?(w===320?240:372):landscape?h-header-16:h-240
 const sideW=landscape?288:320, stageW=mobile?w-24:w-sideW-48
 const panelX=mobile?12:stageW+28, panelY=mobile?header+stageH+20:header+12
 const panelW=mobile?w-24:sideW, panelH=mobile?240:stageH
 const fullH=mobile?Math.max(h,panelY+panelH+148):h
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${fullH}" viewBox="0 0 ${w} ${fullH}" role="img" aria-labelledby="title desc"><title id="title">${w} by ${h}: ${id} design composition</title><desc id="desc">${esc(title+'. '+desc+'. Primary action: '+primary+'. Secondary: '+secondary+'. Mute and pause remain available. Concept scene artwork.')}</desc><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${C.sky}"/><stop offset="1" stop-color="${C.plum}"/></linearGradient></defs><g font-family="Segoe UI, sans-serif">`
 s+=rect(0,0,w,fullH,C.sky)+rect(0,0,w,header,C.panel)
 s+=button(12,8,64,'Back')
 if(!mobile) s+=text(96,36,'LITTLE LIGHTS',14,C.gold,600)
 s+=button(w-174,8,76,'Mute')+button(w-90,8,78,state==='pause'?'Resume':'Pause')
 s+=scene(12,header+12,stageW,stageH,state,annotated)
 s+=rect(panelX,panelY,panelW,panelH,C.panel,20)
 const px=panelX+16, py=panelY
 s+=text(px,py+30,id==='details'?'SELECTED · GROUND':id.toUpperCase(),14,C.teal,600)
 // Deliberate two-line heading at narrow widths.
 const titleLines = title.length>24?[title.split(' ').slice(0,3).join(' '),title.split(' ').slice(3).join(' ')]:[title]
 titleLines.forEach((line,i)=>{s+=text(px,py+62+i*26,line,mobile?22:24,C.ink,600)})
 const words=desc.split(' ');let line='',lines=[];for(const word of words){if((line+' '+word).length>31){lines.push(line);line=word}else line+=(line?' ':'')+word}lines.push(line)
 lines.forEach((line,i)=>{s+=text(px,py+92+(titleLines.length-1)*26+i*21,line,16,C.muted)})
 if(state==='library'&&!mobile) s+=text(px,py+170,'Anar · Selected',16,C.gold)
 const actionY=mobile?py+144:Math.max(py+192,py+panelH-120)
 s+=button(px,actionY,panelW-32,primary,true)
 s+=button(px,actionY+52,panelW-32,secondary)
 if(!mobile&&!landscape){s+=text(px,py+190,'Gentle sound · 6–8 seconds*',14,C.muted);s+=text(px,py+214,'*Timing to confirm in DIW-011.',12,C.muted)}
 const trayY=mobile?panelY+panelH+12:header+stageH+24
 if(!landscape){
  s+=text(16,trayY+20,annotated?'③ Quick tray · Browse all →':'Choose another · Browse all →',14,C.muted)
  const names=mobile?['Phuljhari','Anar','Chakri']:['Phuljhari','Anar','Chakri','Rocket','Ladi','Sutli Bomb']
  const cardW=mobile?(w-40)/3:(w-88)/6
  names.forEach((name,i)=>{const x=12+i*(cardW+12);s+=rect(x,trayY+34,cardW,72,C.raised,12,i===0?C.gold:'none');s+=text(x+10,trayY+60,name,14);s+=text(x+10,trayY+84,i===0?'Selected':'Ground / Sky',12,C.muted)})
 }
 if(state==='library') {
  s+=rect(0,header,w,fullH-header,C.sky)
  s+=rect(12,header+12,w-24,fullH-header-24,C.panel,20)
  s+=text(28,header+48,'Find your next light',24,C.ink,600)
  s+=text(28,header+78,'All 10 · Ground · Sky · Favourites',14,C.muted)
  const names=['Phuljhari','Anar','Chakri','Rocket','Ladi','Sutli Bomb','Golden Waterfall','Comet Fan','Ring Burst','Peacock Fan']
  const cw=(w-68)/2
  names.forEach((name,i)=>{const x=28+(i%2)*(cw+12),y=header+102+Math.floor(i/2)*86;s+=rect(x,y,cw,74,C.raised,12,i===1?C.gold:'none');s+=text(x+10,y+28,name,14);s+=text(x+10,y+55,i===1?'Selected':i>=6?'New · Unlocked':'Available',12,C.muted)})
  s+=text(28,header+558,'Anar · Rising golden fountain',16,C.ink)
  s+=button(28,header+578,w-56,'Use Anar',true)+button(28,header+630,w-56,'Back to selection')
 }
 if(annotated&&!mobile&&!landscape)s+=text(16,h-16,landscape?'① Fixed utilities · ③ Scrollable side rail; Browse all replaces bottom tray':'① Reserved header   ② Sky stays clear   ③ Tray outside scene   ④ Inspector owns the start action',14,C.teal)
 s+='</g></svg>'
 return s
}
for(const [name,w,h] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390],['narrow',320,568]])writeFileSync(root+name+'.svg',board(w,h,'details',true))
for(const [state] of states)writeFileSync(root+'state-'+state+'.svg',board(390,844,state))
writeFileSync(root+'index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Little Lights — gameplay design direction</title><style>*{box-sizing:border-box}body{margin:0;background:#11122B;color:#FFF4DF;font:16px/1.6 'Segoe UI',sans-serif}main{max-width:1488px;margin:auto;padding:32px}h1{font:44px Georgia,serif;color:#F3BB56;margin:8px 0}h2{font-size:24px}p{max-width:80ch;color:#D6C6B2}a{color:#61C9BE}nav{display:flex;gap:24px;flex-wrap:wrap}figure{margin:24px 0}img{display:block;max-width:100%;height:auto;border:1px solid #65516F;border-radius:16px}figcaption{padding:12px 0;color:#D6C6B2}.phones,.states{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:24px}.phones img,.states img{width:100%;max-width:390px}.note{border-left:3px solid #61C9BE;padding:8px 16px}a:focus-visible{outline:3px solid #F3BB56;outline-offset:5px}</style><main><p>DIW-002 / DESIGN HANDOFF / 24 OCTOBER 2026</p><h1>A courtyard full of little lights.</h1><p>A quiet indigo sky, marigold warmth and one clear next step. These are annotated design compositions, not screenshots of implemented gameplay. Scene geometry and characters are concept placeholders; see the asset inventory in the specification.</p><nav><a href="#layouts">Responsive compositions</a><a href="#story">Eight-state storyboard</a><a href="specification.md">Detailed specification & asset list</a></nav><h2 id="layouts">Space for the show</h2><figure><img src="desktop.svg" alt="Desktop layout with stage at left, inspector at right and separate tray below"><figcaption>1440 × 900 · Reserved header, 1,072 × 660 scene, 320 px inspector. Teal boundary indicates the clear effect area, not production chrome.</figcaption></figure><div class="phones"><figure><img src="portrait.svg" alt="390 pixel portrait composition"><figcaption>390 × 844 · Scene → selected action strip → horizontal tray. Header retains labeled mute and pause.</figcaption></figure><figure><img src="narrow.svg" alt="320 pixel composition with deliberate vertical scrolling"><figcaption>320 × 568 viewport · Content extends to 712 px: scroll the page rather than shrinking text or targets. Sticky utility header in implementation.</figcaption></figure></div><figure><img src="landscape.svg" alt="844 by 390 landscape with side controls"><figcaption>844 × 390 · Wide scene and 288 px side rail. Rail scrolls independently; Browse all replaces the bottom tray.</figcaption></figure><p class="note">Annotation key: ① persistent utility header; ② unobstructed effect zone; ③ selection outside the sky; ④ a single dominant action in the inspector. All dimensions are CSS pixels; safe-area insets add to reserved bands.</p><h2 id="story">Choose → prepare → watch → keep the memory</h2><p>Each frame is a deliberate state, not an automatic slideshow. During preparation, countdown and the show, Pause is the dominant available action; the phase advances automatically. Library and pause replace the action surface. Reduced-motion behavior is static in these boards and specified per state.</p><div class="states">${states.map(([id,title,desc,primary,secondary,status],i)=>`<figure><img src="state-${id}.svg" alt="${esc(id+': '+title+'. '+status)}"><figcaption><strong>${i+1}. ${esc(id)}</strong><br>${esc(status)}<br>Primary: ${esc(primary)} · Back: ${esc(secondary)}</figcaption></figure>`).join('')}</div><p class="note">The library frame specifies category filters, 10 tiles and a persistent selected-item footer. The full interaction, focus and interruption contracts are in the specification. No automatic playback, rewards, audio or storage changes occur in this design artifact.</p></main></html>`)
