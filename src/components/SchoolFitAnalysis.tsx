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
        <h2 className="text-3xl font-bold text-white">Analyzing School Fit...</h2>
        <div className="grid gap-4">
          {profile.targetSchools.map((school) => (
            <div
              key={school.id}
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 animate-pulse"
            >
              <div className="h-6 bg-slate-600 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-600 rounded w-full" />
                <div className="h-4 bg-slate-600 rounded w-2/3" />
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
      <div className="border-b border-slate-700 pb-6">
        <h2 className="text-3xl font-bold text-white mb-2">School Fit Analysis</h2>
        <p className="text-slate-300">
          How well does "{narrative.title}" align with each school's values?
        </p>
      </div>

      {/* School Selector */}
      <div className="grid gap-4">
        {profile.targetSchools.map((school) => {
          const fit = schoolFits.get(school.id)
          if (!fit) return null

          return (
            <button
              key={school.id}
              onClick={() => setSelectedSchool(school.id)}
              className={`text-left border-2 rounded-lg p-4 transition-all ${
                selectedSchool === school.id
                  ? 'border-blue-400 bg-slate-700/50'
                  : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-semibold">{school.name}</h3>
                  <p className="text-slate-400 text-sm">
                    Tier: <span className="font-medium">{school.tier}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {fit.overallFitScore}%
                  </div>
                  <p className="text-xs text-slate-400">Overall Fit</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detailed Analysis */}
      {selectedSchoolObj && selectedFit && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{selectedSchoolObj.name}</h3>

            {/* Trait Matcher */}
            <TraitMatcher fit={selectedFit} />

            {/* Percentile Info */}
            <div className="mt-6 p-4 bg-slate-600/50 rounded-lg">
              <p className="text-slate-300 text-sm">
                <strong>Percentile Rank:</strong> Your narrative profile is in the{' '}
                <span className="font-bold text-blue-300">{selectedFit.percentileRank}th percentile</span>{' '}
                of admitted students at {selectedSchoolObj.name}
              </p>
            </div>

            {/* Fit Assessment */}
            <div className="mt-6">
              <h4 className="font-semibold text-white mb-3">What This Means</h4>
              <p className="text-slate-300">
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
