import React from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import { STATES } from '../fsm/GameController.js'

export function getStepFromState(fsmState) {
  switch (fsmState) {
    case STATES.IDLE:
      return 1
    case STATES.CRACKER_INTRO_CARD:
      return 2
    case STATES.READY_ON_STREET:
      return 3
    case STATES.STEPPING_BACK_SAFE_ROUTINE:
    case STATES.COUNTDOWN_3_2_1:
      return 4
    case STATES.CRACKER_SHOW_ACTIVE:
    case STATES.REWARD_CELEBRATION:
      return 5
    default:
      return 1
  }
}

export function StepIndicator({ step = 1, totalSteps = 5 }) {
  const stepLabels = [
    'Select sparkle',
    'Place on street',
    'Grown-up lights fuse',
    'Step back & count',
    'Celebrate',
  ]
  return (
    <div className="flow-step-tracker" role="region" aria-label="Celebration steps">
      <span className="sr-only" aria-live="polite">
        Step {step} of {totalSteps}: {stepLabels[step - 1]}
      </span>
      <div className="flow-step-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`flow-step-dot ${i === step ? 'is-current' : i < step ? 'is-done' : ''}`}
          />
        ))}
      </div>
      <span className="flow-step-text" aria-hidden="true">
        Step {step} of {totalSteps}
      </span>
    </div>
  )
}

/**
 * ContextualActionButton — single visually dominant action whose
 * label, icon, and interactivity follow the FSM state.
 */
export default function ContextualAction({
  fsmState,
  selectedCracker = 0,
  countdownNumber,
  canSkipWalk = false,
  onPlaceOnStreet,
  onLightFuse,
  onSkipWalk,
  onNextCracker,
  onLightAgain,
  isLastCracker = false,
  hasDock = true,
}) {
  const cracker = CRACKERS[selectedCracker] || CRACKERS[0]
  const step = getStepFromState(fsmState)

  return (
    <div
      className={`contextual-action-bar ${hasDock ? 'has-dock' : ''}`}
      role="region"
      aria-label="Next action"
    >
      <StepIndicator step={step} />

      <div className="action-button-group">
        {fsmState === STATES.IDLE && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn"
            onClick={onPlaceOnStreet}
            aria-label={`Place ${cracker.name} on street`}
          >
            <span aria-hidden="true">✦</span>
            <span>Place {cracker.name} on street</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {fsmState === STATES.CRACKER_INTRO_CARD && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn"
            onClick={onPlaceOnStreet}
            aria-label={`Place ${cracker.name} on street`}
          >
            <span aria-hidden="true">✦</span>
            <span>Place on street</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {fsmState === STATES.READY_ON_STREET && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn btn--bounce"
            onClick={onLightFuse}
            aria-label="Ask a grown-up to light the fuse"
          >
            <span aria-hidden="true">✦</span>
            <span>Ask a grown-up to light fuse</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {fsmState === STATES.STEPPING_BACK_SAFE_ROUTINE && (
          <div className="stepping-back-action-wrap">
            <button
              type="button"
              className="btn btn--primary contextual-primary-btn is-in-progress"
              disabled
              aria-label="Stepping back safely to watching spot"
            >
              <span className="spinner-sparkle" aria-hidden="true">
                ✧
              </span>
              <span>Walking to safe spot…</span>
            </button>
            {canSkipWalk && (
              <button
                type="button"
                className="walk-skip-btn"
                onClick={onSkipWalk}
                aria-label="Skip walking to safe spot"
              >
                Skip walk →
              </button>
            )}
          </div>
        )}

        {fsmState === STATES.COUNTDOWN_3_2_1 && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn is-in-progress"
            disabled
            aria-label={`Counting down: ${countdownNumber}`}
          >
            <span className="spinner-sparkle" aria-hidden="true">
              ✧
            </span>
            <span>Get ready… {countdownNumber}</span>
          </button>
        )}

        {fsmState === STATES.CRACKER_SHOW_ACTIVE && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn is-in-progress"
            disabled
            aria-label="Watching the sparkle celebration"
          >
            <span aria-hidden="true">✨</span>
            <span>Enjoy the lights…</span>
          </button>
        )}

        {fsmState === STATES.REWARD_CELEBRATION && (
          <div className="reward-action-dual">
            <button
              type="button"
              className="btn btn--secondary contextual-secondary-btn"
              onClick={onLightAgain}
              aria-label="Light this firework again"
            >
              Light Again
            </button>
            <button
              type="button"
              className="btn btn--primary contextual-primary-btn"
              onClick={isLastCracker ? onLightAgain : onNextCracker}
              aria-label={isLastCracker ? 'Light this firework again' : 'Proceed to next firework'}
            >
              <span>{isLastCracker ? 'Celebrate Again ✦' : 'Next Sparkle →'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
