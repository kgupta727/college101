'use server'

import OpenAI from 'openai'
import { Activity, Narrative, StudentProfile } from '@/types'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateNarratives(
  profile: StudentProfile
): Promise<Narrative[]> {
  const activitiesText = profile.activities
    .map((a) => `- ${a.name} (${a.role || 'Participant'}, ${a.hoursPerWeek || 'N/A'} hrs/week, ${a.yearsInvolved || 1} years). Tags: ${a.tags.join(', ')}. ${a.description || ''}`)
    .join('\n')

  const prompt = `You are an elite college admissions strategist. Your job is to generate 3 narratives that feel UNEXPECTED, MEMORABLE, and DIFFERENT from each other.

STUDENT PROFILE:
${activitiesText}

ACADEMIC PROFILE:
- GPA: ${profile.academicProfile.gpa}
- SAT: ${profile.academicProfile.testScores.sat || 'Not taken'}
- Intended Major(s): ${profile.academicProfile.intendedMajors.join(', ')}
- Academic Interests: ${profile.academicProfile.academicInterests}

CORE GOAL:
Even if the student is a CS/engineering major, the narratives must go BEYOND "tech" and reveal WHO THEY ARE. Assume colleges already know they can code. We need to show:
- Impact and responsibility
- Intellectual curiosity and how they think
- Values, character, resilience, and worldview

MANDATORY DIVERSITY RULES:
1. Each narrative must feel like a DIFFERENT DIMENSION of the same person.
2. Titles must NOT include words like "tech", "engineering", "STEM", "innovation", "coding", or "AI".
3. Each narrative must have a UNIQUE CORE LENS and a UNIQUE HOOK (surprising or humanizing).
4. Use the same activities if needed, but reinterpret them differently.
5. If activities are narrow, create an ORIGINAL frame (e.g., "community trust-builder", "ethical decision-maker", "systems thinker", "bridge-builder").

You must produce exactly 3 narratives in these three lenses:

**NARRATIVE 1 — IMPACT / LEADERSHIP**
How did they create real-world outcomes or lead people? What changed because of them?

**NARRATIVE 2 — INTELLECTUAL / CURIOSITY**
What questions keep them up at night? How do they think? What idea obsessively drives them?

**NARRATIVE 3 — VALUES / GROWTH**
What do they stand for? How did they grow? What hard choices reveal their character?

REQUIRED OUTPUT QUALITY:
- Each narrative must include a "surprising hook" idea that makes it feel fresh and specific.
- The "theme" must be distinct across narratives (no overlap in language or framing).
- Supporting activities must be selective (2–4 strongest) and clearly tied to the lens.

Format your response as valid JSON with exactly 3 objects:
{
  "title": "string (no tech words, distinct, memorable)",
  "theme": "string (2-3 sentences explaining the lens and human dimension)",
  "coherenceScore": number (0-100 for this lens),
  "supportingActivities": ["activity names supporting this angle"],
  "gaps": ["what's missing to strengthen this specific angle"],
  "recommendedDrops": ["activities that don't support this angle"],
  "actionPlan": "string (30-day project to deepen THIS lens)",
  "essayAngle": "string (Common App prompt + how to approach it)",
  "surprisingHook": "string (specific, humanizing, non-generic hook idea)"
}

Return ONLY valid JSON. No extra text.`

  const message = await client.chat.completions.create({
    model: 'gpt-4o-mini',
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

    // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const narrativeData = JSON.parse(cleanedContent)

    // Helper function to match activity names more intelligently
    const findMatchingActivity = (targetName: string, activities: Activity[]) => {
      // Normalize the target name
      const normalized = targetName.toLowerCase().trim()
      
      // First try exact or near-exact match
      const exactMatch = activities.find(a => 
        a.name.toLowerCase() === normalized ||
        a.name.toLowerCase().includes(normalized) ||
        normalized.includes(a.name.toLowerCase())
      )
      
      if (exactMatch) return exactMatch
      
      // If no exact match, try partial matching with key words
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
      title: n.title,
      theme: n.theme,
      coherenceScore: n.coherenceScore,
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
  schoolName: string
): Promise<{
  traitMatch: {
    intellectualCuriosity: number
    socialImpact: number
    innovation: number
    resilience: number
    leadership: number
    creativity: number
  }
  overallFitScore: number
  percentileRank: number
}> {
  const prompt = `You are an expert in college admissions and institutional fit.

A student has this narrative: "${narrative.title}" - "${narrative.theme}"

The target school is: ${schoolName}

Analyze how well this narrative aligns with what ${schoolName} values in admitted students. Rate the student's fit across these traits (0-100 each):
- Intellectual Curiosity
- Social Impact
- Innovation
- Resilience
- Leadership
- Creativity

Also provide:
- Overall Fit Score (0-100)
- Percentile Rank (what % of applicants with similar profiles would be a good fit)

Format as JSON:
{
  "intellectualCuriosity": number,
  "socialImpact": number,
  "innovation": number,
  "resilience": number,
  "leadership": number,
  "creativity": number,
  "overallFitScore": number,
  "percentileRank": number
}

Return ONLY valid JSON.`

  const message = await client.chat.completions.create({
    model: 'gpt-4o-mini',
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
      throw new Error('No response content')
    }

    // Strip markdown code blocks if present
    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const fitData = JSON.parse(cleanedContent)
    return {
      traitMatch: {
        intellectualCuriosity: fitData.intellectualCuriosity,
        socialImpact: fitData.socialImpact,
        innovation: fitData.innovation,
        resilience: fitData.resilience,
        leadership: fitData.leadership,
        creativity: fitData.creativity,
      },
      overallFitScore: fitData.overallFitScore,
      percentileRank: fitData.percentileRank,
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
