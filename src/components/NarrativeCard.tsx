'use client'

import { Narrative, StudentProfile } from '@/types'
import { Button } from './ui/button'

interface NarrativeCardProps {
  narrative: Narrative
  profile: StudentProfile
  isSelected: boolean
  onSelect: () => void
  showOnlyRelevant: boolean
}

export default function NarrativeCard({
  narrative,
  profile,
  isSelected,
  onSelect,
  showOnlyRelevant,
}: NarrativeCardProps) {
  const getCoherenceColor = (score: number) => {
    if (score >= 85) return 'from-forest-300 to-secondary'
    if (score >= 70) return 'from-coral-200 to-coral-100'
    if (score >= 55) return 'from-sand-100 to-sand-200'
    return 'from-coral-300 to-coral-400'
  }

  const getCoherenceLabel = (score: number) => {
    if (score >= 85) return 'Highly Achievable'
    if (score >= 70) return 'Achievable'
    if (score >= 55) return 'Challenging'
    return 'Very Ambitious'
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left animate-smooth rounded-xl border-2 p-6 h-full flex flex-col card-hover ${
        isSelected
          ? 'border-coral-300 bg-coral-50 shadow-xl shadow-coral-200/30'
          : 'border-sand-100 bg-white hover:border-coral-200 hover:shadow-md'
      }`}
    >
      {/* Coherence Score Badge */}
      <div className={`mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${getCoherenceColor(narrative.coherenceScore)} w-fit shadow-md`}>
        <span className="text-2xl font-bold text-black">{narrative.coherenceScore}</span>
        <span className="text-xs font-semibold text-black">{getCoherenceLabel(narrative.coherenceScore)}</span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-display font-bold text-forest-700 mb-2">{narrative.title}</h3>

      {/* Theme */}
      <p className="text-forest-600 text-sm mb-4 flex-1 leading-relaxed">{narrative.theme}</p>

      {/* Supporting Activities Count */}
      <div className="mb-4">
        <p className="text-xs font-medium text-forest-500 mb-2">Supporting Activities</p>
        <div className="flex flex-wrap gap-1">
          {narrative.supportingActivities.slice(0, 3).map((activity) => (
            <span key={activity.id} className="px-2 py-1 bg-forest-100 text-forest-600 text-xs rounded-md font-medium">
              {activity.name}
            </span>
          ))}
          {narrative.supportingActivities.length > 3 && (
            <span className="px-2 py-1 bg-sand-100 text-forest-500 text-xs rounded-md">
              +{narrative.supportingActivities.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Gaps Preview */}
      {narrative.gaps.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-forest-500 mb-1">Gaps</p>
          <p className="text-xs text-coral-400">{narrative.gaps[0]}</p>
          {narrative.gaps.length > 1 && (
            <p className="text-xs text-forest-400">+{narrative.gaps.length - 1} more</p>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-auto pt-4 border-t border-sand-100">
        <Button
          variant={isSelected ? 'default' : 'outline'}
          className={isSelected ? 'w-full bg-coral-300 hover:bg-coral-400' : 'w-full border-forest-300 text-forest-600 hover:bg-forest-50'}
        >
          {isSelected ? '✓ Selected' : 'Select Narrative'}
        </Button>
      </div>
    </button>
  )
}
