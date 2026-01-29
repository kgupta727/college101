'use client'

import { Narrative, StudentProfile } from '@/types'
import { useState } from 'react'
import { Button } from './ui/button'
import { Download, CheckCircle, Circle } from 'lucide-react'

interface ActionDashboardProps {
  narrative: Narrative
  profile: StudentProfile
}

export default function ActionDashboard({
  narrative,
  profile,
}: ActionDashboardProps) {
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set()
  )

  const toggleMilestone = (id: string) => {
    const updated = new Set(completedMilestones)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setCompletedMilestones(updated)
  }

  // Generate timeline based on time to deadline
  const monthsRemaining = profile.constraints.monthsUntilDeadline
  const months = [
    { num: 1, activities: ['Develop "30-day action plan" from narrative', 'Research schools for fit', 'Start essay brainstorming'] },
    { num: 2, activities: ['Deepen existing activities', 'Complete first essay draft', 'Get feedback from teachers'] },
    { num: 3, activities: ['Continue activity engagement', 'Revise essays for each school', 'Practice supplemental questions'] },
  ]

  const activityPruningList = narrative.recommendedDrops

  const schoolSpecificEssays = profile.targetSchools.slice(0, 3).map((school) => ({
    school: school.name,
    prompt: 'Why do you want to attend?',
    dueDate: `${Math.floor(monthsRemaining * 0.7)} weeks`,
  }))

  const handleExportPDF = () => {
    // Simple CSV export for now
    const lines = [
      'college101 - Action Plan Report',
      `Narrative: ${narrative.title}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'TIMELINE',
      ...months.flatMap((m) => [
        `Month ${m.num}:`,
        ...m.activities.map((a) => `  - ${a}`),
      ]),
      '',
      'ACTIVITIES TO CONSIDER DROPPING',
      ...narrative.recommendedDrops.map((a) => a.name),
      '',
      'ESSAY STRATEGY',
      ...schoolSpecificEssays.map((s) => `${s.school}: ${s.prompt} (${s.dueDate})`),
    ]

    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `college101-action-plan-${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-700 pb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Your Action Plan</h2>
        <p className="text-slate-300">
          {narrative.title} • {monthsRemaining} months to deadline
        </p>
      </div>

      {/* Export Button */}
      <Button
        onClick={handleExportPDF}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Export Plan
      </Button>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Timeline & Milestones</h3>
        <div className="space-y-4">
          {months.slice(0, monthsRemaining).map((month) => (
            <div
              key={month.num}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6"
            >
              <h4 className="font-semibold text-white mb-4">
                Month {month.num} of {monthsRemaining}
              </h4>
              <div className="space-y-3">
                {month.activities.map((activity, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <button
                      onClick={() =>
                        toggleMilestone(`${month.num}-${idx}`)
                      }
                      className="flex-shrink-0 transition-transform group-hover:scale-110"
                    >
                      {completedMilestones.has(`${month.num}-${idx}`) ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <span
                      className={`transition-colors ${
                        completedMilestones.has(`${month.num}-${idx}`)
                          ? 'text-slate-500 line-through'
                          : 'text-slate-200'
                      }`}
                    >
                      {activity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Pruning */}
      {narrative.recommendedDrops.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">
            Activities to Consider Pruning
          </h3>
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-6 space-y-3">
            {narrative.recommendedDrops.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <span className="text-red-400 text-lg">⚠</span>
                <div>
                  <p className="text-white font-medium">{activity.name}</p>
                  <p className="text-sm text-slate-300">
                    {activity.hoursPerWeek}h/week • Dilutes narrative focus
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Essay Strategy */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Essay Writing Schedule</h3>
        <div className="space-y-3">
          {schoolSpecificEssays.map((essay, idx) => (
            <div
              key={idx}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-semibold">{essay.school}</h4>
                <span className="text-xs text-slate-400">Due in {essay.dueDate}</span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{essay.prompt}</p>
              <div className="bg-blue-600/20 border border-blue-400/30 p-3 rounded text-blue-200 text-sm">
                <strong>Narrative alignment:</strong> Emphasize how{' '}
                <em>{narrative.title}</em> demonstrates the traits{' '}
                {essay.school} values most.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan Summary */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-400/30 rounded-lg p-6 space-y-3">
        <h4 className="text-lg font-bold text-emerald-200">Your 30-Day Action Plan</h4>
        <p className="text-slate-200 text-sm leading-relaxed">
          {narrative.actionPlan}
        </p>
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Next Steps</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <p className="font-semibold text-white mb-2">✓ Immediate</p>
            <p className="text-slate-300 text-sm">
              Start the 30-day action plan. Track progress weekly.
            </p>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <p className="font-semibold text-white mb-2">📧 Follow Up</p>
            <p className="text-slate-300 text-sm">
              Revisit this plan monthly. Update as your narrative evolves.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 pt-6 text-center text-slate-400 text-sm">
        <p>
          Remember: Your narrative should showcase genuine interests, not what you think colleges want to hear.
        </p>
      </div>
    </div>
  )
}
