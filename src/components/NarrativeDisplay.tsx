'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Narrative, School, StudentProfile } from '@/types'
import NarrativeCard from './NarrativeCard'
import { motion } from 'framer-motion'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'

interface NarrativeDisplayProps {
  narratives: Narrative[]
  profile: StudentProfile
  onSelectNarrative: (narrative: Narrative) => void
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
  const bestFitCacheRef = useRef(new Map<string, Array<{ school: School; score: number; percentile: number }>>())

  const selectedNarrative = useMemo(
    () => narratives.find((n) => n.id === selectedId) || null,
    [narratives, selectedId]
  )

  const handleSelect = (narrative: Narrative) => {
    setSelectedId(narrative.id)
    onSelectNarrative(narrative)
  }

  const getNarrativeLens = (narrative: Narrative): 'impact' | 'curiosity' | 'values' => {
    const text = `${narrative.title} ${narrative.theme}`.toLowerCase()
    if (text.includes('impact') || text.includes('community') || text.includes('lead')) return 'impact'
    if (text.includes('curiosity') || text.includes('intellectual') || text.includes('question')) return 'curiosity'
    if (text.includes('values') || text.includes('resilien') || text.includes('growth') || text.includes('ethic')) return 'values'
    return 'impact'
  }

  const getReconsiderSuggestion = (activityName: string, narrative: Narrative): string => {
    const lens = getNarrativeLens(narrative)
    if (lens === 'impact') {
      return `Reframe ${activityName} around outcomes: who benefited, what changed, and how you led it.`
    }
    if (lens === 'curiosity') {
      return `Rewrite ${activityName} to highlight the question you pursued, how you explored it, and what surprised you.`
    }
    return `Connect ${activityName} to a value or hard choice—what it revealed about your character.`
  }

  useEffect(() => {
    const loadBestFits = async () => {
      if (!selectedNarrative || profile.targetSchools.length === 0) {
        setBestFitSchools([])
        return
      }

      const cacheKey = `narrative-bestfit-${selectedNarrative.id}-${profile.targetSchools.map(s => s.id).sort().join('-')}`

      const inMemory = bestFitCacheRef.current.get(cacheKey)
      if (inMemory) {
        setBestFitSchools(inMemory)
        return
      }

      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Array<{ school: School; score: number; percentile: number }>
          bestFitCacheRef.current.set(cacheKey, parsed)
          setBestFitSchools(parsed)
          return
        } catch {
          // fall through to recompute
        }
      }

      setBestFitLoading(true)
      setBestFitError(null)

      try {
        const results = await Promise.all(
          profile.targetSchools.map(async (school) => {
            const fit = await analyzeSchoolFitAction(selectedNarrative, school.name)
            return { school, score: fit.overallFitScore, percentile: fit.percentileRank }
          })
        )

        const top = results
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        bestFitCacheRef.current.set(cacheKey, top)
        setBestFitSchools(top)
        localStorage.setItem(cacheKey, JSON.stringify(top))
      } catch (error) {
        setBestFitError('Unable to load best-fit schools right now.')
      } finally {
        setBestFitLoading(false)
      }
    }

    loadBestFits()
  }, [selectedNarrative, profile.targetSchools])

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
                    <p className="text-gray-600">Analyzing fit with your target schools…</p>
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
                      {n.recommendedDrops.map((activity) => (
                        <li key={activity.id} className="flex flex-col gap-1">
                          <div className="flex gap-2 items-start">
                            <span className="text-yellow-600">⚠</span>
                            <span className="font-medium">{activity.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">
                            {getReconsiderSuggestion(activity.name, n)}
                          </p>
                        </li>
                      ))}
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
