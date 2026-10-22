import React, { useId } from 'react'

// Shared by the selection tray, introduction and home sparkler illustration.
export default function CrackerArt({ index = 0 }) {
  const id = useId().replace(/:/g, '')
  const paint = name => `url(#${id}-${name})`
  const coil = Array.from({ length: 180 }, (_, i) => {
    const a = i * .16, r = 1 + i * .155
    return `${i ? 'L' : 'M'}${50 + Math.cos(a) * r},${61 + Math.sin(a) * r * .57}`
  }).join(' ')
  const fuse = d => <><path d={d} stroke="#493b29" strokeWidth="3" fill="none"/><path d={d} stroke="#d4bc82" strokeWidth="1.6" strokeDasharray="2 1" fill="none"/></>
  return <svg viewBox="0 0 100 100" className="cracker-art" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-paper`}><stop stopColor="#682335"/><stop offset=".25" stopColor="#c94953"/><stop offset=".42" stopColor="#ed8e79"/><stop offset=".6" stopColor="#c54348"/><stop offset="1" stopColor="#702332"/></linearGradient>
      <linearGradient id={`${id}-gold`}><stop stopColor="#805020"/><stop offset=".3" stopColor="#edbc68"/><stop offset=".47" stopColor="#ffe7a4"/><stop offset=".7" stopColor="#c28a3c"/><stop offset="1" stopColor="#745026"/></linearGradient>
      <radialGradient id={`${id}-jute`} cx="35%" cy="25%"><stop stopColor="#cbbb88"/><stop offset=".6" stopColor="#8f8050"/><stop offset="1" stopColor="#443f2b"/></radialGradient>
      <linearGradient id={`${id}-metal`}><stop stopColor="#4f555b"/><stop offset=".45" stopColor="#e2dfcf"/><stop offset=".65" stopColor="#858d90"/><stop offset="1" stopColor="#353b40"/></linearGradient>
      <radialGradient id={`${id}-glow`}><stop stopColor="#fff8d7" stopOpacity=".65"/><stop offset=".15" stopColor="#ffcf69" stopOpacity=".28"/><stop offset="1" stopColor="#ffad38" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="51" cy="90" rx="29" ry="4" fill="#000" opacity=".22"/><ellipse cx="51" cy="89" rx="18" ry="2" fill="#000" opacity=".2"/>
    {index === 0 && <>
      <path d="M35 88 60 24" stroke={paint('metal')} strokeWidth="2.4"/>
      <path d="M46 59 60 24" stroke="#333a3e" strokeWidth="5" strokeLinecap="round"/>
      <path d="M45 57 58 25" stroke="#9b9b8b" strokeWidth="2" strokeLinecap="round"/>
      {Array.from({length:17},(_,i)=><path key={i} d={`M${47+i*.7} ${56-i*1.8}l2 1`} stroke={i%2?'#555c58':'#c2bba0'} strokeWidth=".65"/>)}
      <circle cx="60" cy="24" r="23" fill={paint('glow')}/>
      <g className="cracker-glitter">{Array.from({length:21},(_,i)=>{const a=i*2.399,r=10+i%5*3,x=60+Math.cos(a)*r,y=24+Math.sin(a)*r;return <path key={i} className="cracker-twinkle" style={{animationDelay:`${-i*.23}s`}} d={`M${60+Math.cos(a)*5} ${24+Math.sin(a)*5}Q${x} ${y-2} ${x+Math.cos(a)*4} ${y+3}`} fill="none" stroke={i%3?'#ffc164':'#fff8dd'} strokeWidth={i%3?.6:1.1}/>})}</g><circle cx="60" cy="24" r="2" fill="#fffce7"/>
    </>}
    {index === 1 && <>
      {fuse('M50 29Q43 19 53 13')}
      <path d="M45 30Q50 27 55 30L78 82Q51 96 23 82Z" fill={paint('gold')}/>
      <path d="M36 52Q50 56 64 52L73 73Q50 84 27 73Z" fill={paint('paper')}/>
      <path d="M36 52Q50 57 64 52M27 73Q50 84 73 73" stroke="#f5d28a" strokeWidth="1.2" fill="none"/>
      <ellipse cx="50" cy="30" rx="5" ry="2" fill="#493321"/><ellipse cx="50" cy="65" rx="7" ry="8" fill={paint('gold')}/><path d="m50 59 2 4 4 1-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-1Z" fill="#8d4033"/>
      <path d="M44 34 27 81M57 35 74 80" stroke="#fff0b5" opacity=".22" fill="none"/><path d="M24 83Q50 96 77 83" stroke="#614127" strokeWidth="2" fill="none"/>
    </>}
    {index === 2 && <>
      <ellipse cx="50" cy="66" rx="31" ry="19" fill="#69442e"/><ellipse cx="50" cy="61" rx="31" ry="18" fill={paint('gold')}/>
      <path d={coil} fill="none" stroke="#61472c" strokeWidth="3.4"/><path d={coil} fill="none" stroke="#d1ac70" strokeWidth="1.9"/><path d={coil} fill="none" stroke="#f7dba2" strokeWidth=".5" transform="translate(0 -.7)"/>
      <circle cx="50" cy="61" r="2.3" fill="#473b2c"/>{fuse('M77 56Q91 53 86 42')}
    </>}
    {index === 3 && <g transform="rotate(16 50 50)">
      <path d="M52 50V93" stroke="#5c3c25" strokeWidth="3"/><path d="M51 50V93" stroke="#d7b783" strokeWidth="1.2"/>
      <path d="M39 27H61V65Q50 70 39 65Z" fill={paint('paper')}/><ellipse cx="50" cy="65" rx="11" ry="3" fill="#6c3730"/>
      <path d="M34 28 50 5 66 28Q50 34 34 28" fill={paint('gold')}/><path d="M50 7 41 27" stroke="#fff2cb" strokeWidth="1" opacity=".6"/>
      <path d="M39 38Q50 42 61 38M39 55Q50 59 61 55" stroke={paint('gold')} strokeWidth="4" fill="none"/><path d="M43 32V62" stroke="#ffcfb0" strokeWidth=".7" opacity=".45"/>
      <path d="m47 45 3-4 3 4-3 5Z" fill="#ffdb8c"/>{fuse('M47 67Q35 72 40 79')}
    </g>}
    {index === 4 && <>
      {fuse('M27 18Q77 19 77 49Q77 77 25 77')}
      {[0,1,2,3,4,5,6,7].map(i=><g key={i} transform={`translate(${28+(i%4)*14} ${i<4?35:66}) rotate(${i%2?10:-10})`}>
        <rect x="-5" y="-13" width="10" height="26" rx="2" fill={paint('paper')}/><ellipse cy="-12" rx="5" ry="1.7" fill="#dba276"/><ellipse cy="12" rx="4.8" ry="1.6" fill="#652d2d"/>
        <path d="M-5-7H5M-5 7H5" stroke={paint('gold')} strokeWidth="2.3"/><path d="M-2-10V10" stroke="#ffc4a3" strokeWidth=".6" opacity=".5"/>
      </g>)}
    </>}
    {index === 5 && <>
      {fuse('M51 35Q40 20 55 12')}
      <path d="M30 40Q50 29 69 41L78 66Q73 85 51 88Q28 86 22 68Z" fill={paint('jute')}/>
      {Array.from({length:13},(_,i)=><path key={i} d={`M${30-i*.45} ${41+i*3}Q50 ${53+i*2.6} ${69+i*.55} ${42+i*3}`} fill="none" stroke={i%2?'#524a31':'#ddc48b'} strokeWidth={i%2?1.7:1.1} opacity=".85"/>)}
      {Array.from({length:8},(_,i)=><path key={i} d={`M${32+i*4.5} 39Q${15+i*7} 65 ${34+i*4.7} 83`} fill="none" stroke="#bba16c" strokeWidth="1.4"/>)}
      <path d="M36 43Q50 34 63 42" stroke="#e1c992" strokeWidth="1.4" fill="none"/>
    </>}
  </svg>
}
