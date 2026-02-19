'use server'

import { Activity, Narrative } from '@/types'
import { generateReconsiderSuggestion } from '@/lib/openai'

export async function generateReconsiderSuggestionAction(
  activity: Activity,
  narrative: Narrative,
  allActivities: Activity[]
): Promise<string> {
  try {
    return await generateReconsiderSuggestion(activity, narrative, allActivities)
  } catch (error) {
    console.error('Error generating reconsider suggestion:', error)
    throw new Error('Failed to generate personalized suggestion')
  }
}
