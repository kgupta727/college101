'use client'

import { useState } from 'react'
import { Narrative, StudentProfile } from '@/types'
import NarrativeCard from './NarrativeCard'
import { motion } from 'framer-motion'

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

  const handleSelect = (narrative: Narrative) => {
    setSelectedId(narrative.id)
    onSelectNarrative(narrative)
  }

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
                  <h4 className="font-semibold text-black mb-2">Activities to Consider Dropping</h4>
                  {n.recommendedDrops.length > 0 ? (
                    <ul className="space-y-1 text-gray-700">
                      {n.recommendedDrops.map((activity) => (
                        <li key={activity.id} className="flex gap-2">
                          <span className="text-yellow-600">⚠</span>
                          <span>{activity.name} - dilutes the narrative</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No activities dilute this narrative</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">30-Day Action Plan</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">{n.actionPlan}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-black mb-2">Recommended Essay Angle</h4>
                  <p className="text-blue-900 bg-blue-50 border border-blue-300 p-3 rounded">
                    {n.essayAngle}
                  </p>
                </div>
              </div>
            )
          ))}
        </motion.div>
      )}
    </div>
  )
}
