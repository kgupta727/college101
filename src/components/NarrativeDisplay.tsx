'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Narrative, School, SchoolFit, StudentProfile, Activity } from '@/types'
import NarrativeCard from './NarrativeCard'
import { motion } from 'framer-motion'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'
import { generateReconsiderSuggestionAction } from '@/actions/generateReconsiderSuggestion'
import { loadReconsiderSuggestionsAction, saveReconsiderSuggestionAction } from '@/actions/profileActions'
import { readSchoolFitCache, writeSchoolFitCache } from '@/lib/schoolFitCache'
import { loadSchoolFitsFromDB, saveSchoolFitsToDB } from '@/actions/schoolFitActions'

interface NarrativeDisplayProps {
  narratives: Narrative[]
  profile: StudentProfile
  onSelectNarrative: (narrative: Narrative) => void
}

interface ReconsiderSuggestion {
  activityId: string
  suggestion: string
  loading: boolean
  error: string | null
}

export default function NarrativeDisplay({
  narratives,
  profile,
  onSelectNarrative,
}: NarrativeDisplayProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(true)
  const [bestFitSchools, setBestFitSchools] = useState<Array<{ school: School; score: number; percentile: number }>>([])
  const [bestFitLoading, setBestFitLoading] = useState(false)
  const [bestFitError, setBestFitError] = useState<string | null>(null)
  const [reconsiderSuggestions, setReconsiderSuggestions] = useState<Map<string, ReconsiderSuggestion>>(new Map())

  const suggestionsLoadedRef = useRef<Set<string>>(new Set())

  const selectedNarrative = useMemo(
    () => narratives.find((n) => n.id === selectedId) || null,
    [narratives, selectedId]
  )

  const handleSelect = (narrative: Narrative) => {
    setSelectedId(narrative.id)
    onSelectNarrative(narrative)
  }

  // Best-fit schools: read from shared localStorage cache (written by SchoolFitAnalysis
  // if the user already visited that step, or written here if visited NarrativesStep first).
  useEffect(() => {
    const loadBestFits = async () => {
      if (!selectedNarrative || profile.targetSchools.length === 0) {
        setBestFitSchools([])
        return
      }

      const schoolIds = profile.targetSchools.map((s) => s.id)

      // L1 — shared localStorage cache
      const cached = readSchoolFitCache(selectedNarrative.id, schoolIds)
      if (cached && cached.size > 0) {
        const top3 = profile.targetSchools
          .map((school) => {
            const fit = cached.get(school.id)
            return fit
              ? { school, score: fit.overallFitScore, percentile: fit.percentileRank }
              : null
          })
          .filter((r): r is { school: School; score: number; percentile: number } => r !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        setBestFitSchools(top3)
        return
      }

      // L2 — Supabase DB
      const dbResults = await loadSchoolFitsFromDB(selectedNarrative.title, schoolIds)
      if (Object.keys(dbResults).length === schoolIds.length) {
        const dbMap = new Map<string, SchoolFit>(Object.entries(dbResults))
        // Back-populate L1
        writeSchoolFitCache(selectedNarrative.id, schoolIds, dbMap)
        const top3 = profile.targetSchools
          .map((school) => {
            const fit = dbMap.get(school.id)
            return fit
              ? { school, score: fit.overallFitScore, percentile: fit.percentileRank }
              : null
          })
          .filter((r): r is { school: School; score: number; percentile: number } => r !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        setBestFitSchools(top3)
        return
      }

      // L3 — OpenAI (both L1 and L2 missed)
      setBestFitLoading(true)
      setBestFitError(null)

      try {
        const results = await Promise.all(
          profile.targetSchools.map(async (school) => {
            const fit = await analyzeSchoolFitAction(selectedNarrative, school.name, profile)
            const schoolFit: SchoolFit = {
              schoolId: school.id,
              narrativeId: selectedNarrative.id,
              traitMatch: fit.traitMatch,
              overallFitScore: fit.overallFitScore,
              percentileRank: fit.percentileRank,
              collegeValues: fit.collegeValues,
              strengths: fit.strengths,
              improvements: fit.improvements,
            }
            return { school, fit: schoolFit }
          })
        )

        // Write to L1 + L2 in parallel
        const fitsMap = new Map<string, SchoolFit>()
        results.forEach(({ school, fit: sf }) => fitsMap.set(school.id, sf))
        writeSchoolFitCache(selectedNarrative.id, schoolIds, fitsMap)
        saveSchoolFitsToDB(
          selectedNarrative.title,
          results.map(({ school, fit: sf }) => ({ schoolId: school.id, schoolName: school.name, fit: sf }))
        ).catch((e) => console.error('Failed to persist school fits:', e))

        const top3 = results
          .map(({ school, fit: sf }) => ({ school, score: sf.overallFitScore, percentile: sf.percentileRank }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        setBestFitSchools(top3)
      } catch {
        setBestFitError('Unable to load best-fit schools right now.')
      } finally {
        setBestFitLoading(false)
      }
    }

    loadBestFits()
  }, [selectedNarrative, profile.targetSchools])

  // Reconsider suggestions: load from DB first, then fill gaps with OpenAI.
  // New results are immediately persisted to DB so future visits skip OpenAI.
  useEffect(() => {
    const loadReconsiderSuggestions = async () => {
      if (!selectedNarrative) return

      // 1. Load any already-persisted suggestions from Supabase
      const persisted = await loadReconsiderSuggestionsAction(selectedNarrative.title)
      if (Object.keys(persisted).length > 0) {
        setReconsiderSuggestions((prev) => {
          const merged = new Map(prev)
          for (const [activityId, suggestion] of Object.entries(persisted)) {
            const key = `${selectedNarrative.id}-${activityId}`
            merged.set(key, { activityId, suggestion, loading: false, error: null })
            suggestionsLoadedRef.current.add(key)
          }
          return merged
        })
      }

      // 2. Generate with OpenAI only for activities not yet in DB
      for (const activity of selectedNarrative.recommendedDrops) {
        const suggestionKey = `${selectedNarrative.id}-${activity.id}`
        if (suggestionsLoadedRef.current.has(suggestionKey)) continue

        // Mark as loading
        setReconsiderSuggestions((prev) =>
          new Map(prev).set(suggestionKey, { activityId: activity.id, suggestion: '', loading: true, error: null })
        )

        try {
          const suggestion = await generateReconsiderSuggestionAction(
            activity,
            selectedNarrative,
            profile.activities
          )
          suggestionsLoadedRef.current.add(suggestionKey)
          setReconsiderSuggestions((prev) =>
            new Map(prev).set(suggestionKey, { activityId: activity.id, suggestion, loading: false, error: null })
          )
          // Persist so future visits are instant
          await saveReconsiderSuggestionAction(selectedNarrative.title, activity.id, suggestion)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to generate suggestion'
          suggestionsLoadedRef.current.add(suggestionKey)
          setReconsiderSuggestions((prev) =>
            new Map(prev).set(suggestionKey, { activityId: activity.id, suggestion: '', loading: false, error: errorMsg })
          )
        }
      }
    }

    loadReconsiderSuggestions()
  }, [selectedNarrative])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-bold text-black mb-2">Your Narrative Spikes</h2>
        <p className="text-gray-700">
          We found 3 distinct narratives in your activities. Pick one to optimize your essays for each school.
        </p>
      </div>

      {/* Toggle */}
      <label className="flex items-center gap-3 text-black">
        <input
          type="checkbox"
          checked={showOnlyRelevant}
          onChange={(e) => setShowOnlyRelevant(e.target.checked)}
          className="w-4 h-4"
        />
        Show only narrative-relevant activities
      </label>

      {/* Narratives Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {narratives.map((narrative, idx) => (
          <motion.div
            key={narrative.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <NarrativeCard
              narrative={narrative}
              profile={profile}
              isSelected={selectedId === narrative.id}
              onSelect={() => handleSelect(narrative)}
              showOnlyRelevant={showOnlyRelevant}
            />
          </motion.div>
        ))}
      </div>

      {/* Comparison View */}
      {selectedId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-black mb-4">Detailed Analysis</h3>
          {narratives.map((n) => (
            selectedId === n.id && (
              <div key={n.id} className="space-y-6">
                <div>
                  <h4 className="font-semibold text-black mb-2">Core Theme</h4>
                  <p className="text-gray-700">{n.theme}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">Best-fit schools for this narrative</h4>
                  {bestFitLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="h-11 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : bestFitError ? (
                    <p className="text-red-600">{bestFitError}</p>
                  ) : bestFitSchools.length > 0 ? (
                    <div className="space-y-2">
                      {bestFitSchools.map((result) => (
                        <div key={result.school.id} className="flex items-center justify-between text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="font-medium">{result.school.name}</div>
                          <div className="text-sm text-gray-600">
                            {result.score}% fit • {result.percentile}th percentile
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No target schools found.</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">Supporting Activities</h4>
                  <div className="space-y-2">
                    {n.supportingActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-600 mt-1">✓</span>
                        <span>{activity.name} ({activity.role || 'Participant'})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">Gaps to Address</h4>
                  <ul className="space-y-1 text-gray-700">
                    {n.gaps.map((gap, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-red-600">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">Activities to reconsider or rewrite</h4>
                  {n.recommendedDrops.length > 0 ? (
                    <ul className="space-y-2 text-gray-700">
                      {n.recommendedDrops.map((activity) => {
                        const suggestionKey = `${n.id}-${activity.id}`
                        const suggestionData = reconsiderSuggestions.get(suggestionKey)
                        
                        return (
                          <li key={activity.id} className="flex flex-col gap-1">
                            <div className="flex gap-2 items-start">
                              <span className="text-yellow-600">⚠</span>
                              <span className="font-medium">{activity.name}</span>
                            </div>
                            <div className="text-sm text-gray-600 ml-6">
                              {!suggestionData || suggestionData.loading ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 bg-gray-300 rounded-full animate-pulse" />
                                  <span className="text-gray-500">Generating personalized suggestion...</span>
                                </div>
                              ) : suggestionData.error ? (
                                <p className="text-orange-600">{suggestionData.error}</p>
                              ) : (
                                <p>{suggestionData.suggestion}</p>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No activities dilute this narrative</p>
                  )}
                </div>
              </div>
            )
          ))}
        </motion.div>
      )}
    </div>
  )
}
