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

  const prompt = `You are an expert college admissions counselor specializing in narrative strategy.

A student has the following activities and academic profile:

ACTIVITIES:
${activitiesText}

ACADEMIC PROFILE:
- GPA: ${profile.academicProfile.gpa}
- SAT: ${profile.academicProfile.testScores.sat || 'Not taken'}
- Intended Major(s): ${profile.academicProfile.intendedMajors.join(', ')}
- Academic Interests: ${profile.academicProfile.academicInterests}

Analyze these activities and generate 3 distinct, coherent narrative "spikes" that could frame their college application. Each narrative should:
1. Have a compelling title (e.g., "Climate Tech Entrepreneur", "Healthcare Access Advocate")
2. Have a core theme (2-3 sentences)
3. Show which current activities support it (coherence score 0-100)
4. Identify gaps (what's missing to make it credible)
5. Suggest activities to drop (which ones dilute the narrative)
6. Recommend a 30-day action plan (1 concrete project)
7. Suggest an essay angle (potential Common App topic)

Format your response as a JSON array with 3 narrative objects. Each object should have:
{
  "title": "string",
  "theme": "string",
  "coherenceScore": number,
  "supportingActivities": ["activity names"],
  "gaps": ["string"],
  "recommendedDrops": ["activity names"],
  "actionPlan": "string",
  "essayAngle": "string"
}

Return ONLY valid JSON, no additional text.`

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

    return narrativeData.map((n: any, idx: number) => ({
      id: `narrative-${idx + 1}`,
      title: n.title,
      theme: n.theme,
      coherenceScore: n.coherenceScore,
      supportingActivities: profile.activities.filter((a) =>
        n.supportingActivities.some((name: string) =>
          a.name.toLowerCase().includes(name.toLowerCase())
        )
      ),
      gaps: n.gaps,
      recommendedDrops: profile.activities.filter((a) =>
        n.recommendedDrops.some((name: string) =>
          a.name.toLowerCase().includes(name.toLowerCase())
        )
      ),
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
