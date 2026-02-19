'use server'

import { Narrative, StudentProfile } from '@/types'
import { generateNarratives as generateNarrativesFromOpenAI } from '@/lib/openai'

export async function generateNarrativesAction(
  profile: StudentProfile,
  previousNarratives?: Narrative[],
  additionalContext?: string
): Promise<Narrative[]> {
  try {
    const narratives = await generateNarrativesFromOpenAI(profile, previousNarratives, additionalContext)
    return narratives
  } catch (error) {
    console.error('Error generating narratives:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to generate narratives: ${errorMessage}`)
  }
}
