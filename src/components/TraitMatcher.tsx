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

  const strongest = Object.entries(fit.traitMatch).sort(([, a], [, b]) => (b as number) - (a as number))[0][0]
  const weakest = Object.entries(fit.traitMatch).sort(([, a], [, b]) => (a as number) - (b as number))[0][0]
  const format = (t: string) =>
    t
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <h4 className="font-semibold text-slate-900">Trait match score</h4>
      </div>

      <div className="space-y-3">
        {TRAITS.map((trait) => {
          const key = trait as keyof typeof fit.traitMatch
          const score = fit.traitMatch[key]

          return (
            <div key={trait} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">
                  {TRAIT_LABELS[key as keyof typeof TRAIT_LABELS]}
                </span>
                <span className="text-sm font-semibold text-slate-900">{score}%</span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getColor(score)} transition-all duration-700 ease-out`}
                  style={{ width: `${score}%` }}
                />
              </div>

              <p className="text-xs text-slate-500">{getLabel(score)} match</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Strongest fit</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{format(strongest)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Growth area</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{format(weakest)}</p>
        </div>
      </div>
    </div>
  )
}
