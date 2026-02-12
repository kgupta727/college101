'use client'

import { Button } from '@/components/ui/button'
import SchoolFitAnalysis from '@/components/SchoolFitAnalysis'
import { Narrative, StudentProfile } from '@/types'
import { Edit2 } from 'lucide-react'

interface SchoolFitStepProps {
  profile: StudentProfile
  narrative: Narrative
  onEditProfile: () => void
  onCompleted: () => void
  onBack: () => void
  onProceedToActionPlan: () => void
}

/**
 * School Fit Analysis step component - third step in the flow
 * Analyzes how the selected narrative aligns with target schools
 */
export default function SchoolFitStep({
  profile,
  narrative,
  onEditProfile,
  onCompleted,
  onBack,
  onProceedToActionPlan,
}: SchoolFitStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">School Fit Analysis</h2>
          <Button
            onClick={onEditProfile}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-white gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
        <SchoolFitAnalysis
          narrative={narrative}
          profile={profile}
          onComplete={onCompleted}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-white"
        >
          Back to Narratives
        </Button>
        <Button
          onClick={onProceedToActionPlan}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
        >
          Start Writing Essays
        </Button>
      </div>
    </div>
  )
}
