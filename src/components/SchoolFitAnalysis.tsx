'use client'

import { Narrative, StudentProfile, SchoolFit } from '@/types'
import { useEffect, useState } from 'react'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'
import TraitMatcher from './TraitMatcher'
import { computeTier, getTierRationale } from '@/lib/admissions-utils'
import { readSchoolFitCache, writeSchoolFitCache } from '@/lib/schoolFitCache'
import { loadSchoolFitsFromDB, saveSchoolFitsToDB } from '@/actions/schoolFitActions'
import { Target, ChevronDown, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'

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

const normalizeAdmissionRate = (value: number | null | undefined): number => {
  if (!Number.isFinite(value as number)) return 0
  const numeric = value as number
  if (numeric <= 0) return 0
  return numeric <= 1 ? numeric * 100 : numeric
}

export default function SchoolFitAnalysis({
  narrative,
  profile,
  onComplete,
}: SchoolFitAnalysisProps) {
  const [schoolFits, setSchoolFits] = useState<Map<string, SchoolFit>>(new Map())
  const [loading, setLoading] = useState(true)
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)

  useEffect(() => {
    const analyzeAllSchools = async () => {
      const schoolIds = profile.targetSchools.map((s) => s.id)

      // L1 — localStorage (instant, no network)
      const cached = readSchoolFitCache(narrative.id, schoolIds)
      if (cached && cached.size > 0) {
        setSchoolFits(cached)
        setExpandedSchool(profile.targetSchools[0]?.id || null)
        setLoading(false)
        onComplete?.()
        return
      }

      // L2 — Supabase DB (cross-device, survives cache clear)
      const dbResults = await loadSchoolFitsFromDB(narrative.title, schoolIds)
      if (Object.keys(dbResults).length === schoolIds.length) {
        const dbMap = new Map<string, SchoolFit>(Object.entries(dbResults))
        // Populate L1 so subsequent visits this session are instant
        writeSchoolFitCache(narrative.id, schoolIds, dbMap)
        setSchoolFits(dbMap)
        setExpandedSchool(profile.targetSchools[0]?.id || null)
        setLoading(false)
        onComplete?.()
        return
      }

      // L3 — OpenAI (parallel, not sequential)
      const results = await Promise.all(
        profile.targetSchools.map(async (school) => {
          try {
            const fitResult = await analyzeSchoolFitAction(narrative, school.name, profile)
            const schoolFit: SchoolFit = {
              schoolId: school.id,
              narrativeId: narrative.id,
              traitMatch: fitResult.traitMatch,
              overallFitScore: fitResult.overallFitScore,
              percentileRank: fitResult.percentileRank,
              collegeValues: fitResult.collegeValues,
              strengths: fitResult.strengths,
              improvements: fitResult.improvements,
            }
            return { id: school.id, fit: schoolFit }
          } catch (error) {
            console.error(`Error analyzing fit for ${school.name}:`, error)
            return null
          }
        })
      )

      const fits = new Map<string, SchoolFit>()
      for (const result of results) {
        if (result) fits.set(result.id, result.fit)
      }

      // Write to L1 (localStorage) and L2 (DB) in parallel
      writeSchoolFitCache(narrative.id, schoolIds, fits)
      saveSchoolFitsToDB(
        narrative.title,
        Array.from(fits.entries()).map(([id, fit]) => ({
          schoolId: id,
          schoolName: profile.targetSchools.find((s) => s.id === id)?.name ?? id,
          fit,
        }))
      ).catch((e) => console.error('Failed to persist school fits:', e))

      setSchoolFits(fits)
      if (fits.size > 0) {
        setExpandedSchool(profile.targetSchools[0]?.id || null)
      }
      setLoading(false)
      onComplete?.()
    }

    analyzeAllSchools()
  }, [narrative.id, profile.targetSchools.length, onComplete])




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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-semibold text-slate-900 mb-2">School Snapshot</h2>
        <p className="text-slate-500">
          How well does "{narrative.title}" align with each school's values?
        </p>
      </div>

      {/* School-Specific Analysis */}
      <div className="space-y-6">

        {/* Expandable School Cards */}
        {profile.targetSchools.map((school) => {
          const fit = schoolFits.get(school.id)
          if (!fit) return null

          const normalizedSchool = {
            ...school,
            admissionRate: normalizeAdmissionRate(school.admissionRate),
          }

          const tier = computeTier(profile, normalizedSchool, fit)
          const topTraits = getTopTraits(fit.traitMatch)
          const isExpanded = expandedSchool === school.id

          // Get detailed info if expanded
          let details = null
          if (isExpanded) {
            const tierRationale = getTierRationale(profile, school, tier, fit)
            details = { tier, tierRationale }
          }

          return (
            <div 
              key={school.id} 
              className={`border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all ${
                isExpanded ? 'ring-2 ring-slate-900' : ''
              }`}
            >
              {/* Card Header - Always Visible */}
              <button
                onClick={() => setExpandedSchool(isExpanded ? null : school.id)}
                className="w-full text-left px-6 py-5 bg-white hover:bg-slate-50 transition-colors flex justify-between items-start"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs uppercase tracking-[0.25em] font-semibold px-2 py-1 rounded-md border ${TIER_COLORS.list[tier]}`}
                    >
                      {tier}
                    </span>
                    <span className="text-xs text-slate-400">
                      {normalizedSchool.admissionRate > 0 ? `${normalizedSchool.admissionRate.toFixed(1)}% admit` : 'Admission rate N/A'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{school.name}</h3>
                  <p className="text-sm text-slate-500">Strong in {topTraits.toLowerCase()}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {fit.overallFitScore}% fit
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Percentile {fit.percentileRank}th</p>
                  <ChevronDown className={`w-4 h-4 text-slate-400 mt-2 mx-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded Details - Inline */}
              {isExpanded && details && (
                <div className="bg-slate-50/50 border-t border-slate-200 px-6 py-6 space-y-6">

                  {/* 1. What this college looks for */}
                  {fit.collegeValues && fit.collegeValues.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <h4 className="font-semibold text-indigo-900 text-sm">What {school.name} looks for</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fit.collegeValues.map((val, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Trait Match Score (dynamic per college) */}
                  <TraitMatcher fit={fit} />

                  {/* 3. Strengths & Improvements side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strong points */}
                    {fit.strengths && fit.strengths.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <h4 className="font-semibold text-emerald-800 text-sm mb-3">Strong points for {school.name}</h4>
                        <ul className="space-y-2">
                          {fit.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-emerald-900">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {fit.improvements && fit.improvements.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <h4 className="font-semibold text-amber-800 text-sm mb-3">Points to address</h4>
                        <ul className="space-y-2">
                          {fit.improvements.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-amber-900">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* 4. Dynamic Tier Explanation */}
                  <div className={`p-4 rounded-xl border ${TIER_COLORS.detail[details.tier]}`}>
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">
                          Classified as <span className="uppercase tracking-wide">{details.tier}</span>
                        </p>
                        <p className="text-sm opacity-90">{details.tierRationale}</p>
                      </div>
                    </div>
                  </div>

                  {/* 5. Percentile Info */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-600 text-sm">
                      <strong>Percentile rank:</strong> Your narrative profile is in the{' '}
                      <span className="font-bold text-slate-900">{fit.percentileRank}th percentile</span>{' '}
                      of admitted students at {school.name}
                    </p>
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
