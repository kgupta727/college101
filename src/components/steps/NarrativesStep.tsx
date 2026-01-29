'use client'

import { Button } from '@/components/ui/button'
import NarrativeDisplay from '@/components/NarrativeDisplay'
import { Narrative, StudentProfile } from '@/types'
import { RotateCw } from 'lucide-react'

interface NarrativesStepProps {
  profile: StudentProfile
  narratives: Narrative[]
  selectedNarrative: Narrative | null
  loading: boolean
  onSelectNarrative: (narrative: Narrative) => void
  onRegenerate: () => Promise<void>
  onEditProfile: () => void
  onProceedToSchoolFit: () => void
}

/**
 * Narratives step component - second step in the flow
 * Displays generated narratives and allows selection
 */
export default function NarrativesStep({
  profile,
  narratives,
  selectedNarrative,
  loading,
  onSelectNarrative,
  onRegenerate,
  onEditProfile,
  onProceedToSchoolFit,
}: NarrativesStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Your narratives</h2>
          <Button
            onClick={onRegenerate}
            disabled={loading}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-white gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Generate New
          </Button>
        </div>
        <NarrativeDisplay
          narratives={narratives}
          profile={profile}
          onSelectNarrative={onSelectNarrative}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onEditProfile}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-white"
        >
          Edit Profile
        </Button>
        <Button
          onClick={onProceedToSchoolFit}
          disabled={!selectedNarrative}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze School Fit →
        </Button>
      </div>
    </div>
  )
}
