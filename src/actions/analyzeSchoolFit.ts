'use server'

import { Narrative, StudentProfile } from '@/types'
import { analyzeSchoolFit as analyzeSchoolFitFromOpenAI } from '@/lib/openai'

export async function analyzeSchoolFitAction(
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
  try {
    const fitAnalysis = await analyzeSchoolFitFromOpenAI(narrative, schoolName, profile)
    return fitAnalysis
  } catch (error) {
    console.error('Error analyzing school fit:', error)
    throw new Error('Failed to analyze school fit')
  }
}
