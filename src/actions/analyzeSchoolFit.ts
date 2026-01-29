'use server'

import { Narrative } from '@/types'
import { analyzeSchoolFit as analyzeSchoolFitFromOpenAI } from '@/lib/openai'

export async function analyzeSchoolFitAction(
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
  try {
    const fitAnalysis = await analyzeSchoolFitFromOpenAI(narrative, schoolName)
    return fitAnalysis
  } catch (error) {
    console.error('Error analyzing school fit:', error)
    throw new Error('Failed to analyze school fit')
  }
}
