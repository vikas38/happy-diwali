import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('home and courtyard accessibility; keyboard journey, pause and resume',async({page})=>{
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR:',e.message)})
  await page.goto('/')
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([])
  await page.getByRole('button',{name:"Let's light it up"}).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button',{name:'Step into the courtyard'}).press('Enter')
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([])
  await page.getByRole('button',{name:'Phuljhari',exact:true}).press('Enter')
  await page.getByRole('button',{name:'Watch Phuljhari'}).press('Enter')
  await page.getByRole('button',{name:'Ask the grown-up to start'}).press('Enter')
  await page.getByRole('button',{name:'Calm Corner',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Calm Corner'})).toBeVisible()
  await page.getByRole('button',{name:'Close Calm Corner'}).click()
  await expect(page.getByRole('dialog',{name:'You did it!'})).toBeVisible({timeout:20000})
  expect(errors).toEqual([])
})

test('mobile layout, storage failure and reduced motion',async({page})=>{
  page.on('pageerror',e=>console.log('MOBILE ERROR:',e.stack))
  await page.setViewportSize({width:390,height:844})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}}))
  await page.goto('/')
  await expect(page.getByRole('button',{name:'Motion off'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.getByRole('button',{name:"Let's light it up"}).click()
  await page.getByRole('button',{name:'Step into the courtyard'}).click()
  await expect(page.getByRole('button',{name:'Gentle visuals on'})).toBeVisible()
})

test('every synthesized sound stays within digital output cap in every mode',async({page})=>{
  await page.goto('/')
  const peaks=await page.evaluate(async()=>{
    const {SoundEngine}=await import('/src/audio/SoundEngine.js')
    const {playFireworkSound}=await import('/src/audio/FireworkSound.js')
    const {MAX_OUTPUT_PEAK}=await import('/src/safety/limits.js')
    const values=[]
    for(const mode of ['SOFT','NORMAL','LOUD'])for(const kind of ['sparkler','fountain','spinner','whoosh','pop','boom','fuse']){
      const sound=new SoundEngine(),ctx=new OfflineAudioContext(1,44100*2,44100)
      const original=window.AudioContext
      try { window.AudioContext=function(){return ctx};sound.setIntensity(mode);sound.setMasterVolume(1);sound.init() } finally { window.AudioContext=original }
      playFireworkSound(sound,kind,1)
      const buffer=await ctx.startRendering();let peak=0;for(const value of buffer.getChannelData(0))peak=Math.max(peak,Math.abs(value))
      values.push({kind,mode,peak,cap:MAX_OUTPUT_PEAK})
    }
    return values
  })
  for(const result of peaks){expect(result.peak).toBeGreaterThan(0);expect(result.peak).toBeLessThanOrEqual(result.cap+.00001)}
})

test('canvas failure offers a working return to festival',async({page})=>{
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null})
  await page.goto('/');await page.getByRole('button',{name:"Let's light it up"}).click()
  await expect(page.getByRole('alert')).toContainText('could not draw')
  await page.getByRole('button',{name:'Back to festival'}).click()
  await expect(page.getByRole('heading',{name:'Let your Diwali glow'})).toBeVisible()
})
