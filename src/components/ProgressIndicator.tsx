'use client'

import { Button } from '@/components/ui/button'
import { FLOW_STEPS, FlowStep, isStepComplete } from '@/constants/flow'

interface ProgressIndicatorProps {
  currentStep: FlowStep
  onStepChange: (step: FlowStep) => void
  completionState: {
    narrativeCompleted: boolean
    schoolFitCompleted: boolean
    actionPlanCompleted: boolean
  }
}

/**
 * Progress indicator component that shows completed/active/disabled steps
 * Handles navigation between steps with intelligent clickability logic
 */
export default function ProgressIndicator({
  currentStep,
  onStepChange,
  completionState,
}: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        {FLOW_STEPS.map((step, index) => {
          const isActive = currentStep === step.key
          const isComplete = isStepComplete(step.key, completionState)
          const isClickable = isActive || isComplete

          return (
            <div key={step.key} className="flex items-center gap-3 text-sm">
              {index > 0 && <span className="text-slate-300">/</span>}
              <button
                onClick={() => isClickable && onStepChange(step.key)}
                disabled={!isClickable}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium shadow-sm transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : isClickable
                      ? 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white hover:shadow-md cursor-pointer'
                      : 'bg-white/60 text-slate-500 border-slate-200 cursor-not-allowed'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isActive ? '#22c55e' : isClickable && !isActive ? '#a5b4fc' : '#cbd5e1',
                  }}
                />
                {step.label}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
