import { effectOrigin, STAGE } from '../render/layers/Courtyard.js'
import { playFireworkSound } from '../audio/FireworkSound.js'
export { fireRewardConfetti } from './rewardConfetti.js'
export const SHOW_DURATIONS = {0:3000,1:3500,2:3500,3:4000,4:4500,5:5000}
const TAU=Math.PI*2
export const CRACKER_TEST_META = {
  0:{audioType:'granular-crackle',particleShape:'spark',durationMs:3000},
  1:{audioType:'noise-fountain',particleShape:'spark',durationMs:3500},
  2:{audioType:'pulsed-noise',particleShape:'spark',durationMs:3500},
  3:{audioType:'exhaust-impact',particleShape:'spark',durationMs:4000},
  4:{audioType:'noise-impact',particleShape:'spark',durationMs:4500},
  5:{audioType:'sub-drop',particleShape:'spark',durationMs:5000},
}
export function playCrackerShow(index, engines, onDone) {
  const {particles:p,renderer:r,sound,background,jellySquash}=engines
  const duration=SHOW_DURATIONS[index]??3000, timers=[], sounds=[]
  let cancelled=false, tick=0
  const {x,y}=effectOrigin(index,r.width,r.height)
  const scale=Math.max(.7,Math.min(1.5,r.height/650,r.width/650))
  const motionReduced=r._reducedMotion
  const density=motionReduced?.55:1
  const later=(fn,ms)=>{const id=setTimeout(()=>{if(!cancelled)fn()},ms);timers.push(id)}
  const audio=(kind,seconds=1,px=x)=>sounds.push(playFireworkSound(sound,kind,seconds,(px/r.width-.5)*1.2))
  const smoke=(px,py,size=18)=>p.spawn(px,py,{shape:'smoke',vx:12+Math.random()*12,vy:-20-Math.random()*18,gravity:-3,drag:.998,size,alpha:.28,decay:.1,hue:30,sat:8,light:60})
  const spark=(px,py,vx,vy,extra={})=>p.spawn(px,py,{vx:vx*scale,vy:vy*scale,gravity:115*scale,drag:.992,size:.65+Math.random()*1.1,alpha:1,decay:.55+Math.random()*.4,hue:32+Math.random()*17,sat:90,light:74,shape:'spark',glow:true,trail:7,...extra})
  const flash=(px,py,radius=140,hue=38)=>{p.flash?.(px,py,radius*scale,hue,motionReduced?.2:.45);background?.illuminate?.(motionReduced?.07:.22)}
  const burst=(px,py,count=100,power=220,hue=38)=>{flash(px,py,220,hue);for(let i=0;i<count*density;i++){const a=i/(count*density)*TAU;const speed=power*(.6+Math.random()*.4);spark(px,py,Math.cos(a)*speed,Math.sin(a)*speed,{hue:hue+Math.random()*12,decay:.35+Math.random()*.2,gravity:70*scale,drag:.992,trail:12})}for(let i=0;i<4;i++)smoke(px+(i-2)*10,py,25)}
  const started=Date.now()
  if(index===0)audio('sparkler',2.2)
  if(index===1)audio('fountain',2.5)
  if(index===2)audio('spinner',2.5)
  if(index===3)audio('whoosh',1.15)
  if(index===5)audio('fuse',1.5)
  const emitter=setInterval(()=>{
    if(cancelled)return
    const t=(Date.now()-started)/1000;tick++
    if(index===0&&t<2.2){const power=70+Math.sin(t*8)*20;for(let i=0;i<7*density;i++){const a=Math.random()*TAU;spark(x,y,Math.cos(a)*power*(.4+Math.random()),Math.sin(a)*power,{gravity:70,decay:1.1,trail:4})}if(tick%5===0){smoke(x,y,8);flash(x,y,45)}}
    if(index===1&&t<2.5){const strength=Math.sin(Math.min(1,t/2.8)*Math.PI)*.65+.45;for(let i=0;i<10*density;i++)spark(x,y,(Math.random()-.5)*150*strength,-(220+Math.random()*330)*strength,{gravity:200*scale,decay:.5+Math.random()*.3,trail:8,bounceY:r.height*STAGE.launchY,bounceDamp:.22});if(tick%4===0){smoke(x,y,17);flash(x,y,130)}}
    if(index===2&&t<2.5){const a=t*20+t*t*8;for(let i=0;i<8*density;i++){const angle=a+i*.17;spark(x+Math.cos(a)*18,y+Math.sin(a)*6,Math.cos(angle)*300,Math.sin(angle)*90-40,{gravity:40,decay:1.5,drag:.985,bounceY:y+15,bounceDamp:.15})}if(tick%5===0){smoke(x,y,12);flash(x,y,100)}}
    if(index===3&&t<1.15){const k=t/1.15,ry=y-(y-r.height*.26)*k*k,rx=x+Math.sin(k*2)*14;for(let i=0;i<5*density;i++)spark(rx,ry,(Math.random()-.5)*25,70+Math.random()*60,{gravity:40,decay:1.5,trail:6});p.flash?.(rx,ry,35,38,.09);if(tick%3===0)smoke(rx,ry,8)}
  },25);timers.push(emitter)
  if(index===3){later(()=>{const rx=x+Math.sin(2)*14,ry=r.height*.26;burst(rx,ry,150,230,35);audio('boom',1,rx)},1150);later(()=>{const ry=r.height*.26;for(let i=0;i<45*density;i++){const a=Math.random()*TAU;spark(x+Math.cos(a)*80,ry+Math.sin(a)*60,Math.cos(a)*75,Math.sin(a)*75,{hue:42,decay:1.1,trail:4})}audio('sparkler',.5)},1900)}
  if(index===4)for(let i=0;i<8;i++)later(()=>{const px=x+i*7;burst(px,y,24,140,28);audio('pop',.2,px);if(!motionReduced&&i%2===0)jellySquash?.trigger(.015)},i*180)
  if(index===5)later(()=>{burst(x,y,130,310,32);audio('boom',1.2);for(let i=0;i<8;i++)smoke(x+(i-4)*12,y,35);if(!motionReduced)jellySquash?.trigger(.035)},1500)
  function clean(){if(cancelled)return;cancelled=true;timers.forEach(id=>{clearTimeout(id);clearInterval(id)});sounds.forEach(stop=>stop())}
  later(()=>{clean();onDone?.()},duration)
  return clean
}
