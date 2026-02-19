'use server'

import OpenAI from 'openai'
import { Activity, Narrative, StudentProfile } from '@/types'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// --- Lens pool: 9 distinct lenses, 3 are picked per run ---
const LENS_POOL = [
  {
    key: 'impact',
    label: 'IMPACT / LEADERSHIP',
    description: 'How did they create real-world outcomes or lead people? What changed because of them? Focus on responsibility taken and measurable difference made.',
  },
  {
    key: 'curiosity',
    label: 'INTELLECTUAL / CURIOSITY',
    description: 'What questions keep them up at night? How do they think? What idea, problem, or mystery obsessively drives them beyond the classroom?',
  },
  {
    key: 'values',
    label: 'VALUES / GROWTH',
    description: 'What do they stand for? How did they grow? What hard choices, quiet sacrifices, or moments of discomfort reveal their character and moral compass?',
  },
  {
    key: 'community',
    label: 'COMMUNITY / BELONGING',
    description: 'How do they build, shape, or transform the communities they inhabit? What does belonging mean to them, and how do they create it for others?',
  },
  {
    key: 'creative',
    label: 'CREATIVE / ALTERNATIVE THINKER',
    description: 'Where have they approached a problem, craft, or challenge in a genuinely unconventional way? What does their creative or lateral thinking reveal about them?',
  },
  {
    key: 'ethical',
    label: 'ETHICAL / PHILOSOPHICAL',
    description: 'Where have they grappled with moral complexity, conflicting loyalties, or a principle under pressure? What does their ethical reasoning reveal?',
  },
  {
    key: 'interdisciplinary',
    label: 'CROSS-DISCIPLINARY THINKER',
    description: 'Where do they bridge two seemingly unrelated domains — art and science, tradition and technology, local and global — in ways that produce unexpected insight?',
  },
  {
    key: 'resilience',
    label: 'UNDERDOG / RESILIENCE',
    description: 'What systemic barrier, personal adversity, or uphill battle have they faced and navigated? What did it reveal about their grit, resourcefulness, and perspective?',
  },
  {
    key: 'connector',
    label: 'CONNECTOR / TRANSLATOR',
    description: 'How do they act as a bridge between people, cultures, disciplines, or generations? What do they uniquely understand about translation — of language, idea, or identity?',
  },
]

function pickLenses(previousLensKeys: string[]): typeof LENS_POOL {
  // Shuffle a copy of the pool
  const shuffled = [...LENS_POOL].sort(() => Math.random() - 0.5)
  // Prefer lenses not used last time
  const fresh = shuffled.filter((l) => !previousLensKeys.includes(l.key))
  const used = shuffled.filter((l) => previousLensKeys.includes(l.key))
  const ordered = [...fresh, ...used]
  return ordered.slice(0, 3)
}

export async function generateNarratives(
  profile: StudentProfile,
  previousNarratives?: Narrative[],
  additionalContext?: string
): Promise<Narrative[]> {
  const activitiesText = profile.activities
    .map((a) => `- ${a.name} (${a.role || 'Participant'}, ${a.hoursPerWeek || 'N/A'} hrs/week, ${a.yearsInvolved || 1} years). Tags: ${a.tags.join(', ')}. ${a.description || ''}`)
    .join('\n')

  // Pick 3 lenses, avoiding previously used ones
  const prevLensKeys = previousNarratives?.map((n) => n.lensKey ?? '').filter(Boolean) ?? []
  const selectedLenses = pickLenses(prevLensKeys)

  // Build the memory block if we have previous narratives
  const memoryBlock = previousNarratives && previousNarratives.length > 0
    ? `\nPREVIOUS GENERATION — DO NOT REPEAT THESE:
The student already received these narratives. Your new narratives must NOT share the same title, framing, central metaphor, or angle as any of these:
${previousNarratives.map((n, i) => `${i + 1}. "${n.title}" — ${n.theme}`).join('\n')}
Every narrative you produce must be a genuinely fresh interpretation of this student's profile.\n`
    : ''

  // Build the additional context block
  const contextBlock = additionalContext?.trim()
    ? `\nSTUDENT'S ADDITIONAL GUIDANCE (prioritize this):
"${additionalContext.trim()}"\n`
    : ''

  const lensInstructions = selectedLenses
    .map((l, i) => `**NARRATIVE ${i + 1} — ${l.label}**\n${l.description}`)
    .join('\n\n')

  const prompt = `You are an elite college admissions strategist. Your job is to generate 3 narratives that feel UNEXPECTED, MEMORABLE, and HUMAN.

STUDENT PROFILE:
${activitiesText}

ACADEMIC PROFILE:
- GPA: ${profile.academicProfile.gpa}
- SAT: ${profile.academicProfile.testScores.sat || 'Not taken'}
- Intended Major(s): ${profile.academicProfile.intendedMajors.join(', ')}
- Academic Interests: ${profile.academicProfile.academicInterests}
${memoryBlock}${contextBlock}
CORE GOAL:
Go BEYOND surface-level activity summaries. Even a CS/engineering student's narratives must never lead with "tech". Colleges already know they can code. Reveal WHO THEY ARE — their values, the texture of their thinking, and how they move through the world.

MANDATORY DIVERSITY RULES:
1. Each narrative must feel like a COMPLETELY DIFFERENT DIMENSION of the same person.
2. Titles must NOT include words like "tech", "engineering", "STEM", "innovation", "coding", or "AI".
3. Each narrative must have a UNIQUE CORE LENS and a SURPRISING HOOK — something specific, humanizing, and non-generic.
4. Use activities as supporting evidence — reinterpret them through each unique lens.
5. Draw on the student's specific details: names, contexts, tensions, and moments — not generic framings.

You must produce exactly 3 narratives using THESE three lenses (assigned in order):

${lensInstructions}

REQUIRED OUTPUT QUALITY:
- "surprisingHook" must be specific and make an admissions officer pause — never a platitude.
- "theme" must feel fresh per lens — no recycled phrasing across the 3.
- "supportingActivities" must be the 2–4 that best illuminate THIS lens.
- "essayAngle" must name a specific Common App prompt number and give a concrete opening angle.

Format your response as a JSON ARRAY of exactly 3 objects:
[
  {
    "lensKey": "string (use the lens key exactly: ${selectedLenses.map(l => l.key).join(' | ')})",
    "title": "string (distinct, memorable, no forbidden words)",
    "theme": "string (2-3 sentences: what this lens reveals about the student as a human)",
    "coherenceScore": number (0-100, how well their current profile supports this lens),
    "supportingActivities": ["activity names"],
    "gaps": ["1-2 specific things missing that would strengthen this lens"],
    "recommendedDrops": ["activities that dilute this lens"],
    "actionPlan": "string (one concrete 30-day action to deepen THIS specific lens)",
    "essayAngle": "string (e.g. 'Prompt 2 — open with the moment you realized X...')",
    "surprisingHook": "string (a specific, vivid, non-generic hook idea for the essay opener)"
  }
]

Return ONLY a valid JSON array. No explanation, no markdown.`

  const message = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 1.1,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  try {
    const content = message.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const narrativeData = JSON.parse(cleanedContent)

    // Helper function to match activity names more intelligently
    const findMatchingActivity = (targetName: string, activities: Activity[]) => {
      const normalized = targetName.toLowerCase().trim()

      const exactMatch = activities.find(a =>
        a.name.toLowerCase() === normalized ||
        a.name.toLowerCase().includes(normalized) ||
        normalized.includes(a.name.toLowerCase())
      )

      if (exactMatch) return exactMatch

      const targetWords = normalized.split(/\s+/)
      const scored = activities.map(activity => {
        const activityWords = activity.name.toLowerCase().split(/\s+/)
        const matches = targetWords.filter(tw =>
          activityWords.some(aw => aw.includes(tw) || tw.includes(aw))
        )
        return { activity, score: matches.length }
      })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)

      return scored.length > 0 ? scored[0].activity : null
    }

    return narrativeData.map((n: any, idx: number) => ({
      id: `narrative-${idx + 1}`,
      lensKey: n.lensKey ?? selectedLenses[idx]?.key,
      title: n.title,
      theme: n.theme,
      coherenceScore: n.coherenceScore,
      surprisingHook: n.surprisingHook ?? null,
      supportingActivities: n.supportingActivities
        .map((name: string) => findMatchingActivity(name, profile.activities))
        .filter((a: Activity | null): a is Activity => a !== null),
      gaps: n.gaps,
      recommendedDrops: n.recommendedDrops
        .map((name: string) => findMatchingActivity(name, profile.activities))
        .filter((a: Activity | null): a is Activity => a !== null),
      actionPlan: n.actionPlan,
      essayAngle: n.essayAngle,
    }))
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Error parsing narrative response - Invalid JSON:', error)
      throw new Error('OpenAI returned invalid JSON. Please try again.')
    }
    console.error('Error parsing narrative response:', error)
    throw error instanceof Error ? error : new Error('Failed to parse narrative analysis')
  }
}

export async function analyzeSchoolFit(
  narrative: Narrative,
  schoolName: string,
  profile: StudentProfile
): Promise<{
  traitMatch: Record<string, number>
  overallFitScore: number
  percentileRank: number
  collegeValues: string[]
  strengths: string[]
  improvements: string[]
}> {
  const activitiesSummary = profile.activities
    .map(
      (a) =>
        `- ${a.name} (${a.tags.join('/')}${a.role ? `, ${a.role}` : ''}, ${a.hoursPerWeek ?? '?'}h/wk)`
    )
    .join('\n')

  const academic = profile.academicProfile
  const academicSummary = [
    `GPA: ${academic.gpa ?? 'N/A'}`,
    academic.testScores?.sat ? `SAT: ${academic.testScores.sat}` : null,
    academic.testScores?.act ? `ACT: ${academic.testScores.act}` : null,
    academic.apCount ? `AP courses: ${academic.apCount}` : null,
    academic.intendedMajors?.length ? `Intended majors: ${academic.intendedMajors.join(', ')}` : null,
    academic.academicInterests ? `Academic interests: ${academic.academicInterests}` : null,
  ]
    .filter(Boolean)
    .join(' | ')

  const prompt = `You are a senior college admissions expert with deep knowledge of what specific universities value in applicants.

STUDENT PROFILE
---------------
Narrative: "${narrative.title}" — ${narrative.theme}
Academic: ${academicSummary}
Activities:
${activitiesSummary}

TARGET SCHOOL: ${schoolName}

YOUR TASK
---------
1. Identify 3–5 traits that ${schoolName} SPECIFICALLY values in admitted students (e.g. "research depth" for MIT, "public service commitment" for Georgetown). These must be unique to ${schoolName}'s culture and mission — do NOT use generic traits.

2. Score this student 0–100 on EACH of those college-specific traits based on their activities and narrative.

3. Write 2–3 STRENGTHS: specific parts of this student's profile that align strongly with ${schoolName}'s values. Reference actual activities or stats.

4. Write 2–3 IMPROVEMENTS: concrete gaps or weaknesses relative to what ${schoolName} looks for. Be honest and specific.

5. Overall Fit Score (0–100): holistic match between this student and ${schoolName}.

6. Percentile Rank: what percentile of applicants with a similar academic profile would score this high a fit.

RESPONSE FORMAT — return ONLY valid JSON, no markdown:
{
  "collegeValues": ["string", ...],
  "traitMatch": {
    "camelCaseTraitName": number,
    ...
  },
  "strengths": ["string", ...],
  "improvements": ["string", ...],
  "overallFitScore": number,
  "percentileRank": number
}

Rules:
- traitMatch keys must be camelCase versions of the collegeValues entries (same order)
- collegeValues entries are human-readable (e.g. "Research Depth"), traitMatch keys are camelCase (e.g. "researchDepth")
- strengths and improvements must reference this student's actual activities or academic stats, not generic advice
- Return ONLY the JSON object`

  const message = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  try {
    const content = message.choices[0]?.message?.content
    if (!content) throw new Error('No response content')

    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const fitData = JSON.parse(cleanedContent)
    return {
      traitMatch: fitData.traitMatch ?? {},
      overallFitScore: fitData.overallFitScore,
      percentileRank: fitData.percentileRank,
      collegeValues: fitData.collegeValues ?? [],
      strengths: fitData.strengths ?? [],
      improvements: fitData.improvements ?? [],
    }
  } catch (error) {
    console.error('Error parsing school fit response:', error)
    throw new Error('Failed to analyze school fit')
  }
}

type EssayIdeaInput = {
  profile: StudentProfile
  essayType: 'common_app' | 'supplement'
  collegeName?: string
  supplementPrompt?: string
  supplementPromptType?: string
  supplementWordLimit?: number | null
  commonAppPromptNumber?: number | null
  commonAppPromptText?: string | null
  userContext?: string | null
  existingIdeas?: Array<{
    title: string
    idea_text: string
    angle_type?: string | null
  }>
  /** The narrative the student has chosen — ideas should align with its angle */
  narrativeContext?: {
    title: string
    theme: string
    essayAngle?: string | null
    surprisingHook?: string | null
  } | null
}

export async function generateEssayIdeas(input: EssayIdeaInput) {
  const activitiesText = input.profile.activities
    .map((a) => {
      const tags = a.tags.length > 0 ? `Tags: ${a.tags.join(', ')}` : 'Tags: none'
      const role = a.role ? `Role: ${a.role}` : 'Role: none'
      const hours = a.hoursPerWeek ? `${a.hoursPerWeek} hrs/week` : 'Hours: N/A'
      const years = a.yearsInvolved ? `${a.yearsInvolved} years` : 'Years: N/A'
      const desc = a.description ? `Notes: ${a.description}` : ''
      return `- ${a.name}. ${role}. ${hours}. ${years}. ${tags}. ${desc}`
    })
    .join('\n')

  const academicText = `GPA: ${input.profile.academicProfile.gpa}. SAT: ${input.profile.academicProfile.testScores.sat || 'N/A'}. ACT: ${input.profile.academicProfile.testScores.act || 'N/A'}. Intended majors: ${input.profile.academicProfile.intendedMajors.join(', ') || 'N/A'}. Academic interests: ${input.profile.academicProfile.academicInterests || 'N/A'}.`

  const existingIdeasText = (input.existingIdeas || [])
    .map((idea, idx) => `#${idx + 1}: ${idea.title} | Angle: ${idea.angle_type || 'N/A'} | ${idea.idea_text}`)
    .join('\n')

  const narrativeContextText = input.narrativeContext
    ? `\nSTUDENT'S CHOSEN NARRATIVE (ideas MUST align with this angle):\nNarrative: "${input.narrativeContext.title}"\nTheme: ${input.narrativeContext.theme}\n${
        input.narrativeContext.essayAngle ? `Suggested essay angle: ${input.narrativeContext.essayAngle}\n` : ''
      }${
        input.narrativeContext.surprisingHook ? `Hook idea: ${input.narrativeContext.surprisingHook}\n` : ''
      }Each idea must feel like a natural extension of this narrative — not a contradiction of it.\n`
    : ''

  const prompt = `You are an elite admissions essay idea generator.

TASK:
Generate 3-5 EXTREMELY NICHE, SPECIFIC, and DISTINCT essay ideas based on the student's activities and personality. Avoid generic advice and avoid repeating prior ideas.

OUTPUT REQUIREMENTS:
- Every idea must be unique in angle, activity focus, and emotional texture.
- Include a mix of EASY, MEDIUM, and HARD ideas.
- Ideas must be grounded in the student's actual activities and details.
- Each idea must identify its proof points (activities/achievements used).
- If an idea is ambitious or hard to pull off, label it clearly.

STUDENT PROFILE:
${academicText}

ACTIVITIES:
${activitiesText}

ESSAY CONTEXT:
- Essay type: ${input.essayType}
- College: ${input.collegeName || 'N/A'}
- Supplement prompt type: ${input.supplementPromptType || 'N/A'}
- Supplement prompt: ${input.supplementPrompt || 'N/A'}
- Supplement word limit: ${input.supplementWordLimit || 'N/A'}
- Common App prompt #: ${input.commonAppPromptNumber || 'N/A'}
- Common App prompt text: ${input.commonAppPromptText || 'N/A'}
${narrativeContextText}
EXTRA CONTEXT FROM USER (optional):
${input.userContext || 'N/A'}

PAST IDEAS TO AVOID REPEATING:
${existingIdeasText || 'None'}

Return ONLY valid JSON array with 3-5 objects in this format:
[
  {
    "title": "string",
    "idea_text": "2-4 sentences describing the idea",
    "angle_type": "origin story | contradiction | transformation | unexpected expertise | tiny moment | values test | intellectual obsession | community imprint | other",
    "risk_level": "low | medium | high",
    "difficulty": "easy | medium | hard",
    "proof_points": ["activity/achievement evidence"],
    "uniqueness_rationale": "1-2 sentences why this is distinct for this student"
  }
]
`

  const message = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response content from OpenAI')
  }

  const cleanedContent = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim()

  try {
    const ideaData = JSON.parse(cleanedContent)
    if (!Array.isArray(ideaData)) {
      throw new Error('Idea response was not an array')
    }
    return ideaData
  } catch (error) {
    console.error('Error parsing idea response:', error)
    throw new Error('OpenAI returned invalid JSON for ideas. Please try again.')
  }
}
export async function generateReconsiderSuggestion(
  activity: Activity,
  narrative: Narrative,
  allActivities: Activity[]
): Promise<string> {
  const otherActivitiesText = allActivities
    .filter(a => a.id !== activity.id)
    .map(a => `- ${a.name} (${a.role || 'Participant'}, ${a.tags.join(', ')})`)
    .join('\n')

  const prompt = `You are an expert college admissions advisor specializing in narrative cohesion.

A student has built this narrative: "${narrative.title}" — "${narrative.theme}"

This activity is tagged as potentially diluting that narrative:
- Activity: ${activity.name}
- Role: ${activity.role || 'Participant'}
- Tags: ${activity.tags.join(', ')}
- Description: ${activity.description || 'N/A'}
- Hours/week: ${activity.hoursPerWeek || 'N/A'}
- Years: ${activity.yearsInvolved || 'N/A'}

Their OTHER activities (which support the narrative):
${otherActivitiesText}

TASK:
Generate ONE specific, actionable suggestion for how the student should reconsider or rewrite THIS ACTIVITY to align with their narrative. DO NOT repeat generic advice.

If the activity truly weakens the narrative, explain HOW to reframe it to support the narrative lens.
If kept, explain what angle to emphasize.

Keep it to 1-2 sentences, concrete and specific to their situation.
Start directly with "Reframe", "Rewrite", "Emphasize", or "Consider dropping" — no preamble.`

  const message = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI for reconsideration suggestion')
  }

  return content.trim()
}