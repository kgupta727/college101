'use client'

import { StudentProfile } from '@/types'
import ProfileForm from '@/components/ProfileForm'

interface ProfileStepProps {
  initialLoad: boolean
  profile: StudentProfile | null
  loading?: boolean
  onComplete: (profile: StudentProfile, additionalContext?: string) => void
  onStepComplete: (profile: StudentProfile) => Promise<void>
}

/**
 * Profile step component - first step in the flow
 * Handles profile form rendering and completion
 */
export default function ProfileStep({
  initialLoad,
  profile,
  loading = false,
  onComplete,
  onStepComplete,
}: ProfileStepProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
      {initialLoad ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      ) : (
        <ProfileForm
          onComplete={onComplete}
          initialProfile={profile}
          onStepComplete={onStepComplete}
          loading={loading}
        />
      )}
    </div>
  )
}
