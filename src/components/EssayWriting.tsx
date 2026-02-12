'use client'

import { useEffect, useState } from 'react'
import { StudentProfile } from '@/types'
import { FileText, Plus, Trash2, Star, StarOff, Save, ChevronDown, ChevronRight } from 'lucide-react'

interface EssayDraft {
  id: string
  essay_type: 'common_app' | 'supplement'
  college_id: string | null
  supplement_id: string | null
  version_number: number
  title: string | null
  content: string
  word_count: number
  is_primary: boolean
  notes: string | null
  common_app_prompt_number: number | null
  college?: { id: string; name: string } | null
  supplement?: {
    id: string
    prompt: string
    word_limit: number
    prompt_type: string
  } | null
  updated_at: string
}

const COMMON_APP_PROMPTS = [
  {
    number: 1,
    prompt: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story."
  },
  {
    number: 2,
    prompt: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?"
  },
  {
    number: 3,
    prompt: "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?"
  },
  {
    number: 4,
    prompt: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?"
  },
  {
    number: 5,
    prompt: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others."
  },
  {
    number: 6,
    prompt: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?"
  },
  {
    number: 7,
    prompt: "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design."
  }
]

interface Supplement {
  id: string
  prompt: string
  word_limit: number
  prompt_type: string
}

interface College {
  id: string
  name: string
  supplements: Supplement[]
}

export default function EssayWritingPage({ profile }: { profile: StudentProfile }) {
  const [colleges, setColleges] = useState<College[]>([])
  const [drafts, setDrafts] = useState<EssayDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDraft, setActiveDraft] = useState<EssayDraft | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    commonApp: true,
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load colleges and their supplements
    if (profile.targetSchools && profile.targetSchools.length > 0) {
      const collegesData: College[] = []
      
      for (const school of profile.targetSchools) {
        const collegeId = typeof school === 'string' ? school : school.id
        const collegeName = typeof school === 'string' ? school : school.name
        
        // Fetch supplements for this college
        const response = await fetch(`/api/colleges/${collegeId}/supplements`)
        if (response.ok) {
          const { supplements } = await response.json()
          collegesData.push({
            id: collegeId,
            name: collegeName,
            supplements: supplements || [],
          })
        } else {
          // College exists but has no supplements
          collegesData.push({
            id: collegeId,
            name: collegeName,
            supplements: [],
          })
        }
      }
      
      setColleges(collegesData)
    }
    
    // Load existing drafts
    const draftsResponse = await fetch('/api/essays')
    if (draftsResponse.ok) {
      const { drafts: loadedDrafts } = await draftsResponse.json()
      setDrafts(loadedDrafts)
      
      // Auto-create Common App draft if missing
      const hasCommonApp = loadedDrafts.some((d: EssayDraft) => d.essay_type === 'common_app')
      if (!hasCommonApp) {
        await createDraft('common_app')
      }
    }
    
    setLoading(false)
  }

  const createDraft = async (
    essay_type: 'common_app' | 'supplement',
    college_id?: string,
    supplement_id?: string
  ) => {
    const response = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essay_type,
        college_id,
        supplement_id,
        content: '',
        is_primary: true,
        title: 'Version 1',
      }),
    })

    if (response.ok) {
      const { draft } = await response.json()
      // Reload drafts to get the full data with joins
      await loadDrafts()
      
      // Find the newly created draft from the reloaded drafts (which has supplement data)
      const reloadResponse = await fetch('/api/essays')
      if (reloadResponse.ok) {
        const { drafts: reloadedDrafts } = await reloadResponse.json()
        const newDraft = reloadedDrafts.find((d: EssayDraft) => d.id === draft.id)
        setActiveDraft(newDraft || draft)
        setDrafts(reloadedDrafts)
      }
      
      return draft
    }
  }

  const loadDrafts = async () => {
    const response = await fetch('/api/essays')
    if (response.ok) {
      const { drafts: loadedDrafts } = await response.json()
      setDrafts(loadedDrafts)
    }
  }

  const getDraftsForSupplement = (collegeId: string, supplementId: string) => {
    return drafts.filter(
      d => d.college_id === collegeId && d.supplement_id === supplementId
    )
  }

  const getCommonAppDrafts = () => {
    return drafts.filter(d => d.essay_type === 'common_app')
  }

  const selectOrCreateDraft = async (
    essay_type: 'common_app' | 'supplement',
    college_id?: string,
    supplement_id?: string
  ) => {
    // Find existing drafts
    let existingDrafts: EssayDraft[]
    if (essay_type === 'common_app') {
      existingDrafts = getCommonAppDrafts()
    } else {
      existingDrafts = getDraftsForSupplement(college_id!, supplement_id!)
    }

    if (existingDrafts.length > 0) {
      // Use primary draft or first one
      const primaryDraft = existingDrafts.find(d => d.is_primary) || existingDrafts[0]
      setActiveDraft(primaryDraft)
    } else {
      // Create new draft
      await createDraft(essay_type, college_id, supplement_id)
    }
  }

  const saveDraft = async (draft: EssayDraft) => {
    setSaving(true)
    const response = await fetch(`/api/essays/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: draft.content,
        title: draft.title,
        notes: draft.notes,
        is_primary: draft.is_primary,
        common_app_prompt_number: draft.common_app_prompt_number,
      }),
    })

    if (response.ok) {
      setLastSaved(new Date())
      await loadDrafts()
    }
    setSaving(false)
  }

  const createNewVersion = async (
    essay_type: 'common_app' | 'supplement',
    college_id?: string,
    supplement_id?: string
  ) => {
    const response = await fetch('/api/essays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essay_type,
        college_id,
        supplement_id,
        content: '',
        is_primary: false,
      }),
    })

    if (response.ok) {
      const { draft } = await response.json()
      await loadDrafts()
      setActiveDraft(draft)
    }
  }

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Delete this draft? This cannot be undone.')) return

    const response = await fetch(`/api/essays/${draftId}`, { method: 'DELETE' })
    if (response.ok) {
      await loadDrafts()
      if (activeDraft?.id === draftId) {
        setActiveDraft(null)
      }
    }
  }

  const togglePrimary = async (draft: EssayDraft) => {
    await saveDraft({ ...draft, is_primary: !draft.is_primary })
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-slate-500">Loading essays...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Essay Library</h1>
          <p className="text-slate-600 mt-2">
            All your college essays in one place. Create multiple versions and keep everything organized.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Essay Navigation */}
          <div className="col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="space-y-2">
                {/* Common App Section */}
                <div className="space-y-2">
                  <button
                    onClick={() => selectOrCreateDraft('common_app')}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-900">Common App Essay</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {getCommonAppDrafts().length} {getCommonAppDrafts().length === 1 ? 'draft' : 'drafts'}
                    </span>
                  </button>
                </div>

                {/* College Supplements */}
                {colleges.map((college) => (
                  <div key={college.id} className="space-y-2">
                    <button
                      onClick={() => toggleSection(college.id)}
                      className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors"
                      title={college.name}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {expandedSections[college.id] ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900 text-sm truncate">{college.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{college.supplements.length}</span>
                    </button>

                    {expandedSections[college.id] && (
                      <div className="ml-6 space-y-2">
                        {college.supplements.length === 0 ? (
                          <div className="text-xs text-slate-500 px-2 py-1">No supplements available</div>
                        ) : (
                          college.supplements.map((supplement) => {
                            const supplementDrafts = getDraftsForSupplement(college.id, supplement.id)
                            return (
                              <button
                                key={supplement.id}
                                onClick={() => selectOrCreateDraft('supplement', college.id, supplement.id)}
                                className="w-full text-left p-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                              >
                                <div className="font-medium text-slate-700">
                                  {supplement.prompt_type.charAt(0).toUpperCase() + supplement.prompt_type.slice(1)}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {supplement.word_limit} words • {supplementDrafts.length} {supplementDrafts.length === 1 ? 'draft' : 'drafts'}
                                </div>
                                <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {supplement.prompt}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="col-span-8">
            {activeDraft ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={activeDraft.title || ''}
                      onChange={(e) => setActiveDraft({ ...activeDraft, title: e.target.value })}
                      placeholder={`Version ${activeDraft.version_number}`}
                      className="text-xl font-semibold text-slate-900 bg-transparent border-none outline-none w-full"
                    />
                    
                    {/* Common App Prompt Selector */}
                    {activeDraft.essay_type === 'common_app' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Which Common App prompt are you answering?
                        </label>
                        <select
                          value={activeDraft.common_app_prompt_number || ''}
                          onChange={(e) => setActiveDraft({ 
                            ...activeDraft, 
                            common_app_prompt_number: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a prompt...</option>
                          {COMMON_APP_PROMPTS.map((p) => (
                            <option key={p.number} value={p.number}>
                              Prompt {p.number}
                            </option>
                          ))}
                        </select>
                        {activeDraft.common_app_prompt_number && (
                          <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-700 italic">
                              {COMMON_APP_PROMPTS.find(p => p.number === activeDraft.common_app_prompt_number)?.prompt}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Word limit: 650</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeDraft.supplement && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700 italic">{activeDraft.supplement.prompt}</p>
                        <p className="text-xs text-slate-500 mt-1">Word limit: {activeDraft.supplement.word_limit}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => togglePrimary(activeDraft)}
                      className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
                      title={activeDraft.is_primary ? 'Remove from primary' : 'Mark as primary version'}
                    >
                      {activeDraft.is_primary ? (
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteDraft(activeDraft.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-600"
                      title="Delete draft"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Editor */}
                <div>
                  <textarea
                    value={activeDraft.content}
                    onChange={(e) => setActiveDraft({ ...activeDraft, content: e.target.value })}
                    placeholder="Start writing your essay here..."
                    className="w-full min-h-[500px] p-4 text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>
                      {activeDraft.content.trim().split(/\s+/).filter(w => w.length > 0).length} words
                      {activeDraft.supplement?.word_limit && (
                        <span className={
                          activeDraft.content.trim().split(/\s+/).filter(w => w.length > 0).length > activeDraft.supplement.word_limit
                            ? 'text-rose-600 font-medium ml-1'
                            : 'text-slate-500 ml-1'
                        }>
                          / {activeDraft.supplement.word_limit}
                        </span>
                      )}
                    </span>
                    {lastSaved && (
                      <span className="text-slate-400">
                        Saved {new Date(lastSaved).toLocaleTimeString()} ago
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => saveDraft(activeDraft)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Notes */}
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                  <textarea
                    value={activeDraft.notes || ''}
                    onChange={(e) => setActiveDraft({ ...activeDraft, notes: e.target.value })}
                    placeholder="Add notes about this version..."
                    className="w-full p-3 text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Select an essay to start writing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
