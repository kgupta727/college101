'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { StudentProfile, Narrative } from '@/types'
import { selectCommonAppPrompt, generateSchoolEssayStrategy } from '@/lib/essay-strategy'
import { FileText, Plus, Trash2, Star, StarOff, Save, ChevronDown, ChevronRight, Loader2, BookOpen, Lightbulb, Sparkles } from 'lucide-react'

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

interface EssayIdea {
  id: string
  title: string
  idea_text: string
  angle_type: string | null
  risk_level: string | null
  difficulty: string | null
  proof_points: string[]
  uniqueness_rationale: string | null
  created_at: string
}

export default function EssayWritingPage({ profile, narrative }: { profile: StudentProfile; narrative?: Narrative }) {
  const [colleges, setColleges] = useState<College[]>([])
  const [drafts, setDrafts] = useState<EssayDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDraft, setActiveDraft] = useState<EssayDraft | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    commonApp: true,
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [ideas, setIdeas] = useState<EssayIdea[]>([])
  const [ideaContext, setIdeaContext] = useState('')
  const [ideasLoading, setIdeasLoading] = useState(false)
  const [ideasGenerating, setIdeasGenerating] = useState(false)
  const [ideasError, setIdeasError] = useState<string | null>(null)

  // Autosave
  const [isDirty, setIsDirty] = useState(false)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isDirtyRef = useRef(false)
  // Ref to always-current draft so debounce timer isn't stale
  const activeDraftRef = useRef<EssayDraft | null>(null)

  useEffect(() => {
    activeDraftRef.current = activeDraft
  }, [activeDraft])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load colleges and their supplements
    if (profile.targetSchools && profile.targetSchools.length > 0) {
      // Fetch all schools' supplements in parallel
      const collegesData = await Promise.all(
        profile.targetSchools.map(async (school) => {
          const collegeId = typeof school === 'string' ? school : school.id
          const collegeName = typeof school === 'string' ? school : school.name
          const response = await fetch(`/api/colleges/${collegeId}/supplements`)
          if (response.ok) {
            const { supplements } = await response.json()
            return { id: collegeId, name: collegeName, supplements: (supplements || []) as Supplement[] }
          }
          return { id: collegeId, name: collegeName, supplements: [] as Supplement[] }
        })
      )
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
      // POST now returns joined college + supplement data — no extra GET needed
      const { draft } = await response.json()
      setDrafts((prev) => [draft, ...prev])
      setActiveDraft(draft)
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

  /**
   * Silently autosave — called from the 2-second debounce timer.
   * Does not set `saving` state so the UI doesn't show the spinner.
   */
  const autosaveCurrentDraft = useCallback(async (draft: EssayDraft) => {
    if (!draft.id) return
    isDirtyRef.current = false
    setIsDirty(false)
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
      const { draft: savedDraft } = await response.json()
      setLastSaved(new Date())
      const merged = { ...draft, ...savedDraft, college: draft.college, supplement: draft.supplement }
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? merged : d)))
    } else {
      // Re-flag dirty so the manual Save button retries
      isDirtyRef.current = true
      setIsDirty(true)
    }
  }, [])

  // Cancel any pending autosave when switching to a different draft
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
    }
  }, [activeDraft?.id])

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

  useEffect(() => {
    if (!activeDraft) {
      setIdeas([])
      return
    }

    loadIdeas(activeDraft)
  }, [activeDraft?.id, activeDraft?.essay_type, activeDraft?.supplement_id, activeDraft?.common_app_prompt_number])

  const loadIdeas = async (draft: EssayDraft) => {
    setIdeasLoading(true)
    setIdeasError(null)
    setIdeas([])

    if (draft.essay_type === 'common_app' && !draft.common_app_prompt_number) {
      setIdeasLoading(false)
      return
    }

    const params = new URLSearchParams({
      essay_type: draft.essay_type,
    })

    if (draft.essay_type === 'supplement') {
      if (draft.college_id) params.set('college_id', draft.college_id)
      if (draft.supplement_id) params.set('supplement_id', draft.supplement_id)
    } else if (draft.common_app_prompt_number) {
      params.set('common_app_prompt_number', String(draft.common_app_prompt_number))
    }

    const response = await fetch(`/api/essay-ideas?${params.toString()}`)
    if (response.ok) {
      const { ideas: loadedIdeas } = await response.json()
      setIdeas(loadedIdeas)
    } else {
      setIdeasError('Failed to load ideas.')
    }

    setIdeasLoading(false)
  }

  const generateIdeas = async () => {
    if (!activeDraft) return

    if (activeDraft.essay_type === 'common_app' && !activeDraft.common_app_prompt_number) {
      setIdeasError('Select a Common App prompt before generating ideas.')
      return
    }

    setIdeasGenerating(true)
    setIdeasError(null)

    const response = await fetch('/api/essay-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        essay_type: activeDraft.essay_type,
        college_id: activeDraft.college_id,
        supplement_id: activeDraft.supplement_id,
        common_app_prompt_number: activeDraft.common_app_prompt_number,
        user_context: ideaContext.trim() || null,
        // Pass selected narrative so ideas are grounded in the student's chosen angle
        narrative_context: narrative
          ? {
              title: narrative.title,
              theme: narrative.theme,
              essayAngle: narrative.essayAngle ?? null,
              surprisingHook: narrative.surprisingHook ?? null,
            }
          : null,
      }),
    })

    if (response.ok) {
      const { ideas: newIdeas } = await response.json()
      setIdeas(newIdeas)
    } else {
      const data = await response.json().catch(() => null)
      setIdeasError(data?.error || 'Failed to generate ideas.')
    }

    setIdeasGenerating(false)
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
      const { draft: savedDraft } = await response.json()
      setLastSaved(new Date())
      setIsDirty(false)
      isDirtyRef.current = false
      // Optimistic: preserve join data (college, supplement) from local state
      const merged = { ...draft, ...savedDraft, college: draft.college, supplement: draft.supplement }
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? merged : d)))
      setActiveDraft((prev) => (prev?.id === draft.id ? merged : prev))
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
      // POST now returns joined data — no extra GET needed
      const { draft } = await response.json()
      setDrafts((prev) => [draft, ...prev])
      setActiveDraft(draft)
    }
  }

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Delete this draft? This cannot be undone.')) return

    const response = await fetch(`/api/essays/${draftId}`, { method: 'DELETE' })
    if (response.ok) {
      // Remove from state directly — no refetch needed
      setDrafts((prev) => prev.filter((d) => d.id !== draftId))
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
          <div className="mb-8">
            <div className="h-9 w-44 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-80 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="col-span-7">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="h-7 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="h-6 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-12 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Essay Library</h1>
              <p className="text-slate-500 text-sm mt-0.5">All your college essays in one place. Create multiple versions and keep everything organized.</p>
            </div>
            {narrative && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm flex-shrink-0">
                <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-900 font-medium">Writing from:</span>
                <span className="text-amber-800">{narrative.title}</span>
                {narrative.lensKey && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{narrative.lensKey}</span>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-12 divide-x divide-slate-100">
          {/* Sidebar - Essay Navigation */}
          <div className="col-span-2 space-y-4">
            <div className="p-4">
              <div className="space-y-2">
                {/* Common App Section */}
                <div className="space-y-1">
                  <button
                    onClick={() => selectOrCreateDraft('common_app')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      activeDraft?.essay_type === 'common_app' ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-900">Common App Essay</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {getCommonAppDrafts().length} {getCommonAppDrafts().length === 1 ? 'version' : 'versions'}
                    </span>
                  </button>
                  {activeDraft?.essay_type === 'common_app' && (
                    <div className="ml-6 flex flex-wrap gap-1 pb-1">
                      {getCommonAppDrafts().map((draft) => (
                        <button
                          key={draft.id}
                          onClick={() => setActiveDraft(draft)}
                          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            activeDraft?.id === draft.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {draft.title || `v${draft.version_number}`}
                          {draft.is_primary && ' ★'}
                        </button>
                      ))}
                      <button
                        onClick={() => createNewVersion('common_app')}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center gap-0.5"
                        title="Create a new version"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    </div>
                  )}
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
                            const isSupplementActive = activeDraft?.supplement_id === supplement.id && activeDraft?.college_id === college.id
                            return (
                              <div key={supplement.id}>
                                <button
                                  onClick={() => selectOrCreateDraft('supplement', college.id, supplement.id)}
                                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                                    isSupplementActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="font-medium text-slate-700">
                                    {supplement.prompt_type.charAt(0).toUpperCase() + supplement.prompt_type.slice(1)}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {supplement.word_limit} words · {supplementDrafts.length}{supplementDrafts.length === 1 ? ' draft' : ' drafts'}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                                    {supplement.prompt}
                                  </div>
                                </button>
                                {isSupplementActive && (
                                  <div className="mt-1 mx-1 flex flex-wrap gap-1 pb-1">
                                    {supplementDrafts.map((draft) => (
                                      <button
                                        key={draft.id}
                                        onClick={() => setActiveDraft(draft)}
                                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                          activeDraft?.id === draft.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        {draft.title || `v${draft.version_number}`}
                                        {draft.is_primary && ' ★'}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => createNewVersion('supplement', college.id, supplement.id)}
                                      className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center gap-0.5"
                                      title="Create a new version"
                                    >
                                      <Plus className="w-3 h-3" />
                                      New
                                    </button>
                                  </div>
                                )}
                              </div>
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

          {/* Centre — Writing Space */}
          <div className="col-span-7">
            {activeDraft ? (
              <div className="p-6 space-y-4">
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
                    {/* Supplement prompt */}
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
                <textarea
                  value={activeDraft.content}
                  onChange={(e) => {
                    const newContent = e.target.value
                    setActiveDraft({ ...activeDraft, content: newContent })
                    // Autosave: mark dirty, debounce 2 s
                    isDirtyRef.current = true
                    setIsDirty(true)
                    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
                    autosaveTimerRef.current = setTimeout(() => {
                      const current = activeDraftRef.current
                      if (current && isDirtyRef.current) autosaveCurrentDraft(current)
                    }, 2000)
                  }}
                  placeholder="Start writing your essay here..."
                  className="w-full min-h-[520px] p-4 text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

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
                    {isDirty ? (
                      <span className="text-amber-500">● Unsaved changes</span>
                    ) : lastSaved ? (
                      <span className="text-slate-400">Saved {lastSaved.toLocaleTimeString()}</span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => {
                      // Cancel any pending autosave and save immediately
                      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
                      autosaveTimerRef.current = null
                      saveDraft(activeDraft)
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Notes */}
                <div className="pt-2 border-t border-slate-200">
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
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Select an essay to start writing</p>
              </div>
            )}
          </div>

          {/* Right — Strategy + Ideas */}
          <div className="col-span-3 space-y-4 sticky top-8 self-start max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
            {activeDraft ? (
              <>
                {/* Common App Writing Strategy */}
                {activeDraft.essay_type === 'common_app' && narrative && (() => {
                  const rec = selectCommonAppPrompt(narrative)
                  return (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <h5 className="text-sm font-semibold text-amber-900">Writing Strategy</h5>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-amber-700">Strategic Angle</p>
                        <p className="text-sm text-slate-700">{rec.strategicAngle}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-amber-700">Why This Prompt</p>
                        <p className="text-sm text-slate-700">{rec.narrativeConnection}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-emerald-600 mb-1">Emphasize</p>
                          <ul className="space-y-0.5">
                            {rec.whatToEmphasize.map((item, i) => (
                              <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                                <span className="text-emerald-500 flex-shrink-0">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-rose-600 mb-1">Avoid</p>
                          <ul className="space-y-0.5">
                            {rec.whatToAvoid.map((item, i) => (
                              <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                                <span className="text-rose-400 flex-shrink-0">✗</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {narrative.surprisingHook && (
                        <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <p className="text-xs font-medium text-amber-700">Narrative Hook</p>
                          </div>
                          <p className="text-sm text-slate-700 font-medium leading-snug">{narrative.surprisingHook}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Supplement Essay Strategy */}
                {activeDraft.supplement && activeDraft.college_id && narrative && (() => {
                  const school = profile.targetSchools.find(s => s.id === activeDraft.college_id)
                  if (!school) return null
                  const supplementForStrategy = [{
                    id: activeDraft.supplement.id,
                    prompt: activeDraft.supplement.prompt,
                    wordLimit: activeDraft.supplement.word_limit,
                    type: activeDraft.supplement.prompt_type,
                    schoolValues: [] as string[],
                    strategicFocus: '',
                  }]
                  const strategy = generateSchoolEssayStrategy(narrative, school, supplementForStrategy)
                  if (!strategy || strategy.supplements.length === 0) return null
                  const supp = strategy.supplements[0]
                  return (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <h5 className="text-sm font-semibold text-indigo-900">Essay Strategy</h5>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-indigo-700">Strategic Angle</p>
                        <p className="text-sm text-slate-700">{supp.strategicAngle}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-emerald-600 mb-1">Emphasize</p>
                          <ul className="space-y-0.5">
                            {supp.whatToEmphasize.slice(0, 3).map((item, i) => (
                              <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                                <span className="text-emerald-500 flex-shrink-0">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-rose-600 mb-1">Avoid</p>
                          <ul className="space-y-0.5">
                            {supp.whatToAvoid.slice(0, 3).map((item, i) => (
                              <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                                <span className="text-rose-400 flex-shrink-0">✗</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {strategy.overallStrategy && (
                        <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                          <p className="text-xs font-medium text-indigo-700 mb-1">Overall Approach</p>
                          <div className="text-sm text-slate-700 space-y-1.5">
                            {strategy.overallStrategy.split('\n').filter(Boolean).map((line, i) => (
                              <p key={i}>
                                {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                )}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Idea Vault */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Idea Vault</h3>
                      <p className="text-xs text-slate-500">Generate 3-5 niche ideas tailored to your profile.</p>
                    </div>
                    <button
                      onClick={generateIdeas}
                      disabled={ideasGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60"
                    >
                      {ideasGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                      {ideasGenerating ? 'Generating...' : 'Generate ideas'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Add extra context (optional)
                    </label>
                    <textarea
                      value={ideaContext}
                      onChange={(e) => setIdeaContext(e.target.value)}
                      placeholder="Anything specific you want the ideas to reflect?"
                      className="w-full p-2 text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {ideasError && (
                    <div className="text-xs text-rose-600">{ideasError}</div>
                  )}

                  {ideasLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 animate-pulse">
                          <div className="flex justify-between">
                            <div className="h-4 w-1/3 bg-slate-200 rounded" />
                            <div className="h-3 w-1/4 bg-slate-100 rounded" />
                          </div>
                          <div className="h-3 bg-slate-100 rounded" />
                          <div className="h-3 w-3/4 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : ideas.length === 0 ? (
                    <div className="text-xs text-slate-500">No ideas yet. Generate a fresh set.</div>
                  ) : (
                    <div className="space-y-3">
                      {ideas.map((idea) => (
                        <div key={idea.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 leading-snug">{idea.title}</h4>
                            <div className="flex flex-col items-end gap-0.5 text-[11px] text-slate-400 flex-shrink-0">
                              {idea.angle_type && <span>{idea.angle_type}</span>}
                              {idea.risk_level && <span>• {idea.risk_level} risk</span>}
                              {idea.difficulty && <span>• {idea.difficulty}</span>}
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 mt-2">{idea.idea_text}</p>
                          {idea.proof_points && idea.proof_points.length > 0 && (
                            <div className="mt-2 text-[11px] text-slate-500">
                              Proof points: {idea.proof_points.join(', ')}
                            </div>
                          )}
                          {idea.uniqueness_rationale && (
                            <div className="mt-2 text-[11px] text-slate-500">
                              Why unique: {idea.uniqueness_rationale}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Select an essay to see strategy &amp; ideas</p>
              </div>
            )}
          </div>
          </div>
        </div>
    </div>
  )
}
