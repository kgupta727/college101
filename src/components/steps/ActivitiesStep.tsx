'use client'

import { useMemo, useState } from 'react'
import { StudentProfile, Activity, ActivityTag } from '@/types'
import { Button } from '../ui/button'
import { X, Plus, Upload, BarChart3, Sparkles, NotebookPen, Wand2, Edit2 } from 'lucide-react'

interface ActivitiesStepProps {
  profile: StudentProfile
  updateProfile: (updates: Partial<StudentProfile>) => void
}

const ACTIVITY_TAGS: ActivityTag[] = ['STEM', 'Arts', 'Leadership', 'Community Service', 'Athletics', 'Academic']

const QUICK_TEMPLATES: Activity[] = [
  {
    id: 'tmpl-research',
    name: 'Summer Research Lab',
    role: 'Research Assistant',
    hoursPerWeek: 15,
    yearsInvolved: 1,
    tags: ['STEM', 'Academic'],
    description: 'Worked with PI on data collection, built scripts to clean data, co-authored poster.',
  },
  {
    id: 'tmpl-service',
    name: 'Community STEM Tutoring',
    role: 'Founder',
    hoursPerWeek: 6,
    yearsInvolved: 2,
    tags: ['Community Service', 'Leadership', 'STEM'],
    description: 'Launched free after-school program; recruited volunteers and tracked student outcomes.',
  },
  {
    id: 'tmpl-arts',
    name: 'Jazz Ensemble',
    role: 'Section Lead',
    hoursPerWeek: 5,
    yearsInvolved: 3,
    tags: ['Arts', 'Leadership'],
    description: 'Arranged pieces, mentored new members, organized performances.',
  },
]

export default function ActivitiesStep({ profile, updateProfile }: ActivitiesStepProps) {
  const [activityName, setActivityName] = useState('')
  const [activityRole, setActivityRole] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('')
  const [yearsInvolved, setYearsInvolved] = useState('')
  const [selectedTags, setSelectedTags] = useState<ActivityTag[]>([])
  const [description, setDescription] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editActivityName, setEditActivityName] = useState('')
  const [editActivityRole, setEditActivityRole] = useState('')
  const [editActivityHours, setEditActivityHours] = useState('')
  const [editActivityYears, setEditActivityYears] = useState('')
  const [editActivityTags, setEditActivityTags] = useState<ActivityTag[]>([])
  const [editActivityDescription, setEditActivityDescription] = useState('')

  const activityStats = useMemo(() => {
    const total = profile.activities.length
    const totalHours = profile.activities.reduce((acc, curr) => acc + (curr.hoursPerWeek || 0), 0)
    const avgYears = profile.activities.length
      ? profile.activities.reduce((acc, curr) => acc + (curr.yearsInvolved || 0), 0) / profile.activities.length
      : 0
    const tagBreakdown = ACTIVITY_TAGS.map((tag) => ({
      tag,
      count: profile.activities.filter((a) => a.tags.includes(tag)).length,
    }))

    return { total, totalHours, avgYears, tagBreakdown }
  }, [profile.activities])

  const addActivity = () => {
    if (!activityName.trim()) return

    const newActivity: Activity = {
      id: Date.now().toString(),
      name: activityName,
      role: activityRole || undefined,
      hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek) : undefined,
      yearsInvolved: yearsInvolved ? parseInt(yearsInvolved) : undefined,
      tags: selectedTags,
      description: description || undefined,
    }

    updateProfile({
      activities: [...profile.activities, newActivity],
    })

    // Reset form
    setActivityName('')
    setActivityRole('')
    setHoursPerWeek('')
    setYearsInvolved('')
    setSelectedTags([])
    setDescription('')
  }

  const removeActivity = (id: string) => {
    updateProfile({
      activities: profile.activities.filter((a) => a.id !== id),
    })
  }

  const startEditActivity = (activity: Activity) => {
    setEditingActivityId(activity.id)
    setEditActivityName(activity.name)
    setEditActivityRole(activity.role || '')
    setEditActivityHours(activity.hoursPerWeek ? activity.hoursPerWeek.toString() : '')
    setEditActivityYears(activity.yearsInvolved ? activity.yearsInvolved.toString() : '')
    setEditActivityTags(activity.tags)
    setEditActivityDescription(activity.description || '')
  }

  const saveEditActivity = () => {
    if (!editingActivityId) return
    
    const updatedActivities = profile.activities.map(a =>
      a.id === editingActivityId
        ? {
            ...a,
            name: editActivityName,
            role: editActivityRole || undefined,
            hoursPerWeek: editActivityHours ? parseInt(editActivityHours) : undefined,
            yearsInvolved: editActivityYears ? parseInt(editActivityYears) : undefined,
            tags: editActivityTags,
            description: editActivityDescription || undefined,
          }
        : a
    )
    
    updateProfile({ activities: updatedActivities })
    setEditingActivityId(null)
  }

  const cancelEditActivity = () => {
    setEditingActivityId(null)
  }

  const applyTemplate = (template: Activity) => {
    const newActivity = { ...template, id: Date.now().toString() }
    updateProfile({ activities: [...profile.activities, newActivity] })
  }

  const parseBulkInput = () => {
    const lines = bulkInput.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) return

    const parsed: Activity[] = lines.map((line) => {
      // Format: Name | Role | hours/week | years | tags comma | description
      const [name, role, hours, years, tags, desc] = line.split('|').map((item) => item?.trim() || '')
      return {
        id: `${Date.now()}-${Math.random()}`,
        name: name || 'Untitled activity',
        role: role || undefined,
        hoursPerWeek: hours ? parseInt(hours) : undefined,
        yearsInvolved: years ? parseInt(years) : undefined,
        tags: tags ? (tags.split(',').map((t) => t.trim()).filter(Boolean) as ActivityTag[]) : [],
        description: desc || undefined,
      }
    })

    updateProfile({ activities: [...profile.activities, ...parsed] })
    setBulkInput('')
  }

  const toggleTag = (tag: ActivityTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Upload your activities + stats</h2>
          <p className="text-gray-700 max-w-2xl">
            Paste everything you have: clubs, jobs, research, competitions, sports, music, volunteering. We will turn the messy list into coherent story "spikes."
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600">Quality goal</p>
            <p className="text-sm font-semibold text-black">≥ 8 strong activities across 3 themes</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-lg">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Single activity</p>
            <h3 className="text-lg font-semibold text-slate-900">Add an activity with structured stats</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className="group flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800 hover:-translate-y-0.5 hover:shadow-md transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span className="text-left leading-tight">Quick add: {tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-black font-medium mb-2">Activity Name *</label>
          <input
            type="text"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="e.g., Science Olympiad, Debate Team, Research Project"
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-black font-medium mb-2">Your Role</label>
            <input
              type="text"
              value={activityRole}
              onChange={(e) => setActivityRole(e.target.value)}
              placeholder="e.g., Captain, President"
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-black font-medium mb-2">Hours/Week</label>
            <input
              type="number"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
              placeholder="10"
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-black font-medium mb-2">Years Involved</label>
            <input
              type="number"
              value={yearsInvolved}
              onChange={(e) => setYearsInvolved(e.target.value)}
              placeholder="2"
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-black font-medium mb-2">Tags (select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-black font-medium mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What impact did you make? What did you learn?"
            rows={3}
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={addActivity}
            disabled={!activityName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>

          <button
            onClick={parseBulkInput}
            disabled={!bulkInput.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-500 text-white py-2.5 text-sm font-semibold hover:bg-blue-600 disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            Import pasted list
          </button>
        </div>
      </div>

      {/* Bulk paste */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Bulk paste</p>
            <h3 className="text-lg font-semibold text-black">Drop a whole list at once</h3>
            <p className="text-gray-600 text-sm">Format: Name | Role | hours/week | years | tags comma-separated | description</p>
          </div>
          <div className="flex items-center gap-2 text-black text-sm bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
            <NotebookPen className="w-4 h-4 text-blue-600" />
            <span>Example: Debate Team | Captain | 8 | 3 | Leadership,Academic | Led case writing</span>
          </div>
        </div>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          rows={4}
          placeholder={`Debate Team | Captain | 8 | 3 | Leadership,Academic | Led case writing\nHospital Volunteering | Volunteer | 4 | 2 | Community Service | Assisted patient transport`}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Wand2 className="w-4 h-4" />
          Paste from resume / spreadsheet and click “Import pasted list” above.
        </div>
      </div>

      {/* Snapshot cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total activities</p>
          <p className="text-2xl font-semibold text-black">{activityStats.total}</p>
          <p className="text-xs text-gray-600">Aim for 8-12 polished entries</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Hours per week</p>
          <p className="text-2xl font-semibold text-black">{activityStats.totalHours}h</p>
          <p className="text-xs text-gray-600">Shows workload and intensity</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Avg years</p>
          <p className="text-2xl font-semibold text-black">{activityStats.avgYears.toFixed(1)}</p>
          <p className="text-xs text-gray-600">Longevity strengthens spikes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Tag coverage</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {activityStats.tagBreakdown.map((t) => (
              <span key={t.tag} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-900 border border-blue-300">
                {t.tag}: {t.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Activities List */}
      {profile.activities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Inventory</p>
              <h3 className="text-lg font-semibold text-black">Your activities ({profile.activities.length})</h3>
            </div>
            <p className="text-xs text-gray-600">Sorted newest first</p>
          </div>
          <div className="space-y-3">
            {[...profile.activities].reverse().map((activity) => (
              <div key={activity.id}>
                {editingActivityId === activity.id ? (
                  // Edit mode
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-3">
                    <input
                      type="text"
                      value={editActivityName}
                      onChange={(e) => setEditActivityName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Activity name"
                    />
                    <input
                      type="text"
                      value={editActivityRole}
                      onChange={(e) => setEditActivityRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Role (e.g., President, Team Lead)"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={editActivityHours}
                        onChange={(e) => setEditActivityHours(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Hours per week"
                        min="0"
                      />
                      <input
                        type="number"
                        value={editActivityYears}
                        onChange={(e) => setEditActivityYears(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Years involved"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {ACTIVITY_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            setEditActivityTags(
                              editActivityTags.includes(tag)
                                ? editActivityTags.filter((t) => t !== tag)
                                : [...editActivityTags, tag]
                            )
                          }
                          className={`px-3 py-1 text-xs rounded border transition-colors ${
                            editActivityTags.includes(tag)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editActivityDescription}
                      onChange={(e) => setEditActivityDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Description of accomplishments"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditActivity}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditActivity}
                        className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start shadow-sm">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-black font-semibold text-base">{activity.name}</h4>
                        {activity.role && <span className="text-gray-600 text-sm">{activity.role}</span>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {activity.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-900 text-xs rounded border border-blue-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-gray-600 text-xs flex items-center gap-3 flex-wrap">
                        {activity.hoursPerWeek ? <span>{activity.hoursPerWeek}h/week</span> : <span className="text-gray-500">Add hours</span>}
                        <span className="text-gray-400">•</span>
                        {activity.yearsInvolved ? <span>{activity.yearsInvolved} year(s)</span> : <span className="text-gray-500">Add years</span>}
                      </div>
                      {activity.description && (
                        <p className="text-gray-700 text-sm leading-relaxed">{activity.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => startEditActivity(activity)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        aria-label={`Edit ${activity.name}`}
                        title="Edit activity"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => removeActivity(activity.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove ${activity.name}`}
                        title="Delete activity"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
