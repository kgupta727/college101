'use client'

import ActionDashboard from '@/components/ActionDashboard'
import { Narrative, StudentProfile } from '@/types'

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
export default function ActionPlanStep({
  profile,
  narrative,
  onProfileUpdate,
  onComplete,
}: ActionPlanStepProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
      <ActionDashboard
        narrative={narrative}
        profile={profile}
        onProfileUpdate={onProfileUpdate}
        onComplete={onComplete}
      />
    </div>
  )
}
