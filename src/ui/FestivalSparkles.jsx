import React from 'react'

// Deterministic positions avoid a new sky on every interaction.
export default function FestivalSparkles() {
  return (
    <div className="festival-sparkles" aria-hidden="true">
      <div className="sky-orbit sky-orbit-one" />
      <div className="sky-orbit sky-orbit-two" />
      {Array.from({ length: 32 }, (_, i) => (
        <span
          key={i}
          className={i % 4 === 0 ? 'sky-spark' : 'sky-ember'}
          style={{
            left: `${12 + ((i * 37) % 86)}%`,
            top: `${8 + ((i * 23) % 84)}%`,
            '--delay': `${-(i * 0.71)}s`,
            '--duration': `${5 + (i % 5)}s`,
            '--size': `${i % 4 === 0 ? 13 : 2 + (i % 3)}px`,
          }}
        >
          {i % 4 === 0 ? '✦' : ''}
        </span>
      ))}
    </div>
  )
}
