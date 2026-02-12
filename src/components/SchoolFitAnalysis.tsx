'use client'

import { Narrative, StudentProfile, School, SchoolFit } from '@/types'
import { useEffect, useState, useMemo } from 'react'
import { analyzeSchoolFitAction } from '@/actions/analyzeSchoolFit'
import TraitMatcher from './TraitMatcher'
import { computeTier, getTierRationale } from '@/lib/admissions-utils'
import { generateSchoolEssayStrategy, selectCommonAppPrompt, SupplementPrompt } from '@/lib/essay-strategy'
import { Sparkles, Target, Zap, ChevronDown, BookOpen, Lightbulb } from 'lucide-react'

interface SchoolFitAnalysisProps {
  narrative: Narrative
  profile: StudentProfile
  onComplete?: () => void
}

type SupplementDraft = {
  prompt: string
  wordLimit: string
  promptType: string
  sourceUrl: string
  status?: string
}

// Tier color constants - extracted to avoid recalculation
const TIER_COLORS = {
  list: {
    Reach: 'text-rose-600 bg-rose-50 border-rose-200',
    Target: 'text-blue-600 bg-blue-50 border-blue-200',
    Safety: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  detail: {
    Reach: 'bg-rose-50 border-rose-200 text-rose-700',
    Target: 'bg-blue-50 border-blue-200 text-blue-700',
    Safety: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
}

/**
 * Extract top traits from school fit data
 */
const getTopTraits = (traitMatch: SchoolFit['traitMatch']): string => {
  return Object.entries(traitMatch)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait.replace(/([A-Z])/g, ' $1').trim())
    .join(', ')
}

/**
 * Get fit assessment message based on score
 */
const getFitAssessment = (score: number): string => {
  if (score >= 75) {
    return '✓ Excellent fit: Your narrative strongly aligns with what this school values.'
  }
  if (score >= 60) {
    return '⚠ Good fit: Your narrative is relevant, but there are opportunities to strengthen alignment.'
  }
  return '• Develop further: Consider how your narrative could better reflect this school\'s values.'
}

export default function SchoolFitAnalysis({
  narrative,
  profile,
  onComplete,
}: SchoolFitAnalysisProps) {
  const [schoolFits, setSchoolFits] = useState<Map<string, SchoolFit>>(new Map())
  const [loading, setLoading] = useState(true)
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)
  const [supplementsBySchool, setSupplementsBySchool] = useState<Map<string, SupplementPrompt[]>>(new Map())
  const [supplementErrors, setSupplementErrors] = useState<Map<string, string>>(new Map())
  const [supplementLoadingBySchool, setSupplementLoadingBySchool] = useState<Map<string, boolean>>(new Map())
  const [supplementDrafts, setSupplementDrafts] = useState<Record<string, SupplementDraft>>({})
  const [expandedSupplementForm, setExpandedSupplementForm] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const analyzeAllSchools = async () => {
      // Create cache key based on narrative ID and profile school IDs
      const cacheKey = `school-fit-${narrative.id}-${profile.targetSchools.map(s => s.id).sort().join('-')}`
      
      // Check if we have cached results
      let fits = new Map<string, SchoolFit>()
      const cached = localStorage.getItem(cacheKey)
      let isCached = false
      
      if (cached) {
        try {
          const cachedData = JSON.parse(cached) as Record<string, SchoolFit>
          fits = new Map<string, SchoolFit>(Object.entries(cachedData))
          isCached = true
        } catch (error) {
          console.error('Error loading cached school fit:', error)
        }
      }

      // If not cached, analyze all schools
      if (!isCached) {
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

        // Cache the results
        try {
          const cacheData = Object.fromEntries(fits)
          localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        } catch (error) {
          console.error('Error caching school fit:', error)
        }
      }

      setSchoolFits(fits)
      if (fits.size > 0) {
        setExpandedSchool(profile.targetSchools[0]?.id || null)
      }
      setLoading(false)
      onComplete?.()
    }

    analyzeAllSchools()
  }, [narrative.id, profile.targetSchools.length, onComplete])

  useEffect(() => {
    const fetchSupplements = async (schoolId: string) => {
      if (supplementsBySchool.has(schoolId)) return

      setSupplementLoadingBySchool((prev) => new Map(prev).set(schoolId, true))
      setSupplementErrors((prev) => new Map(prev).set(schoolId, ''))

      try {
        const response = await fetch(`/api/colleges/${schoolId}/supplements`)
        if (!response.ok) throw new Error('Unable to load supplements')

        const payload = await response.json()
        const supplements: SupplementPrompt[] = (payload.supplements || []).map((item: any) => ({
          id: item.id,
          prompt: item.prompt,
          wordLimit: item.word_limit || 0,
          type: item.prompt_type || 'open-topic',
          schoolValues: item.school_values || [],
          strategicFocus: item.strategic_focus || '',
        }))

        setSupplementsBySchool((prev) => {
          const updated = new Map(prev)
          updated.set(schoolId, supplements)
          return updated
        })
      } catch (error) {
        setSupplementErrors((prev) => new Map(prev).set(schoolId, 'Unable to load supplements right now.'))
      } finally {
        setSupplementLoadingBySchool((prev) => new Map(prev).set(schoolId, false))
      }
    }

    if (expandedSchool) {
      fetchSupplements(expandedSchool)
    }
  }, [expandedSchool, supplementsBySchool])

  const updateSupplementDraft = (schoolId: string, updates: Partial<SupplementDraft>) => {
    setSupplementDrafts((prev) => ({
      ...prev,
      [schoolId]: {
        ...(prev[schoolId] || {
          prompt: '',
          wordLimit: '',
          promptType: '',
          sourceUrl: '',
          status: '',
        }),
        ...updates,
      },
    }))
  }

  const submitSupplement = async (schoolId: string) => {
    const draft = supplementDrafts[schoolId]
    if (!draft?.prompt?.trim()) {
      updateSupplementDraft(schoolId, { status: 'Please paste the prompt first.' })
      return
    }

    updateSupplementDraft(schoolId, { status: 'Submitting...' })

    try {
      const response = await fetch(`/api/colleges/${schoolId}/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: draft.prompt.trim(),
          wordLimit: draft.wordLimit ? Number(draft.wordLimit) : null,
          promptType: draft.promptType.trim() || null,
          sourceUrl: draft.sourceUrl.trim() || null,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || 'Failed to submit supplement')
      }

      updateSupplementDraft(schoolId, {
        prompt: '',
        wordLimit: '',
        promptType: '',
        sourceUrl: '',
        status: 'Thanks! We will add this prompt soon.',
      })
    } catch (error: any) {
      updateSupplementDraft(schoolId, { status: error.message || 'Failed to submit supplement' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-slate-900">Analyzing school fit…</h2>
        <div className="grid gap-4">
          {profile.targetSchools.map((school) => (
            <div
              key={school.id}
              className="bg-white/70 border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-semibold text-slate-900 mb-2">School fit and essays</h2>
        <p className="text-slate-500">
          How well does "{narrative.title}" align with each school's values? Plus your personalized essay strategy.
        </p>
      </div>

      {/* Common App Essay - Shown Once at Top */}
      {(() => {
        const commonAppRec = selectCommonAppPrompt(narrative)
        return (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <div>
                <h4 className="text-lg font-bold text-amber-900">Common App Essay (650 words)</h4>
                <p className="text-xs text-amber-700 mt-1">Universal foundation for all your applications</p>
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-white/80 rounded-lg p-4 border border-amber-100 space-y-3">
              <div>
                <p className="text-xs font-medium text-amber-700 mb-2">Selected Prompt</p>
                <p className="text-sm text-slate-700 italic leading-relaxed">{commonAppRec.prompt}</p>
              </div>

              <div className="border-t border-amber-100 pt-3">
                <p className="text-xs font-medium text-amber-700 mb-1">Why This Prompt</p>
                <p className="text-sm text-slate-700">{commonAppRec.narrativeConnection}</p>
              </div>

              <div className="border-t border-amber-100 pt-3">
                <p className="text-xs font-medium text-amber-700 mb-2">Strategic Angle</p>
                <p className="text-sm text-slate-700">{commonAppRec.strategicAngle}</p>
              </div>
            </div>

            {/* What to Emphasize & Avoid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-xs font-medium text-emerald-700 mb-2">What to Emphasize</p>
                <ul className="space-y-1.5">
                  {commonAppRec.whatToEmphasize.map((item, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-2">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <p className="text-xs font-medium text-rose-700 mb-2">What to Avoid</p>
                <ul className="space-y-1.5">
                  {commonAppRec.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-xs text-slate-600 flex gap-2">
                      <span className="text-rose-400 flex-shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hook Idea */}
            {commonAppRec.exampleHook && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-xs font-medium text-indigo-600 mb-2">💡 Hook Idea to Get Started</p>
                <p className="text-sm text-slate-700">{commonAppRec.exampleHook}</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* School-Specific Analysis */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-6">
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">School-Specific Supplements</h3>
          <p className="text-slate-500">
            Click each school to see how to approach their supplemental essays.
          </p>
        </div>

        {/* Expandable School Cards */}
        {profile.targetSchools.map((school) => {
          const fit = schoolFits.get(school.id)
          if (!fit) return null

          const tier = computeTier(profile, school, fit)
          const topTraits = getTopTraits(fit.traitMatch)
          const isExpanded = expandedSchool === school.id

          // Get detailed info if expanded
          let details = null
          if (isExpanded) {
            const tierRationale = getTierRationale(profile, school, tier, fit)
            details = { tier, tierRationale }
          }

          return (
            <div 
              key={school.id} 
              className={`border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all ${
                isExpanded ? 'ring-2 ring-slate-900' : ''
              }`}
            >
              {/* Card Header - Always Visible */}
              <button
                onClick={() => setExpandedSchool(isExpanded ? null : school.id)}
                className="w-full text-left px-6 py-5 bg-white hover:bg-slate-50 transition-colors flex justify-between items-start"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs uppercase tracking-[0.25em] font-semibold px-2 py-1 rounded-md border ${TIER_COLORS.list[tier]}`}
                    >
                      {tier}
                    </span>
                    <span className="text-xs text-slate-400">
                      {school.admissionRate > 0 ? `${school.admissionRate.toFixed(1)}% admit` : 'Admission rate N/A'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{school.name}</h3>
                  <p className="text-sm text-slate-500">Strong in {topTraits.toLowerCase()}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {fit.overallFitScore}% fit
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Percentile {fit.percentileRank}th</p>
                  <ChevronDown className={`w-4 h-4 text-slate-400 mt-2 mx-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded Details - Inline */}
              {isExpanded && details && (
                <div className="bg-slate-50/50 border-t border-slate-200 px-6 py-6 space-y-6">
                  {/* Dynamic Tier Explanation */}
                  <div className={`p-4 rounded-xl border ${TIER_COLORS.detail[details.tier]}`}>
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">
                          Classified as <span className="uppercase tracking-wide">{details.tier}</span>
                        </p>
                        <p className="text-sm opacity-90">{details.tierRationale}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trait Matcher */}
                  <TraitMatcher fit={fit} />

                  {/* Percentile Info */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-600 text-sm">
                      <strong>Percentile rank:</strong> Your narrative profile is in the{' '}
                      <span className="font-bold text-slate-900">{fit.percentileRank}th percentile</span>{' '}
                      of admitted students at {school.name}
                    </p>
                  </div>

                  {/* Essay Strategy - School-Specific Supplements Only */}
                  {(() => {
                    const supplementsLoaded = supplementsBySchool.has(school.id)
                    const supplements = supplementsBySchool.get(school.id) || null
                    const supplementError = supplementErrors.get(school.id)
                    const supplementLoading = supplementLoadingBySchool.get(school.id)
                    const draft = supplementDrafts[school.id] || {
                      prompt: '',
                      wordLimit: '',
                      promptType: '',
                      sourceUrl: '',
                      status: '',
                    }

                    const strategy = supplementsLoaded
                      ? generateSchoolEssayStrategy(narrative, school, supplements)
                      : generateSchoolEssayStrategy(narrative, school)

                    if (supplementLoading) {
                      return (
                        <div className="rounded-2xl border border-indigo-200 bg-white p-6 text-sm text-slate-500">
                          Loading supplement prompts...
                        </div>
                      )
                    }

                    if (supplementError) {
                      return (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
                          {supplementError}
                        </div>
                      )
                    }

                    if (!strategy) {
                      return (
                        <div className="rounded-2xl border border-indigo-200 bg-white p-6 space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-indigo-900">No supplements found yet</h4>
                            <p className="text-sm text-slate-600">
                              If this school has supplements, paste them below and we will add them for everyone.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <textarea
                              value={draft.prompt}
                              onChange={(event) => updateSupplementDraft(school.id, { prompt: event.target.value })}
                              placeholder="Paste the supplement prompt..."
                              className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                value={draft.wordLimit}
                                onChange={(event) => updateSupplementDraft(school.id, { wordLimit: event.target.value })}
                                placeholder="Word limit (optional)"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                              <input
                                value={draft.promptType}
                                onChange={(event) => updateSupplementDraft(school.id, { promptType: event.target.value })}
                                placeholder="Prompt type (optional)"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                            </div>
                            <input
                              value={draft.sourceUrl}
                              onChange={(event) => updateSupplementDraft(school.id, { sourceUrl: event.target.value })}
                              placeholder="Source URL (optional)"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            <button
                              type="button"
                              onClick={() => submitSupplement(school.id)}
                              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                              Submit prompt
                            </button>
                            {draft.status && (
                              <p className="text-sm text-indigo-700">{draft.status}</p>
                            )}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h4 className="text-lg font-bold text-indigo-900">Supplemental Essays</h4>
                          </div>
                          <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-medium">
                            {strategy.supplements.length} {strategy.supplements.length === 1 ? 'Essay' : 'Essays'}
                          </span>
                        </div>

                        {/* Overall Strategy */}
                        <div className="bg-white/70 rounded-xl p-4 border border-indigo-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <h5 className="text-sm font-semibold text-slate-900">Overall Approach</h5>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {strategy.overallStrategy}
                          </p>
                        </div>

                        {/* Supplement Essays */}
                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-indigo-900">School-Specific Supplements</h5>
                          
                          <div className="space-y-3">
                            {strategy.supplements.map((supp, suppIdx) => (
                              <div
                                key={suppIdx}
                                className="bg-white rounded-lg p-4 border border-slate-200 space-y-2"
                              >
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-semibold text-slate-900">
                                    Supplement {suppIdx + 1}
                                  </p>
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    {supp.wordLimit ? `${supp.wordLimit} words` : 'Word limit N/A'}
                                  </span>
                                </div>

                                <p className="text-sm text-slate-700 italic">{supp.prompt}</p>
                                
                                <div className="bg-indigo-50 border border-indigo-100 rounded p-3">
                                  <p className="text-xs font-medium text-indigo-600 mb-1">Strategic Approach</p>
                                  <p className="text-sm text-slate-700">{supp.strategicAngle}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  <div>
                                    <p className="text-xs font-medium text-emerald-600 mb-1">Emphasize</p>
                                    <ul className="space-y-0.5">
                                      {supp.whatToEmphasize.slice(0, 2).map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex gap-1">
                                          <span>•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-red-600 mb-1">Avoid</p>
                                    <ul className="space-y-0.5">
                                      {supp.whatToAvoid.slice(0, 2).map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex gap-1">
                                          <span>•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedSupplementForm(prev => ({ ...prev, [school.id]: !prev[school.id] }))}
                            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">Missing a prompt?</span>
                              <span className="text-xs text-slate-400">Click to add</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                              expandedSupplementForm[school.id] ? 'rotate-180' : ''
                            }`} />
                          </button>
                          
                          {expandedSupplementForm[school.id] && (
                            <div className="border-t border-slate-100 p-4 space-y-3">
                              <p className="text-xs text-slate-600">
                                Paste any additional supplements so we can add them to the database.
                              </p>
                              <textarea
                                value={draft.prompt}
                                onChange={(event) => updateSupplementDraft(school.id, { prompt: event.target.value })}
                                placeholder="Paste the supplement prompt..."
                                className="w-full min-h-[100px] rounded-lg border border-slate-200 p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  value={draft.wordLimit}
                                  onChange={(event) => updateSupplementDraft(school.id, { wordLimit: event.target.value })}
                                  placeholder="Word limit (optional)"
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                                <input
                                  value={draft.promptType}
                                  onChange={(event) => updateSupplementDraft(school.id, { promptType: event.target.value })}
                                  placeholder="Prompt type (optional)"
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                              </div>
                              <input
                                value={draft.sourceUrl}
                                onChange={(event) => updateSupplementDraft(school.id, { sourceUrl: event.target.value })}
                                placeholder="Source URL (optional)"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                              <button
                                type="button"
                                onClick={() => submitSupplement(school.id)}
                                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                              >
                                Submit prompt
                              </button>
                              {draft.status && (
                                <p className="text-sm text-indigo-700">{draft.status}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Fit Assessment */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-2">What this means</h4>
                    <p className="text-slate-600 text-sm">{getFitAssessment(fit.overallFitScore)}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
