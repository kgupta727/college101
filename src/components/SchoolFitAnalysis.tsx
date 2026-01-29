'use client'

import { Narrative, StudentProfile, School, SchoolFit } from '@/types'
import { useEffect, useState } from 'react'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'
import TraitMatcher from './TraitMatcher'
import { computeTier, getTierRationale, getSchoolAlignedEssayIdea } from '@/lib/admissions-utils'
import { Sparkles, Target, Zap } from 'lucide-react'

interface SchoolFitAnalysisProps {
  narrative: Narrative
  profile: StudentProfile
}

export default function SchoolFitAnalysis({
  narrative,
  profile,
}: SchoolFitAnalysisProps) {
  const [schoolFits, setSchoolFits] = useState<Map<string, SchoolFit>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)

  useEffect(() => {
    const analyzeAllSchools = async () => {
      setLoading(true)
      const fits = new Map<string, SchoolFit>()

      for (const school of profile.targetSchools) {
        try {
          const fitResult = await analyzeSchoolFitAction(narrative, school.name)
          const schoolFit: SchoolFit = {
            schoolId: school.id,
            narrativeId: narrative.id,
            traitMatch: fitResult.traitMatch,
            overallFitScore: fitResult.overallFitScore,
            percentileRank: fitResult.percentileRank,
          }
          fits.set(school.id, schoolFit)
        } catch (error) {
          console.error(`Error analyzing fit for ${school.name}:`, error)
        }
      }

      setSchoolFits(fits)
      if (fits.size > 0) {
        setSelectedSchool(profile.targetSchools[0]?.id || null)
      }
      setLoading(false)
    }

    analyzeAllSchools()
  }, [narrative, profile])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-slate-900">Analyzing school fit…</h2>
        <div className="grid gap-4">
          {profile.targetSchools.map((school) => (
            <div
              key={school.id}
              className="bg-white/70 border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const selectedSchoolObj = profile.targetSchools.find(
    (s) => s.id === selectedSchool
  )
  const selectedFit = selectedSchool ? schoolFits.get(selectedSchool) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-semibold text-slate-900 mb-2">School fit analysis</h2>
        <p className="text-slate-500">
          How well does “{narrative.title}” align with each school’s values?
        </p>
      </div>

      {/* School Selector */}
      <div className="grid gap-4">
        {profile.targetSchools.map((school) => {
          const fit = schoolFits.get(school.id)
          if (!fit) return null

          const dynamicTier = computeTier(profile, school, fit)
          const tierColors = {
            Reach: 'text-rose-600 bg-rose-50 border-rose-200',
            Target: 'text-blue-600 bg-blue-50 border-blue-200',
            Safety: 'text-emerald-600 bg-emerald-50 border-emerald-200'
          }

          // Get top 2 traits
          const traitEntries = Object.entries(fit.traitMatch)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
          const topTraits = traitEntries.map(([trait]) => 
            trait.replace(/([A-Z])/g, ' $1').trim()
          ).join(', ')

          const isActive = selectedSchool === school.id
          return (
            <button
              key={school.id}
              onClick={() => setSelectedSchool(school.id)}
              className={`text-left rounded-2xl p-5 transition-all border shadow-sm ${
                isActive
                  ? 'border-slate-900 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
                  : 'border-slate-200 bg-white/80 hover:bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs uppercase tracking-[0.25em] font-semibold px-2 py-1 rounded-md border ${tierColors[dynamicTier]}`}>
                      {dynamicTier}
                    </span>
                    <span className="text-xs text-slate-400">{school.admissionRate.toFixed(1)}% admit</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{school.name}</h3>
                  <p className="text-sm text-slate-500">Strong in {topTraits.toLowerCase()}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {fit.overallFitScore}% fit
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Percentile {fit.percentileRank}th</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detailed Analysis */}
      {selectedSchoolObj && selectedFit && (() => {
        const dynamicTier = computeTier(profile, selectedSchoolObj, selectedFit)
        const tierRationale = getTierRationale(profile, selectedSchoolObj, dynamicTier, selectedFit)
        const essayIdea = getSchoolAlignedEssayIdea(narrative, selectedSchoolObj, selectedFit)
        
        const tierColors = {
          Reach: 'bg-rose-50 border-rose-200 text-rose-700',
          Target: 'bg-blue-50 border-blue-200 text-blue-700',
          Safety: 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">{selectedSchoolObj.name}</h3>

              {/* Dynamic Tier Explanation */}
              <div className={`mb-6 p-4 rounded-xl border ${tierColors[dynamicTier]}`}>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Classified as <span className="uppercase tracking-wide">{dynamicTier}</span></p>
                    <p className="text-sm opacity-90">{tierRationale}</p>
                  </div>
                </div>
              </div>

              {/* Trait Matcher */}
              <TraitMatcher fit={selectedFit} />

              {/* Percentile Info */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-slate-600 text-sm">
                  <strong>Percentile rank:</strong> Your narrative profile is in the{' '}
                  <span className="font-bold text-slate-900">{selectedFit.percentileRank}th percentile</span>{' '}
                  of admitted students at {selectedSchoolObj.name}
                </p>
              </div>

              {/* Essay Idea */}
              {essayIdea && (
                <div className="mt-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Essay Launch Kit</h4>
                      <p className="text-xs text-slate-500">Tailored to {selectedSchoolObj.name}'s values</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-indigo-900 text-sm mb-1">{essayIdea.title}</h5>
                      <p className="text-sm text-slate-700 leading-relaxed">{essayIdea.concept}</p>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-600 mb-1">Why it stands out</p>
                      <p className="text-sm text-slate-700">{essayIdea.whyItStandsOut}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-600">Hardness:</span>
                        <span className="font-semibold text-slate-900">{'⚡'.repeat(essayIdea.hardness)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-600">Impact:</span>
                        <span className="font-semibold text-slate-900">{'⭐'.repeat(essayIdea.effectiveness)}</span>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                      <p className="text-xs font-medium text-indigo-600 mb-2">Starter steps</p>
                      <ol className="space-y-1.5 text-sm text-slate-700">
                        {essayIdea.starterSteps.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-semibold text-indigo-600 flex-shrink-0">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Fit Assessment */}
              <div className="mt-6">
                <h4 className="font-semibold text-slate-900 mb-3">What this means</h4>
                <p className="text-slate-600">
                  {selectedFit.overallFitScore >= 75
                    ? '✓ Excellent fit: Your narrative strongly aligns with what this school values.'
                    : selectedFit.overallFitScore >= 60
                    ? '⚠ Good fit: Your narrative is relevant, but there are opportunities to strengthen alignment.'
                    : '• Develop further: Consider how your narrative could better reflect this school\'s values.'}
                </p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
