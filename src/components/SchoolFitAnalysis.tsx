'use client'

import { Narrative, StudentProfile, School, SchoolFit } from '@/types'
import { useEffect, useState, useMemo } from 'react'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'
import TraitMatcher from './TraitMatcher'
import { computeTier, getTierRationale, getSchoolAlignedEssayIdea } from '@/lib/admissions-utils'
import { Sparkles, Target, Zap } from 'lucide-react'

interface SchoolFitAnalysisProps {
  narrative: Narrative
  profile: StudentProfile
  onComplete?: () => void
}

// Tier color constants - extracted to avoid recalculation
const TIER_COLORS = {
  list: {
    Reach: 'text-rose-600 bg-rose-50 border-rose-200',
    Target: 'text-blue-600 bg-blue-50 border-blue-200',
    Safety: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  detail: {
    Reach: 'bg-rose-50 border-rose-200 text-rose-700',
    Target: 'bg-blue-50 border-blue-200 text-blue-700',
    Safety: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
}

/**
 * Extract top traits from school fit data
 */
const getTopTraits = (traitMatch: SchoolFit['traitMatch']): string => {
  return Object.entries(traitMatch)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait.replace(/([A-Z])/g, ' $1').trim())
    .join(', ')
}

/**
 * Get fit assessment message based on score
 */
const getFitAssessment = (score: number): string => {
  if (score >= 75) {
    return '✓ Excellent fit: Your narrative strongly aligns with what this school values.'
  }
  if (score >= 60) {
    return '⚠ Good fit: Your narrative is relevant, but there are opportunities to strengthen alignment.'
  }
  return '• Develop further: Consider how your narrative could better reflect this school\'s values.'
}

export default function SchoolFitAnalysis({
  narrative,
  profile,
  onComplete,
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
      onComplete?.()
    }

    analyzeAllSchools()
  }, [narrative, profile, onComplete])

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

  // Memoize school list rendering data to avoid recalculation
  const schoolListData = useMemo(() => {
    return profile.targetSchools
      .map((school) => {
        const fit = schoolFits.get(school.id)
        if (!fit) return null

        return {
          school,
          fit,
          tier: computeTier(profile, school, fit),
          topTraits: getTopTraits(fit.traitMatch),
          isActive: selectedSchool === school.id,
        }
      })
      .filter(Boolean) as Array<{
        school: School
        fit: SchoolFit
        tier: 'Reach' | 'Target' | 'Safety'
        topTraits: string
        isActive: boolean
      }>
  }, [profile, schoolFits, selectedSchool])

  // Memoize detailed analysis data
  const selectedAnalysis = useMemo(() => {
    if (!selectedSchool) return null

    const selectedSchoolObj = profile.targetSchools.find((s) => s.id === selectedSchool)
    const selectedFit = schoolFits.get(selectedSchool)

    if (!selectedSchoolObj || !selectedFit) return null

    return {
      school: selectedSchoolObj,
      fit: selectedFit,
      tier: computeTier(profile, selectedSchoolObj, selectedFit),
      tierRationale: getTierRationale(profile, selectedSchoolObj, computeTier(profile, selectedSchoolObj, selectedFit), selectedFit),
      essayIdea: getSchoolAlignedEssayIdea(narrative, selectedSchoolObj, selectedFit),
    }
  }, [selectedSchool, profile, schoolFits, narrative])

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
        {schoolListData.map(({ school, fit, tier, topTraits, isActive }) => (
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
                  <span
                    className={`text-xs uppercase tracking-[0.25em] font-semibold px-2 py-1 rounded-md border ${TIER_COLORS.list[tier]}`}
                  >
                    {tier}
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
        ))}
      </div>

      {/* Detailed Analysis */}
      {selectedAnalysis && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">{selectedAnalysis.school.name}</h3>

            {/* Dynamic Tier Explanation */}
            <div className={`mb-6 p-4 rounded-xl border ${TIER_COLORS.detail[selectedAnalysis.tier]}`}>
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">
                    Classified as <span className="uppercase tracking-wide">{selectedAnalysis.tier}</span>
                  </p>
                  <p className="text-sm opacity-90">{selectedAnalysis.tierRationale}</p>
                </div>
              </div>
            </div>

            {/* Trait Matcher */}
            <TraitMatcher fit={selectedAnalysis.fit} />

            {/* Percentile Info */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-600 text-sm">
                <strong>Percentile rank:</strong> Your narrative profile is in the{' '}
                <span className="font-bold text-slate-900">{selectedAnalysis.fit.percentileRank}th percentile</span>{' '}
                of admitted students at {selectedAnalysis.school.name}
              </p>
            </div>

            {/* Essay Idea */}
            {selectedAnalysis.essayIdea && (
              <div className="mt-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Essay Launch Kit</h4>
                    <p className="text-xs text-slate-500">Tailored to {selectedAnalysis.school.name}'s values</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-semibold text-indigo-900 text-sm mb-1">
                      {selectedAnalysis.essayIdea.title}
                    </h5>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedAnalysis.essayIdea.concept}
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600 mb-1">Why it stands out</p>
                    <p className="text-sm text-slate-700">{selectedAnalysis.essayIdea.whyItStandsOut}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-slate-600">Hardness:</span>
                      <span className="font-semibold text-slate-900">
                        {'⚡'.repeat(selectedAnalysis.essayIdea.hardness)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-600">Impact:</span>
                      <span className="font-semibold text-slate-900">
                        {'⭐'.repeat(selectedAnalysis.essayIdea.effectiveness)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600 mb-2">Starter steps</p>
                    <ol className="space-y-1.5 text-sm text-slate-700">
                      {selectedAnalysis.essayIdea.starterSteps.map((step, idx) => (
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
              <p className="text-slate-600">{getFitAssessment(selectedAnalysis.fit.overallFitScore)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
