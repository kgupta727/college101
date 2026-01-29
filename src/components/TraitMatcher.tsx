'use client'

import { SchoolFit } from '@/types'

interface TraitMatcherProps {
  fit: SchoolFit
}

const TRAITS = [
  'intellectualCuriosity',
  'socialImpact',
  'innovation',
  'resilience',
  'leadership',
  'creativity',
]

const TRAIT_LABELS = {
  intellectualCuriosity: 'Intellectual Curiosity',
  socialImpact: 'Social Impact',
  innovation: 'Innovation',
  resilience: 'Resilience',
  leadership: 'Leadership',
  creativity: 'Creativity',
}

export default function TraitMatcher({ fit }: TraitMatcherProps) {
  const getColor = (score: number) => {
    if (score >= 75) return 'from-emerald-500 to-teal-500'
    if (score >= 60) return 'from-blue-500 to-cyan-500'
    if (score >= 45) return 'from-yellow-500 to-amber-500'
    return 'from-red-500 to-orange-500'
  }

  const getLabel = (score: number) => {
    if (score >= 75) return 'Strong'
    if (score >= 60) return 'Good'
    if (score >= 45) return 'Moderate'
    return 'Develop'
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white">Trait Match Score</h4>

      <div className="space-y-3">
        {TRAITS.map((trait) => {
          const key = trait as keyof typeof fit.traitMatch
          const score = fit.traitMatch[key]

          return (
            <div key={trait} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">
                  {TRAIT_LABELS[key as keyof typeof TRAIT_LABELS]}
                </span>
                <span className="text-sm font-bold text-white">{score}%</span>
              </div>

              {/* Animated Bar */}
              <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getColor(score)} transition-all duration-700 ease-out`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Label */}
              <p className="text-xs text-slate-400">{getLabel(score)} match</p>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-600">
        <div className="bg-slate-600/50 rounded p-3">
          <p className="text-xs text-slate-400">Strongest Fit</p>
          <p className="text-sm font-semibold text-blue-300 mt-1">
            {
              Object.entries(fit.traitMatch).sort(
                ([, a], [, b]) => (b as number) - (a as number)
              )[0][0]
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            }
          </p>
        </div>

        <div className="bg-slate-600/50 rounded p-3">
          <p className="text-xs text-slate-400">Growth Area</p>
          <p className="text-sm font-semibold text-yellow-300 mt-1">
            {
              Object.entries(fit.traitMatch).sort(
                ([, a], [, b]) => (a as number) - (b as number)
              )[0][0]
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            }
          </p>
        </div>
      </div>
    </div>
  )
}
