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
  const isLocked = true

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
      <div className={isLocked ? 'pointer-events-none blur-sm' : ''}>
        <ActionDashboard
          narrative={narrative}
          profile={profile}
          onProfileUpdate={onProfileUpdate}
          onComplete={onComplete}
        />
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur-sm">
          <div className="text-center px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Coming soon</p>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">Action Plan is locked</h3>
            <p className="text-slate-600">
              We’re polishing this experience. Changes coming soon!!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
