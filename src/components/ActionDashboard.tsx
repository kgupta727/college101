'use client'

import { Narrative, StudentProfile, Activity } from '@/types'
import { useState } from 'react'
import { Button } from './ui/button'
import { Download, CheckCircle, Circle, CalendarCheck, Sparkles, Target, Zap, Trash2, Edit2 } from 'lucide-react'
import { getEssayIdeas } from '@/lib/admissions-utils'

interface ActionDashboardProps {
  narrative: Narrative
  profile: StudentProfile
  onProfileUpdate?: (profile: StudentProfile) => void
}

export default function ActionDashboard({
  narrative,
  profile,
  onProfileUpdate,
}: ActionDashboardProps) {
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set()
  )
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editActivityName, setEditActivityName] = useState('')
  const [editActivityHours, setEditActivityHours] = useState(0)
  const [editActivityDescription, setEditActivityDescription] = useState('')

  const toggleMilestone = (id: string) => {
    const updated = new Set(completedMilestones)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setCompletedMilestones(updated)
  }

  const handleEditActivity = (activity: Activity) => {
    setEditingActivityId(activity.id)
    setEditActivityName(activity.name)
    setEditActivityHours(activity.hoursPerWeek || 0)
    setEditActivityDescription(activity.description || '')
  }

  const handleSaveActivity = () => {
    if (!editingActivityId) return
    
    const updatedActivities = profile.activities.map(a =>
      a.id === editingActivityId
        ? { ...a, name: editActivityName, hoursPerWeek: editActivityHours, description: editActivityDescription }
        : a
    )
    
    const updatedProfile = { ...profile, activities: updatedActivities }
    onProfileUpdate?.(updatedProfile)
    setEditingActivityId(null)
  }

  const handleRemoveActivity = (activityId: string) => {
    const updatedActivities = profile.activities.filter(a => a.id !== activityId)
    const updatedProfile = { ...profile, activities: updatedActivities }
    onProfileUpdate?.(updatedProfile)
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

  const essayIdeas = getEssayIdeas(narrative)

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

      {/* Current Activities */}
      {profile.activities.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-slate-400" />
            <h3 className="text-xl font-semibold text-slate-900">Your activities</h3>
          </div>
          <div className="space-y-3">
            {profile.activities.map((activity) => (
              <div key={activity.id}>
                {editingActivityId === activity.id ? (
                  // Edit mode
                  <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                    <input
                      type="text"
                      value={editActivityName}
                      onChange={(e) => setEditActivityName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Activity name"
                    />
                    <input
                      type="number"
                      value={editActivityHours}
                      onChange={(e) => setEditActivityHours(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Hours per week"
                      min="0"
                      max="168"
                    />
                    <textarea
                      value={editActivityDescription}
                      onChange={(e) => setEditActivityDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      placeholder="Activity description (e.g., accomplishments, achievements, impact)"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveActivity}
                        className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingActivityId(null)}
                        className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white/60 hover:bg-white transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{activity.name}</p>
                      <p className="text-sm text-slate-600">
                        {activity.hoursPerWeek}h/week {activity.yearsInvolved ? `• ${activity.yearsInvolved} year${activity.yearsInvolved > 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleEditActivity(activity)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit activity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveActivity(activity.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xl font-semibold text-slate-900">Essay Launch Kits</h3>
        </div>
        
        {/* Essay Ideas */}
        <div className="space-y-4">
          {essayIdeas.map((idea, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-indigo-900 font-semibold mb-1">{idea.title}</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{idea.concept}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-slate-900">{'⚡'.repeat(idea.hardness)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold text-slate-900">{'⭐'.repeat(idea.effectiveness)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-medium text-indigo-600 mb-1">Why it stands out</p>
                <p className="text-sm text-slate-700">{idea.whyItStandsOut}</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3 border border-indigo-100">
                <p className="text-xs font-medium text-indigo-600 mb-2">Starter steps</p>
                <ol className="space-y-1.5 text-sm text-slate-700">
                  {idea.starterSteps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex gap-2">
                      <span className="font-semibold text-indigo-600 flex-shrink-0">{stepIdx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>

        {/* School-Specific Essays */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <h4 className="text-sm font-medium text-slate-600">School-specific supplements</h4>
          {schoolSpecificEssays.map((essay, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="text-slate-900 font-semibold">{essay.school}</h5>
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
