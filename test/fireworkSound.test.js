import { describe, it, expect, vi } from 'vitest'
import { playFireworkSound } from '../src/audio/FireworkSound.js'
function audioFixture(){
 const nodes=[]
 const param=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()})
 const node=()=>{const n={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),gain:param(),frequency:param(),Q:param(),pan:param()};nodes.push(n);return n}
 const sound={supported:true,ctx:{currentTime:5,createGain:node,createBiquadFilter:node,createOscillator:node,createStereoPanner:node},intensityGain:{},createNoiseSource:node,_crackerNodes:new Set(),_activeNodes:new Set(),trackCrackerNode(n,g){this._crackerNodes.add({node:n,gain:g});this._activeNodes.add(n)}}
 return {sound,nodes}
}
describe('Firework sound graph',()=>{
 it.each(['sparkler','fountain','spinner','whoosh','pop','boom','fuse'])('routes %s through the volume/intensity chain and releases its nodes',kind=>{
  const {sound,nodes}=audioFixture();const stop=playFireworkSound(sound,kind,1,.4)
  expect(nodes.some(n=>n.connect.mock.calls.some(([target])=>target===sound.intensityGain))).toBe(true)
  expect(nodes.some(n=>n.start.mock.calls.length)).toBe(true)
  stop();stop()
  expect(sound._crackerNodes.size).toBe(0)
  expect(sound._activeNodes.size).toBe(0)
  for(const n of nodes)expect(n.disconnect).toHaveBeenCalledOnce()
 })
 it('works silently without Web Audio',()=>{expect(()=>playFireworkSound({supported:false},'boom')()).not.toThrow()})
})
