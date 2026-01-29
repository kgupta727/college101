/**
 * Flow step constants and configuration
 * Centralizes all step-related data to eliminate magic strings and duplication
 */

export type FlowStep = 'profile' | 'narratives' | 'schoolFit' | 'actionPlan'

export interface StepConfig {
  key: FlowStep
  label: string
}

export const FLOW_STEPS: StepConfig[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'narratives', label: 'Narratives' },
  { key: 'schoolFit', label: 'School Fit' },
  { key: 'actionPlan', label: 'Action Plan' },
]

/**
 * Get step configuration by key
 */
export const getStepConfig = (key: FlowStep): StepConfig | undefined => {
  return FLOW_STEPS.find(step => step.key === key)
}

/**
 * Check if a step is completed based on its key and completion state
 */
export const isStepComplete = (
  stepKey: FlowStep,
  completionState: {
    narrativeCompleted: boolean
    schoolFitCompleted: boolean
    actionPlanCompleted: boolean
  }
): boolean => {
  // Profile step is always complete (can always be edited)
  if (stepKey === 'profile') return true
  
  if (stepKey === 'narratives') return completionState.narrativeCompleted
  if (stepKey === 'schoolFit') return completionState.schoolFitCompleted
  if (stepKey === 'actionPlan') return completionState.actionPlanCompleted
  
  return false
}

/**
 * Get the next step after current step
 */
export const getNextStep = (currentStep: FlowStep): FlowStep | null => {
  const currentIndex = FLOW_STEPS.findIndex(step => step.key === currentStep)
  if (currentIndex === -1 || currentIndex === FLOW_STEPS.length - 1) return null
  return FLOW_STEPS[currentIndex + 1].key
}

/**
 * Get the previous step before current step
 */
export const getPreviousStep = (currentStep: FlowStep): FlowStep | null => {
  const currentIndex = FLOW_STEPS.findIndex(step => step.key === currentStep)
  if (currentIndex <= 0) return null
  return FLOW_STEPS[currentIndex - 1].key
}
