'use client'

import { Narrative, StudentProfile } from '@/types'
import EssayWritingPage from '@/components/EssayWriting'

interface ActionPlanStepProps {
  profile: StudentProfile
  narrative: Narrative
  onProfileUpdate: (profile: StudentProfile) => Promise<void>
  onComplete: () => void
}

/**
 * Action Plan step component - fourth and final step in the flow
 * Creates an actionable plan based on school fit analysis
 */
export default function ActionPlanStep({ profile, narrative }: ActionPlanStepProps) {
  return <EssayWritingPage profile={profile} narrative={narrative} />
}
