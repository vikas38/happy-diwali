import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore.jsx'
import Diya from './Diya.jsx'
import CrackerArt from './CrackerArt.jsx'
import FestivalSparkles from './FestivalSparkles.jsx'
import { CRACKERS } from '../crackers/crackerDefs.js'

function Icon({ name, size = 22 }) {
  const paths = {
    home: 'M3 10 12 3l9 7v10H3Z M9 20v-7h6v7',
    spark: 'm12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z',
    book: 'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2v16',
    moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
    heart: 'M12 21 3.5 12.5C-2 5 7-1 12 6c5-7 14-1 8.5 6.5Z',
    sound: 'M3 9h4l5-4v14l-5-4H3Z M16 8q5 4 0 8 M19 4q9 8 0 16',
    arrow: 'M4 12h16m-6-6 6 6-6 6',
    shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z m-5 10 3 3 6-6',
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  )
}

function Rangoli({ color = '#dd796d' }) {
  const grainId = React.useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".65"
            numOctaves="2"
            seed="8"
            result="grain"
          />
          <feComposite in="grain" in2="SourceGraphic" operator="in" result="clipped" />
          <feBlend in="SourceGraphic" in2="clipped" mode="soft-light" />
        </filter>
      </defs>
      <g filter={`url(#${grainId})`} transform="translate(120 120)">
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 30})`}>
            <path
              d="M0-13Q-46-64 0-103Q46-64 0-13"
              fill={i % 2 ? '#e9b84e' : color}
              stroke="#fff3d6"
              strokeWidth="3"
            />
            <path d="M0-38Q-17-66 0-86Q17-66 0-38" fill="none" stroke="#fff3d6" strokeWidth="2" />
            <circle cy="-112" r="3" fill={color} />
          </g>
        ))}
        <circle r="30" fill="#698f79" stroke="#fff3d6" strokeWidth="4" />
        <circle r="18" fill="#e9b84e" />
        <circle r="7" fill={color} />
      </g>
    </svg>
  )
}

function FestivalArt() {
  return (
    <svg className="festival-art" viewBox="0 0 620 430" aria-hidden="true">
      <defs>
        <radialGradient id="glow">
          <stop stopColor="#f5ba60" stopOpacity=".3" />
          <stop offset="1" stopColor="#f5ba60" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pot" x2="0" y2="1">
          <stop stopColor="#f1b77e" />
          <stop offset=".4" stopColor="#be7047" />
          <stop offset="1" stopColor="#622c28" />
        </linearGradient>
        <radialGradient id="hero-oil">
          <stop stopColor="#c88a3f" />
          <stop offset=".4" stopColor="#6c432c" />
          <stop offset="1" stopColor="#2e2020" />
        </radialGradient>
        <linearGradient id="lantern-fold">
          <stop stopColor="#884635" />
          <stop offset=".4" stopColor="#ffd598" />
          <stop offset=".65" stopColor="#e4a15e" />
          <stop offset="1" stopColor="#8c4a3c" />
        </linearGradient>
        <linearGradient id="hero-flame" x2="0" y2="1">
          <stop stopColor="#ef9c37" stopOpacity=".6" />
          <stop offset=".6" stopColor="#ffe8a0" />
          <stop offset="1" stopColor="#ffb743" />
        </linearGradient>
      </defs>
      <circle cx="328" cy="236" r="200" fill="url(#glow)" />
      <path d="M-10 21Q300 125 630 20" stroke="#a38162" fill="none" />
      {[40, 115, 190, 265, 340, 415, 490, 565].map((x, i) => (
        <g key={x} transform={`translate(${x} ${41 + Math.sin((i / 7) * Math.PI) * 38})`}>
          <path d="M0 0v20" stroke="#d7a756" />
          <path d="M-12 20h24l7 30-19 15-19-15Z" fill="url(#lantern-fold)" />
          <path d="M-11 31h22M0 21v40M-8 67v13M0 65v20M8 67v13" stroke="#ffd48c" opacity=".8" />
        </g>
      ))}
      {[
        [110, 161],
        [510, 172],
        [465, 268],
        [192, 100],
        [330, 138],
        [80, 275],
        [560, 310],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`} stroke="#e4bb7a" opacity=".8">
          <path d="M-5 0H5M0-5V5" />
          <circle cx="15" cy="15" r="1" />
        </g>
      ))}
      <g fill="#65507c" opacity=".45">
        <path d="M0 350V277h36v-24h35v24h28v73M78 350V295h26v-44q38-55 76 0v44h25v55M470 350V274h21v-32q25-41 50 0v32h25v76M563 350V296h57v54" />
      </g>
      <ellipse cx="328" cy="371" rx="220" ry="33" fill="#231d39" opacity=".45" />
      <g transform="translate(150 18)">
        <path d="M176 258C108 213 179 156 178 101c39 56 72 108-2 157" fill="url(#hero-flame)" />
        <path d="M177 251C142 223 177 195 180 171c24 38 27 63-3 80" fill="#fff1b1" />
        <path d="M38 278Q176 431 314 278Z" fill="url(#pot)" />
        <ellipse cx="176" cy="278" rx="138" ry="32" fill="#f4b87a" />
        <ellipse cx="176" cy="276" rx="118" ry="23" fill="url(#hero-oil)" />
        <path d="M176 277l5-24" stroke="#fff1b1" strokeWidth="7" />
        <path d="M53 297q123 80 246 0" stroke="#ffcd88" strokeWidth="6" fill="none" />
        {[98, 137, 176, 215, 254].map((x, i) => (
          <path
            key={x}
            d={`M${x - 9} ${326 + Math.sin((i / 4) * Math.PI) * 18}l9 9 9-9`}
            fill="none"
            stroke="#ffcf8c"
            strokeWidth="4"
          />
        ))}
      </g>
      <g transform="translate(447 276) scale(.55)">
        <path d="M60 55C20 26 65 6 62-24c30 38 32 58-2 79" fill="#ffc769" />
        <path d="M0 65Q60 135 120 65Z" fill="#d48161" />
        <ellipse cx="60" cy="65" rx="60" ry="13" fill="#ffc785" />
      </g>
      <g fill="#e5a355">
        <ellipse cx="147" cy="377" rx="12" ry="5" transform="rotate(-25 147 377)" />
        <ellipse cx="478" cy="397" rx="13" ry="5" transform="rotate(25 478 397)" />
        <ellipse cx="510" cy="380" rx="9" ry="4" />
      </g>
    </svg>
  )
}

function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.showModal()
    return () => previous?.focus()
  }, [])
  return (
    <dialog
      ref={ref}
      className="festival-modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button className="modal-close" aria-label="Close dialog" onClick={onClose}>
        ×
      </button>
      <h2>{title}</h2>
      {children}
    </dialog>
  )
}

/**
 * For Grown-ups button with press-and-hold (800ms) protection and keyboard path.
 * A single tap will not open it; holding for 800ms fills the ring and opens.
 * Keyboard users can press Enter or Space to open immediately.
 */
function GrownUpsNavButton({ onOpen }) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const startRef = useRef(0)

  const startHold = () => {
    startRef.current = Date.now()
    setHolding(true)
    setProgress(0)

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min(1, elapsed / 800)
      setProgress(pct)
      if (pct >= 1) {
        setHolding(false)
        setProgress(0)
        onOpen()
      } else {
        timerRef.current = requestAnimationFrame(tick)
      }
    }
    timerRef.current = requestAnimationFrame(tick)
  }

  const cancelHold = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
      timerRef.current = null
    }
    setHolding(false)
    setProgress(0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [])

  // Circumference of r=10 circle: 2 * Math.PI * 10 ≈ 62.83
  const circumference = 62.83
  const dashoffset = circumference * (1 - progress)

  return (
    <button
      type="button"
      className={`nav-item grown-ups-btn ${holding ? 'is-holding' : ''}`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.preventDefault()}
      aria-label="For grown-ups (press and hold, or press Enter)"
    >
      <div className="grown-ups-icon-wrap">
        <Icon name="heart" />
        {holding && (
          <svg className="hold-progress-ring" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" className="hold-ring-bg" />
            <circle
              cx="12"
              cy="12"
              r="10"
              className="hold-ring-fill"
              style={{ strokeDasharray: circumference, strokeDashoffset: dashoffset }}
            />
          </svg>
        )}
      </div>
      <span>For grown-ups</span>
      <span className="grown-ups-hold-hint" aria-hidden="true">
        {holding ? 'Hold…' : 'Hold'}
      </span>
      <span className="nav-arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  )
}

export default function FestivalHome({ onPlay, motion, setMotion }) {
  const { state, setMasterVolume } = useGameStore()
  const [modal, setModal] = useState(null)

  const [lit, setLit] = useState([])
  const [color, setColor] = useState('#dd796d')
  const [breath, setBreath] = useState(false)
  useEffect(() => {
    if (modal !== 'calm') return
    setBreath(false)
    const id = setInterval(() => setBreath((v) => !v), 4000)
    return () => clearInterval(id)
  }, [modal])

  const explore = () =>
    document.getElementById('activities')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className={`festival-app ${motion ? '' : 'motion-paused'}`}>
      <a className="skip-link" href="#activities">
        Skip to activities
      </a>
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">✳</span>
          <span>
            little lights<small>A LITTLE WONDER. A LOT OF JOY.</small>
          </span>
        </a>
        <div className="sidebar-label">YOUR FESTIVAL SPACE</div>
        <nav aria-label="Main navigation">
          <button
            className="nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Icon name="home" /> My Diwali <span className="nav-dot" />
          </button>
          <button className="nav-item" onClick={explore}>
            <Icon name="spark" /> Play & discover
          </button>
          <button className="nav-item" onClick={() => setModal('stickers')}>
            <Icon name="book" /> My sticker book{' '}
            <span className="nav-count">{state.stickers.length}</span>
          </button>
          <button className="nav-item" onClick={() => setModal('calm')}>
            <Icon name="moon" /> Calm corner
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="little-note">
            <span>✧</span>
            <h3>Your own kind of bright.</h3>
            <p>
              Big celebrations.
              <br />
              Little steps. Your pace.
            </p>
          </div>
          <GrownUpsNavButton onOpen={() => setModal('parents')} />
          <p className="made-with">Made for little moments of wonder.</p>
        </div>
      </aside>

      <main className="festival-main">
        <header className="festival-topbar">
          <div>
            <span className="season-dot" /> THE FESTIVAL OF LIGHTS
          </div>
          <div className="topbar-actions">
            <button
              className="motion-toggle"
              aria-pressed={motion}
              onClick={() => setMotion((v) => !v)}
            >
              <Icon name="spark" size={16} />
              <span>Motion {motion ? 'on' : 'off'}</span>
            </button>
            <button
              onClick={() => setMasterVolume(state.masterVolume ? 0 : 0.35)}
              aria-label={state.masterVolume ? 'Mute sound' : 'Enable sound'}
            >
              <Icon name="sound" size={18} />
              <span>Sound {state.masterVolume ? 'on' : 'off'}</span>
            </button>
            <span className="star-bank">✧ {state.stars} stars</span>
            <span className="avatar" aria-label="Little explorer">
              V
            </span>
          </div>
        </header>

        <div className="home-content">
          <section className="welcome">
            <div>
              <p className="eyebrow">A LITTLE LIGHT GOES A LONG WAY</p>
              <h1>
                Let your Diwali glow<span> ✦</span>
              </h1>
              <p>A world of wonder, warmth, and tiny brave moments.</p>
            </div>
            <span className="festival-stamp">
              Made of
              <br />
              <strong>little joys</strong>
              <span>✧</span>
            </span>
          </section>

          <section className="festival-hero">
            <FestivalSparkles />
            <div className="hero-copy">
              <span className="hero-tag">
                <span /> YOUR DIWALI ADVENTURE
              </span>
              <h2>
                Small sparks.
                <br />
                Big <em>smiles.</em>
              </h2>
              <p>
                Join Chhotu and Pip for a magical celebration.
                <br className="desktop-break" /> Discover the lights, find your brave, and play
                <br className="desktop-break" /> at your own pace.
              </p>
              <button
                className="sun-button play-dominant-btn"
                onClick={onPlay}
                aria-label="Play Little Lights"
              >
                <span className="play-btn-spark" aria-hidden="true">
                  ✦
                </span>
                <span>Play Little Lights</span>
                <Icon name="arrow" size={24} />
              </button>
              <div className="hero-footnote">
                <Icon name="shield" size={15} /> All the magic. A gentle place to play.
              </div>
            </div>
            <FestivalArt />
            <div className="hero-keepsake">
              <span>✧</span>
              <div>
                A little magic, every day<small>YOUR OWN FESTIVAL OF WONDER</small>
              </div>
            </div>
            <span className="hero-caption">a little spark of happiness ✧</span>
          </section>

          <section id="activities" className="activities">
            <div className="section-heading">
              <div>
                <h2>A little something for every mood</h2>
                <p>Follow your curiosity. There’s no right place to start.</p>
              </div>
              <span>
                EXPLORE & PLAY <span>↙</span>
              </span>
            </div>
            <div className="activity-grid">
              <button
                className="activity-card"
                onClick={() => {
                  setLit([])
                  setModal('diyas')
                }}
              >
                <div className="activity-art diya-art">
                  <span className="activity-tag">SLOW & GLOW</span>
                  <Diya />
                  <span className="art-spark">✧</span>
                </div>
                <div className="activity-copy">
                  <h3>
                    Light a little joy <span>↗</span>
                  </h3>
                  <p>One diya. A whole lot of warmth.</p>
                  <small>
                    LIGHT THE DIYAS <span>·</span> TAKE YOUR TIME
                  </small>
                </div>
              </button>
              <button className="activity-card" onClick={() => setModal('rangoli')}>
                <div className="activity-art rangoli-art">
                  <span className="activity-tag">MAKE IT YOURS</span>
                  <Rangoli />
                </div>
                <div className="activity-copy">
                  <h3>
                    A splash of happy <span>↗</span>
                  </h3>
                  <p>Let your colours tell a little story.</p>
                  <small>
                    RANGOLI STUDIO <span>·</span> CREATE & KEEP
                  </small>
                </div>
              </button>
              <button className="activity-card" onClick={onPlay}>
                <div className="activity-art spark-art">
                  <span className="activity-tag">FIND YOUR BRAVE</span>
                  <CrackerArt index={0} />
                </div>
                <div className="activity-copy">
                  <h3>
                    A sky full of wonder <span>↗</span>
                  </h3>
                  <p>Little sparkles. Big brave moments.</p>
                  <small>
                    SPARKLE PLAY <span>·</span> 6 THINGS TO DISCOVER
                  </small>
                </div>
              </button>
            </div>
          </section>

          <section className="bottom-grid">
            <button className="journey-card" onClick={() => setModal('stickers')}>
              <span className="journey-icon">✧</span>
              <div>
                <h3>Every little step is a bright one</h3>
                <p>Your collection is growing, one discovery at a time.</p>
                <div className="collection-progress">
                  <span style={{ width: `${(state.stickers.length / 6) * 100}%` }} />
                </div>
                <small>{state.stickers.length} of 6 stickers collected</small>
              </div>
              <span className="journey-arrow">→</span>
            </button>
            <button className="calm-card" onClick={() => setModal('calm')}>
              <span className="calm-moon">☾</span>
              <div>
                <h3>A softer kind of sparkle</h3>
                <p>A deep breath. A quiet moment. Just for you.</p>
                <strong>
                  Visit the calm corner <span>→</span>
                </strong>
              </div>
            </button>
          </section>
          <footer className="festival-footer">
            <span>✳ &nbsp; A little light. A little courage. A very happy Diwali.</span>
            <span>PLAY GENTLY. SHINE BRIGHTLY.</span>
          </footer>
        </div>
      </main>

      {modal && (
        <Modal
          title={
            {
              diyas: 'A little light, a little joy',
              rangoli: 'Your colour. Your celebration.',
              stickers: 'Your little book of bright moments',
              calm: 'Let the world slow down.',
              parents: 'Little moments, thoughtfully made.',
            }[modal]
          }
          onClose={() => setModal(null)}
        >
          {modal === 'diyas' && (
            <>
              <p>Tap each diya to fill your little corner with light.</p>
              <div className="diya-row">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    aria-label={`Light diya ${i + 1}`}
                    aria-pressed={lit.includes(i)}
                    onClick={() => setLit((s) => (s.includes(i) ? s : [...s, i]))}
                  >
                    <Diya lit={lit.includes(i)} />
                  </button>
                ))}
              </div>
              <p className="activity-result" aria-live="polite">
                {lit.length === 5
                  ? 'Look at all that warmth. Happy Diwali!'
                  : `${lit.length} of 5 little lights are glowing`}
              </p>
              <button className="sun-button" onClick={() => setLit([])}>
                Start again
              </button>
            </>
          )}
          {modal === 'rangoli' && (
            <>
              <p>Choose a colour, then keep your creation as a little Diwali gift.</p>
              <div className="rangoli-preview">
                <Rangoli color={color} />
              </div>
              <div className="swatches">
                {[
                  ['Rose', '#dd796d'],
                  ['Purple', '#9276b3'],
                  ['Ocean', '#58a7a5'],
                  ['Marigold', '#dc922e'],
                ].map(([name, c]) => (
                  <button
                    key={c}
                    style={{ background: c }}
                    aria-label={name}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <button
                className="sun-button"
                onClick={() => {
                  const svg = document.querySelector('.rangoli-preview svg').cloneNode(true)
                  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
                  svg.setAttribute('width', '800')
                  svg.setAttribute('height', '800')
                  const url = URL.createObjectURL(
                    new Blob([svg.outerHTML], { type: 'image/svg+xml' })
                  )
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'my-diwali-rangoli.svg'
                  a.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
              >
                Keep my rangoli ↓
              </button>
            </>
          )}
          {modal === 'stickers' && (
            <>
              <p>Discover the six sparkles in the adventure to collect your stickers.</p>
              <div className="home-stickers">
                {CRACKERS.map((c) => (
                  <div key={c.id} className={state.stickers.includes(c.id) ? 'collected' : ''}>
                    <span>{state.stickers.includes(c.id) ? c.emoji : '✧'}</span>
                    <strong>{c.name}</strong>
                    <small>
                      {state.stickers.includes(c.id) ? 'Collected' : 'Waiting to be discovered'}
                    </small>
                  </div>
                ))}
              </div>
              <button className="sun-button" onClick={onPlay}>
                Go on an adventure <Icon name="arrow" />
              </button>
            </>
          )}
          {modal === 'calm' && (
            <>
              <p>Get comfortable. Follow the circle, at your own pace.</p>
              <div className={`home-breathing ${breath ? 'exhale' : ''}`}>
                <span>☾</span>
              </div>
              <p className="activity-result" aria-live="polite">
                {breath ? 'Breathe out, softly.' : 'Take a gentle breath in.'}
              </p>
              <button className="sun-button" onClick={() => setModal(null)}>
                I'm ready to return
              </button>
            </>
          )}
          {modal === 'parents' && (
            <>
              <p>
                Little Lights is a playful, virtual Diwali celebration. Children can explore at
                their own pace, start with soft sound, and take a breathing break whenever they
                like.
              </p>
              <div className="parent-note">
                <Icon name="shield" />
                <p>
                  Fireworks here are pretend. Real fireworks need responsible adult supervision and
                  a safe distance. This is a playful experience, not a treatment. For persistent
                  distress, consider speaking with a paediatric professional.
                </p>
              </div>
              <label className="parent-volume">
                Adventure volume{' '}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={state.masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                />
              </label>
              <p className="privacy-note">
                Progress and sound settings stay in this browser. No accounts, analytics, or
                progress uploads. Loading the site sends normal web requests to our hosting
                provider.
              </p>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
