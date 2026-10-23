import React, { useId } from 'react'
export default function Diya({ lit = true, className }) {
  const id = useId().replace(/:/g, '')
  const fill = (name) => `url(#${id}-${name})`
  return (
    <svg className={className} viewBox="0 0 200 170" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-clay`} cx="35%" cy="10%" r="85%">
          <stop stopColor="#edaa71" />
          <stop offset=".45" stopColor="#b65732" />
          <stop offset="1" stopColor="#572922" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x2="0" y2="1">
          <stop stopColor="#f0b982" />
          <stop offset="1" stopColor="#a45a37" />
        </linearGradient>
        <radialGradient id={`${id}-oil`}>
          <stop stopColor={lit ? '#b57b31' : '#65502d'} />
          <stop offset=".4" stopColor="#503321" />
          <stop offset="1" stopColor="#291f1b" />
        </radialGradient>
        <linearGradient id={`${id}-fire`} x1="0" y1="1" x2="0" y2="0">
          <stop stopColor="#ffb52d" />
          <stop offset=".5" stopColor="#ffe597" />
          <stop offset="1" stopColor="#f5922d" stopOpacity=".6" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="#ffd779" stopOpacity=".3" />
          <stop offset="1" stopColor="#ffc456" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit && <ellipse cx="102" cy="77" rx="65" ry="70" fill={fill('light')} />}
      <ellipse cx="100" cy="148" rx="73" ry="8" fill="#201615" opacity=".18" />
      <path d="M21 108Q38 150 100 150Q162 150 179 108Z" fill={fill('clay')} />
      <path
        d="M29 121Q100 163 171 121M42 133Q100 158 158 133"
        stroke="#d88c57"
        strokeWidth="1"
        fill="none"
        opacity=".55"
      />
      <ellipse cx="100" cy="108" rx="79" ry="19" fill={fill('rim')} />
      <ellipse cx="100" cy="108" rx="66" ry="13" fill={fill('oil')} />
      <path
        d="M38 110Q58 119 82 117M119 101Q145 101 157 108"
        stroke="#efc47a"
        opacity=".4"
        fill="none"
        strokeWidth="1.2"
      />
      <path d="M98 110Q105 104 103 96" stroke="#4c3020" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 108 103 99" stroke="#e3c28c" strokeWidth="2" />
      {lit && (
        <g className="diya-flame">
          <path d="M103 101C77 88 100 62 106 32C100 57 130 84 103 101Z" fill={fill('fire')} />
          <path d="M103 100C91 89 103 77 104 65C115 83 114 93 103 100Z" fill="#fff8d4" />
          <ellipse cx="103" cy="99" rx="3" ry="2" fill="#b5b8e6" opacity=".7" />
        </g>
      )}
      <path d="M28 106Q43 94 67 93" stroke="#ffe0aa" opacity=".65" fill="none" strokeWidth="1.4" />
    </svg>
  )
}
