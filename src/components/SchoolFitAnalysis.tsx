'use client'

import { Narrative, StudentProfile, School, SchoolFit } from '@/types'
import { useEffect, useState } from 'react'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'
import TraitMatcher from './TraitMatcher'

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
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{school.tier}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{school.name}</h3>
                  <p className="text-sm text-slate-500">Trait resonance snapshot</p>
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
      {selectedSchoolObj && selectedFit && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">{selectedSchoolObj.name}</h3>

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
      )}
    </div>
  )
}
