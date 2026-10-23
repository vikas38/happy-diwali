import React from 'react'
import { CRACKERS } from '../crackers/crackerDefs.js'
import { STATES } from '../fsm/GameController.js'
import { t } from '../i18n/index.js'

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
    t('step_1_label'),
    t('step_2_label'),
    t('step_3_label'),
    t('step_4_label'),
    t('step_5_label'),
  ]
  return (
    <div className="flow-step-tracker" role="region" aria-label={t('steps_region')}>
      <span className="sr-only" aria-live="polite">
        {t('step_announcement', { step, total: totalSteps, label: stepLabels[step - 1] })}
      </span>
      <div className="flow-step-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`flow-step-dot ${i === step ? 'is-current' : i < step ? 'is-done' : ''}`}
          >
            {i < step ? '✦' : ''}
          </span>
        ))}
      </div>
      <span className="flow-step-text" aria-hidden="true">
        {t('step_display', { step, total: totalSteps })}
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
      aria-label={t('next_action_region')}
    >
      <StepIndicator step={step} />

      <div className="action-button-group">
        {fsmState === STATES.IDLE && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn"
            onClick={onPlaceOnStreet}
            aria-label={t('place_cracker_on_street', { name: cracker.name })}
          >
            <span aria-hidden="true">✦</span>
            <span>{t('place_cracker_on_street', { name: cracker.name })}</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {fsmState === STATES.CRACKER_INTRO_CARD && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn"
            onClick={onPlaceOnStreet}
            aria-label={t('place_cracker_on_street', { name: cracker.name })}
          >
            <span aria-hidden="true">✦</span>
            <span>{t('place_on_street')}</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {fsmState === STATES.READY_ON_STREET && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn btn--bounce"
            onClick={onLightFuse}
            aria-label={t('ask_grownup_light_fuse_aria')}
          >
            <span aria-hidden="true">✦</span>
            <span>{t('ask_grownup_light_fuse')}</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {fsmState === STATES.STEPPING_BACK_SAFE_ROUTINE && (
          <div className="stepping-back-action-wrap">
            <button
              type="button"
              className="btn btn--primary contextual-primary-btn is-in-progress"
              disabled
              aria-label={t('stepping_back_aria')}
            >
              <span className="spinner-sparkle" aria-hidden="true">
                ✧
              </span>
              <span>{t('moving_to_safe_spot')}</span>
            </button>
            {canSkipWalk && (
              <button
                type="button"
                className="walk-skip-btn"
                onClick={onSkipWalk}
                aria-label={t('skip_walk_aria')}
              >
                {t('skip_walk_btn')}
              </button>
            )}
          </div>
        )}

        {fsmState === STATES.COUNTDOWN_3_2_1 && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn is-in-progress"
            disabled
            aria-label={t('countdown_action_aria', { number: countdownNumber })}
          >
            <span className="spinner-sparkle" aria-hidden="true">
              ✧
            </span>
            <span>{t('get_ready_countdown', { number: countdownNumber })}</span>
          </button>
        )}

        {fsmState === STATES.CRACKER_SHOW_ACTIVE && (
          <button
            type="button"
            className="btn btn--primary contextual-primary-btn is-in-progress"
            disabled
            aria-label={t('watching_celebration_aria')}
          >
            <span aria-hidden="true">✨</span>
            <span>{t('enjoy_the_lights')}</span>
          </button>
        )}

        {fsmState === STATES.REWARD_CELEBRATION && (
          <div className="reward-action-dual">
            <button
              type="button"
              className="btn btn--secondary contextual-secondary-btn"
              onClick={onLightAgain}
              aria-label={t('light_again_action_aria')}
            >
              {t('light_again')}
            </button>
            <button
              type="button"
              className="btn btn--primary contextual-primary-btn"
              onClick={isLastCracker ? onLightAgain : onNextCracker}
              aria-label={isLastCracker ? t('light_again_action_aria') : t('proceed_next_aria')}
            >
              <span>{isLastCracker ? t('celebrate_again') : t('next_sparkle')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
