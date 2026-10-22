import React from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import CrackerArt from './CrackerArt.jsx'
const labels=['A gentle shimmer','A golden fountain','A whirling glow','A skyward burst','A rhythm of sparks','A glowing finale']
export default function CrackerCarousel({unlocked,selectedCracker,onSelect}) {
 return <nav className="firework-dock" aria-label="Cracker selection"><div className="dock-heading"><span>YOUR BOX OF WONDER</span><small>Discover one. Unlock the next.</small></div><div className="firework-tray">{CRACKERS.map((c,i)=><button key={c.id} className={`firework-choice ${selectedCracker===c.id?'selected':''}`} disabled={!unlocked.includes(c.id)} aria-label={`${c.name}${!unlocked.includes(c.id)?' — locked':''}`} aria-pressed={selectedCracker===c.id} onClick={()=>onSelect(c.id)}><span className="choice-number">0{i+1}</span><CrackerArt index={c.id}/><strong>{c.name}</strong><small>{unlocked.includes(c.id)?labels[i]:'Play the previous sparkle'}</small>{!unlocked.includes(c.id)&&<span className="choice-lock" aria-hidden="true">◇</span>}</button>)}</div></nav>
}
