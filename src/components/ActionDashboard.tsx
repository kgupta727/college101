'use client'

import { Narrative, StudentProfile } from '@/types'
import { useState } from 'react'
import { Button } from './ui/button'
import { Download, CheckCircle, Circle, CalendarCheck, Sparkles } from 'lucide-react'

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
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Action plan</p>
          <h2 className="text-3xl font-semibold text-slate-900 mb-1">Your next 90 days</h2>
          <p className="text-slate-600">
            {narrative.title} • {monthsRemaining} months to deadline
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Export plan
        </Button>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <CalendarCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-xl font-semibold text-slate-900">Timeline & milestones</h3>
        </div>
        <div className="space-y-4">
          {months.slice(0, monthsRemaining).map((month) => (
            <div
              key={month.num}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Month {month.num} of {monthsRemaining}</h4>
                <span className="text-xs text-slate-500">3 tasks</span>
              </div>
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
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={`transition-colors ${
                        completedMilestones.has(`${month.num}-${idx}`)
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800'
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
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-[0_18px_40px_rgba(244,63,94,0.08)] space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h3 className="text-xl font-semibold text-slate-900">Activities to prune</h3>
          </div>
          <div className="space-y-3">
            {narrative.recommendedDrops.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <span className="text-rose-500 text-lg">⚠</span>
                <div>
                  <p className="text-slate-900 font-medium">{activity.name}</p>
                  <p className="text-sm text-slate-600">
                    {activity.hoursPerWeek}h/week • Dilutes narrative focus
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Essay Strategy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] space-y-4">
        <h3 className="text-xl font-semibold text-slate-900">Essay writing schedule</h3>
        <div className="space-y-3">
          {schoolSpecificEssays.map((essay, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-slate-900 font-semibold">{essay.school}</h4>
                <span className="text-xs text-slate-500">Due in {essay.dueDate}</span>
              </div>
              <p className="text-slate-700 text-sm mb-3">{essay.prompt}</p>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded text-emerald-700 text-sm">
                <strong>Narrative alignment:</strong> Emphasize how{' '}
                <em>{narrative.title}</em> demonstrates the traits{' '}
                {essay.school} values most.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100 rounded-2xl p-6 space-y-3 shadow-[0_18px_40px_rgba(16,185,129,0.12)]">
        <h4 className="text-lg font-semibold text-slate-900">Your 30-day action plan</h4>
        <p className="text-slate-700 text-sm leading-relaxed">
          {narrative.actionPlan}
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] space-y-4">
        <h3 className="text-xl font-semibold text-slate-900">Next steps</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="font-semibold text-slate-900 mb-2">✓ Immediate</p>
            <p className="text-slate-700 text-sm">
              Start the 30-day action plan. Track progress weekly.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="font-semibold text-slate-900 mb-2">📧 Follow up</p>
            <p className="text-slate-700 text-sm">
              Revisit this plan monthly. Update as your narrative evolves.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-6 text-center text-slate-500 text-sm">
        <p>
          Remember: Your narrative should showcase genuine interests, not what you think colleges want to hear.
        </p>
      </div>
    </div>
  )
}
