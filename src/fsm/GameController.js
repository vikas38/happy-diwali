// ===================================================================
// GameController — Central Finite State Machine
// ===================================================================
// Manages the game's state flow and orchestrates characters, particles,
// audio, and UI via an observer pattern.
//
// States:
//   SAFETY_SPLASH → IDLE → CRACKER_INTRO_CARD → READY_ON_STREET
//   → STEPPING_BACK_SAFE_ROUTINE → COUNTDOWN_3_2_1
//   → CRACKER_SHOW_ACTIVE → REWARD_CELEBRATION
//   (CALM_CORNER_OVERLAY is a global interrupt from any state)
// ===================================================================

import { ARM_STATES } from '../render/characters/ChhotuChamp.js'
import { PIP_MOODS } from '../render/characters/Pip.js'
import { LAYOUT, getLaunchPoint, getSafeZonePoint } from '../render/layers/Background.js'
import { characterStart } from '../render/layers/Courtyard.js'
import { playFireworkSound } from '../audio/FireworkSound.js'
import { getCracker } from '../crackers/crackerDefs.js'

export const STATES = {
  SAFETY_SPLASH: 'SAFETY_SPLASH',
  IDLE: 'IDLE',
  CRACKER_INTRO_CARD: 'CRACKER_INTRO_CARD',
  READY_ON_STREET: 'READY_ON_STREET',
  STEPPING_BACK_SAFE_ROUTINE: 'STEPPING_BACK_SAFE_ROUTINE',
  COUNTDOWN_3_2_1: 'COUNTDOWN_3_2_1',
  CRACKER_SHOW_ACTIVE: 'CRACKER_SHOW_ACTIVE',
  REWARD_CELEBRATION: 'REWARD_CELEBRATION',
  CALM_CORNER_OVERLAY: 'CALM_CORNER_OVERLAY',
}

// Legal forward transitions (calm corner is allowed from any state)
const TRANSITIONS = {
  [STATES.SAFETY_SPLASH]: [STATES.IDLE],
  [STATES.IDLE]: [STATES.CRACKER_INTRO_CARD, STATES.READY_ON_STREET],
  [STATES.CRACKER_INTRO_CARD]: [STATES.READY_ON_STREET],
  [STATES.READY_ON_STREET]: [
    STATES.STEPPING_BACK_SAFE_ROUTINE,
    STATES.CRACKER_INTRO_CARD,
    STATES.READY_ON_STREET,
    STATES.IDLE,
  ],
  [STATES.STEPPING_BACK_SAFE_ROUTINE]: [STATES.COUNTDOWN_3_2_1],
  [STATES.COUNTDOWN_3_2_1]: [STATES.CRACKER_SHOW_ACTIVE],
  [STATES.CRACKER_SHOW_ACTIVE]: [STATES.REWARD_CELEBRATION],
  [STATES.REWARD_CELEBRATION]: [STATES.READY_ON_STREET, STATES.CRACKER_INTRO_CARD, STATES.IDLE],
  [STATES.CALM_CORNER_OVERLAY]: [],
}

const COUNTDOWN_BEATS = [3, 2, 1, 'GLOW!']
const COUNTDOWN_INTERVAL = 800 // ms per beat
const WALK_DURATION = 1.2 // seconds

export class GameController {
  constructor(initialState = STATES.SAFETY_SPLASH) {
    this.state = initialState
    this.selectedCracker = null
    this._prevState = null // state before calm corner
    this._prevSelectedCracker = null
    this._timers = []
    this._listeners = new Set()
    this._uiData = {}
    this._engines = null
    this._crackerShowFn = null
    this._cancelShow = null
    this._stopFuse = null
    this._paused = false
    this._currentCountdownBeat = 0
    this._prevCountdownBeat = 0
    this._activeShowToken = null
    this._showCompleted = false
  }

  // -----------------------------------------------------------------
  // Observer / subscription
  // -----------------------------------------------------------------

  subscribe(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  _notify() {
    const snapshot = this.getSnapshot()
    this._listeners.forEach((fn) => fn(snapshot))
  }

  getSnapshot() {
    return {
      state: this.state,
      selectedCracker: this.selectedCracker,
      uiData: { ...this._uiData },
    }
  }

  // -----------------------------------------------------------------
  // Engine wiring
  // -----------------------------------------------------------------

  /**
   * Initialize with all engine references.
   * @param {object} engines - { sound, store, chhotu, pip, particles, comicBubble, jellySquash, renderer, layout }
   */
  init(engines) {
    this._disposed = false
    this._engines = engines
    // Apply current audio settings from the store
    this._applyAudioSettings()
    this._notify()
  }

  /**
   * Set the cracker show function (provided by crackerControllers.js).
   * @param {Function} fn - (crackerIndex, engines, onDone) => void
   */
  setCrackerShowFn(fn) {
    this._crackerShowFn = fn
  }

  _applyAudioSettings() {
    const { sound, store } = this._engines || {}
    if (!sound || !store) return
    const saveState = store.getState ? store.getState() : store.state
    sound.setIntensity(saveState.intensity)
    sound.setMasterVolume(saveState.masterVolume)
  }

  // -----------------------------------------------------------------
  // Store query helpers — evaluate dynamically against the store
  // -----------------------------------------------------------------

  _getStore() {
    return this._engines?.store
  }

  _isUnlocked(index) {
    const store = this._getStore()
    if (!store) return false
    if (typeof store.isUnlocked === 'function') return store.isUnlocked(index)
    const st = store.getState ? store.getState() : store.state
    return Boolean(st?.unlocked?.includes(index))
  }

  _hasSticker(index) {
    const store = this._getStore()
    if (!store) return false
    if (typeof store.hasSticker === 'function') return store.hasSticker(index)
    const st = store.getState ? store.getState() : store.state
    return Boolean(st?.stickers?.includes(index))
  }

  _hasSeenIntro(index) {
    const store = this._getStore()
    if (!store) return false
    if (typeof store.hasSeenIntro === 'function') return store.hasSeenIntro(index)
    const st = store.getState ? store.getState() : store.state
    return Boolean(st?.seenIntros?.includes(index))
  }

  // -----------------------------------------------------------------
  // State transition (with guard)
  // -----------------------------------------------------------------

  _canTransition(from, to) {
    if (to === STATES.CALM_CORNER_OVERLAY) return true
    if (from === STATES.CALM_CORNER_OVERLAY) return true // resume
    const allowed = TRANSITIONS[from] || []
    return allowed.includes(to)
  }

  _setState(newState, uiData = {}) {
    if (newState !== STATES.CALM_CORNER_OVERLAY && !this._canTransition(this.state, newState)) {
      console.warn(`Illegal transition: ${this.state} → ${newState}`)
      return false
    }
    this.state = newState
    this._uiData = uiData
    if (this._engines?.background) {
      this._engines.background.setGameState(newState, this.selectedCracker)
    }
    this._notify()
    return true
  }

  // -----------------------------------------------------------------
  // Timer management (for calm corner pause/resume)
  // -----------------------------------------------------------------

  _addTimer(fn, delay) {
    const id = setTimeout(fn, delay)
    this._timers.push(id)
    return id
  }

  _clearTimers() {
    this._timers.forEach((id) => clearTimeout(id))
    this._timers = []
  }

  // -----------------------------------------------------------------
  // Position helpers
  // -----------------------------------------------------------------

  _dims() {
    return { w: this._engines.renderer.width, h: this._engines.renderer.height }
  }

  _launchPoint() {
    const { w, h } = this._dims()
    return getLaunchPoint(w, h)
  }

  _safeZonePoint() {
    const { w, h } = this._dims()
    return getSafeZonePoint(w, h)
  }

  _chhotuStartPoint() {
    const { w, h } = this._dims()
    return characterStart(w, h)
  }

  _pipStartPoint() {
    const { w, h } = this._dims()
    return { x: w * LAYOUT.pipStartX, y: h * LAYOUT.pipStartY }
  }

  // -----------------------------------------------------------------
  // Flow actions
  // -----------------------------------------------------------------

  /**
   * Called when the user taps "I Promise!" on the safety splash.
   * Initializes audio and transitions to IDLE.
   */
  startGame() {
    const { sound } = this._engines
    try {
      sound.init()
    } catch {
      this._setState(STATES.IDLE)
      return
    }
    sound
      .resume()
      .then(() => {
        if (this._disposed || this.state === STATES.CALM_CORNER_OVERLAY) return
        this._applyAudioSettings()
        sound.startMusic()
      })
      .catch(() => {})
    this._setState(STATES.IDLE)
  }

  /**
   * Select a cracker from the carousel.
   * If the intro hasn't been seen, show the intro card. Otherwise, go to ready.
   */
  selectCracker(index) {
    if (!this._isUnlocked(index)) return
    this.selectedCracker = index

    if (this._engines?.background) {
      this._engines.background.setGameState(this.state, index)
    }

    const cracker = getCracker(index)
    if (!this._hasSeenIntro(index)) {
      this._setState(STATES.CRACKER_INTRO_CARD, { cracker })
    } else {
      this._gotoReady(index)
    }
  }

  /**
   * Called from the intro card's "Put on Street" button.
   */
  putOnStreet() {
    if (this.state !== STATES.CRACKER_INTRO_CARD) return
    const store = this._getStore()
    store?.markIntroSeen?.(this.selectedCracker)
    this._gotoReady(this.selectedCracker)
  }

  _gotoReady(index) {
    this.selectedCracker = index
    const { chhotu, pip } = this._engines
    // Place characters at start positions (near cracker)
    const chhotuPos = this._chhotuStartPoint()
    const pipPos = this._pipStartPoint()
    chhotu.setPosition(chhotuPos.x, chhotuPos.y)
    chhotu.setFacing(1) // face left toward cracker
    chhotu.setArmState(ARM_STATES.IDLE_WAVE)
    pip.setPosition(pipPos.x, pipPos.y)
    pip.setMood(PIP_MOODS.IDLE)
    this._setState(STATES.READY_ON_STREET, { cracker: getCracker(index) })
  }

  /**
   * Called when the user taps the cracker on the street.
   * Starts the step-back-to-safe-zone routine.
   */
  tapCracker() {
    if (this.state !== STATES.READY_ON_STREET) return
    this._startStepBack()
  }

  _startStepBack() {
    const { chhotu, pip, sound } = this._engines
    const from = this._chhotuStartPoint()
    const to = this._safeZonePoint()

    // The child moves away before the adult handles the pretend fuse.
    chhotu.setFacing(1)
    chhotu.setArmState(ARM_STATES.COVER_EARS_SMILE)

    // Set state BEFORE starting the walk so the callback (which fires
    // synchronously in tests) can legally transition to COUNTDOWN.
    this._setState(STATES.STEPPING_BACK_SAFE_ROUTINE)

    // Walk to the watching spot while the fuse remains unlit.
    chhotu.setFacing(1)
    chhotu._walkDelay = 0
    chhotu.walkTo(from.x, from.y, to.x, to.y, WALK_DURATION, () => {
      // Once safely at the safe zone, cover ears and start countdown
      chhotu.setArmState(ARM_STATES.COVER_EARS_SMILE)
      pip.setMood(PIP_MOODS.HIDE)
      pip.setPosition(Math.max(28, to.x - 55), to.y + 12)
      this._startCountdown()
    })

    // Pip follows along
    pip.setMood(PIP_MOODS.IDLE)
  }

  skipWalk() {
    if (this.state !== STATES.STEPPING_BACK_SAFE_ROUTINE) return
    const { chhotu, pip } = this._engines
    if (chhotu) {
      chhotu.walkActive = false
      const to = this._safeZonePoint()
      chhotu.setPosition(to.x, to.y)
      chhotu.setArmState(ARM_STATES.COVER_EARS_SMILE)
    }
    if (pip) {
      const to = this._safeZonePoint()
      pip.setMood(PIP_MOODS.HIDE)
      pip.setPosition(Math.max(28, to.x - 55), to.y + 12)
    }
    this._clearTimers()
    this._startCountdown(0)
  }

  _startCountdown(fromBeat = 0) {
    const { sound } = this._engines
    if (sound?.supported && fromBeat === 0) {
      this._stopFuse = playFireworkSound(sound, 'fuse', 3.2)
    }
    this._currentCountdownBeat = fromBeat
    this._setState(STATES.COUNTDOWN_3_2_1, { countdownNumber: COUNTDOWN_BEATS[fromBeat] })
    this._playCountdownChime(fromBeat)

    for (let i = fromBeat + 1; i < COUNTDOWN_BEATS.length; i++) {
      const delay = (i - fromBeat) * COUNTDOWN_INTERVAL
      this._addTimer(() => {
        this._currentCountdownBeat = i
        this._uiData = { countdownNumber: COUNTDOWN_BEATS[i] }
        this._playCountdownChime(i)
        this._notify()
      }, delay)
    }

    // After the last beat + its display time, start the cracker show
    const totalDelay = (COUNTDOWN_BEATS.length - fromBeat) * COUNTDOWN_INTERVAL
    this._addTimer(() => {
      this._startCrackerShow()
    }, totalDelay)
  }

  _playCountdownChime(beatIndex) {
    const { sound } = this._engines
    if (!sound.supported) return
    // Descending pitches: C5, A4, G4, then a bright chime for GLOW
    const pitches = [523.25, 440.0, 392.0, 659.25]
    const freq = pitches[beatIndex] || 523.25
    sound.playTestTone(freq, 0.3)
  }

  _startCrackerShow() {
    this._stopFuse?.()
    this._stopFuse = null
    this._engines?.sound?.stopMusic?.()
    this._setState(STATES.CRACKER_SHOW_ACTIVE, { cracker: getCracker(this.selectedCracker) })

    const { chhotu, pip } = this._engines || {}

    // Pip reacts with happy jumps
    pip?.setMood?.(PIP_MOODS.HAPPY)
    pip?.jump?.(0.5)

    // Token for this specific show run to prevent stale, interrupted, or duplicate completion
    const runToken = Symbol('cracker-show-run')
    this._activeShowToken = runToken
    this._showCompleted = false

    const onDone = () => {
      this._cancelShow = null
      if (
        !this._disposed &&
        this.state === STATES.CRACKER_SHOW_ACTIVE &&
        this._activeShowToken === runToken &&
        !this._showCompleted
      ) {
        this._showCompleted = true
        this._activeShowToken = null
        this._onCrackerShowComplete()
      }
    }

    // Run the cracker show function
    if (this._crackerShowFn) {
      this._cancelShow = this._crackerShowFn(this.selectedCracker, this._engines, onDone)
    } else {
      // No show function registered — complete immediately
      onDone()
    }
  }

  _onCrackerShowComplete() {
    const { chhotu, pip, sound } = this._engines || {}
    sound?.startMusic?.()
    // Victory celebration from characters
    chhotu?.setArmState?.(ARM_STATES.VICTORY_JUMP)
    chhotu?.jump?.(0.7)
    pip?.setMood?.(PIP_MOODS.HAPPY)
    pip?.jump?.(0.5)

    const store = this._getStore()
    const crackerIndex = this.selectedCracker

    let awardResult
    if (typeof store?.awardShowCompletion === 'function') {
      awardResult = store.awardShowCompletion(crackerIndex)
    } else {
      const isNewSticker = !this._hasSticker(crackerIndex)
      const starsEarned = isNewSticker ? 3 : 1
      if (isNewSticker) {
        store?.collectSticker?.(crackerIndex)
      } else {
        store?.addStars?.(1)
      }
      const nextIndex = crackerIndex + 1
      if (nextIndex < 6 && !this._isUnlocked(nextIndex)) {
        store?.unlockCracker?.(nextIndex)
      }
      awardResult = { isNewSticker, starsEarned }
    }

    // Play fanfare (ascending arpeggio)
    this._playFanfare()

    this._setState(STATES.REWARD_CELEBRATION, {
      cracker: getCracker(crackerIndex),
      isNewSticker: awardResult.isNewSticker,
      starsEarned: awardResult.starsEarned,
    })
  }

  _playFanfare() {
    const { sound } = this._engines
    if (!sound.supported) return
    // Simple ascending arpeggio fanfare
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      this._addTimer(() => sound.playTestTone(freq, 0.4), i * 120)
    })
  }

  /**
   * From reward: light the same cracker again.
   */
  lightAgain() {
    if (this.state !== STATES.REWARD_CELEBRATION) return
    // Reset characters to start positions
    this._gotoReady(this.selectedCracker)
  }

  /**
   * From reward: go to the next cracker.
   */
  nextCracker() {
    if (this.state !== STATES.REWARD_CELEBRATION) return
    const nextIndex = this.selectedCracker + 1
    if (nextIndex >= 6) {
      // All crackers done — go to idle
      this._setState(STATES.IDLE)
      return
    }
    this.selectedCracker = nextIndex
    const cracker = getCracker(nextIndex)
    if (!this._hasSeenIntro(nextIndex)) {
      this._setState(STATES.CRACKER_INTRO_CARD, { cracker })
    } else {
      this._gotoReady(nextIndex)
    }
  }

  /**
   * Go back to the carousel (e.g., from reward or after closing sticker book).
   */
  goToIdle() {
    const { chhotu, pip } = this._engines
    const chhotuPos = this._chhotuStartPoint()
    const pipPos = this._pipStartPoint()
    chhotu.setPosition(chhotuPos.x, chhotuPos.y)
    chhotu.setFacing(1)
    chhotu.setArmState(ARM_STATES.IDLE_WAVE)
    pip.setPosition(pipPos.x, pipPos.y)
    pip.setMood(PIP_MOODS.IDLE)
    this.selectedCracker = null
    this._setState(STATES.IDLE)
  }

  // -----------------------------------------------------------------
  // Calm Corner (global interrupt)
  // -----------------------------------------------------------------

  enterCalmCorner() {
    if (this.state === STATES.CALM_CORNER_OVERLAY) return
    if (this.state === STATES.SAFETY_SPLASH) return // don't interrupt the safety splash

    this._activeShowToken = null
    this._prevState = this.state
    this._prevSelectedCracker = this.selectedCracker
    this._prevCountdownBeat = this._currentCountdownBeat ?? 0

    this._cancelShow?.()
    this._cancelShow = null
    this._stopFuse?.()
    this._stopFuse = null

    // Pause all timers
    this._clearTimers()

    // Stop cracker audio (fade out 150ms) and particles
    if (this._engines) {
      const { sound, particles, chhotu, pip } = this._engines
      sound?.fadeCrackerAudio?.(150)
      sound?.stopCrackerAudio?.()
      particles?.clear?.()
      sound?.stopMusic?.()
      sound?.startCalmPad?.()

      // Stop character walks
      if (chhotu) {
        chhotu.walkActive = false
        chhotu.jumpActive = false
      }
      if (pip) {
        pip._jumpActive = false
      }
    }

    this._paused = true
    this._setState(STATES.CALM_CORNER_OVERLAY)
  }

  exitCalmCorner() {
    if (this.state !== STATES.CALM_CORNER_OVERLAY) return

    if (this._engines?.sound) {
      this._engines.sound.stopCalmPad?.()
      this._engines.sound.startMusic?.()
      this._applyAudioSettings()
    }

    this._paused = false
    const prev = this._prevState
    this._prevState = null

    // Resume the previous state's sequence
    switch (prev) {
      case STATES.STEPPING_BACK_SAFE_ROUTINE:
        this._startStepBack()
        break
      case STATES.COUNTDOWN_3_2_1:
        this._startCountdown(this._prevCountdownBeat ?? 0)
        break
      case STATES.CRACKER_SHOW_ACTIVE:
        // Restart the cracker show from the beginning
        this._startCountdown()
        break
      case STATES.READY_ON_STREET:
        this._gotoReady(this.selectedCracker)
        break
      case STATES.REWARD_CELEBRATION:
        this._setState(STATES.REWARD_CELEBRATION, {
          cracker: getCracker(this.selectedCracker),
        })
        break
      default:
        this._setState(prev || STATES.IDLE)
    }
  }

  // -----------------------------------------------------------------
  // Intensity & volume live updates
  // -----------------------------------------------------------------

  setIntensity(intensity) {
    const { sound, store } = this._engines
    store.setIntensity(intensity)
    sound.setIntensity(intensity)
  }

  setMasterVolume(vol) {
    const { sound, store } = this._engines
    store.setMasterVolume(vol)
    sound.setMasterVolume(vol)
  }

  // -----------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------

  dispose() {
    this._disposed = true
    this._activeShowToken = null
    this._cancelShow?.()
    this._cancelShow = null
    this._stopFuse?.()
    this._stopFuse = null
    this._engines?.sound.stopMusic()
    this._engines?.sound.stopCrackerAudio()
    this._clearTimers()
    this._listeners.clear()
  }
}
