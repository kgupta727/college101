import { SchoolFit } from '@/types'

/**
 * Shared localStorage cache for school-fit analysis results.
 *
 * Both NarrativeDisplay (best-fit ranking) and SchoolFitAnalysis (full
 * per-school breakdown) write and read from the SAME key, so whichever
 * component runs first populates the cache and the second one gets the
 * data instantly — no duplicate OpenAI calls.
 *
 * Cache is invalidated (cleared) whenever the user saves a new profile or
 * regenerates narratives (via clearAllSchoolFitCaches()).
 */

const CACHE_VERSION = 'v3'

export function getSchoolFitCacheKey(narrativeId: string, schoolIds: string[]): string {
  return `school-fit-${CACHE_VERSION}-${narrativeId}-${[...schoolIds].sort().join('-')}`
}

export function readSchoolFitCache(
  narrativeId: string,
  schoolIds: string[]
): Map<string, SchoolFit> | null {
  try {
    const key = getSchoolFitCacheKey(narrativeId, schoolIds)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, SchoolFit>
    return new Map(Object.entries(parsed))
  } catch {
    return null
  }
}

export function writeSchoolFitCache(
  narrativeId: string,
  schoolIds: string[],
  data: Map<string, SchoolFit>
): void {
  try {
    const key = getSchoolFitCacheKey(narrativeId, schoolIds)
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(data)))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/**
 * Clears ALL school-fit cache entries (both the new v3 keys and the old
 * narrative-bestfit-* keys from the previous implementation).
 * Call this after a profile save or narrative regeneration.
 */
export function clearAllSchoolFitCaches(): void {
  try {
    const keysToDelete: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('school-fit-') || key.startsWith('narrative-bestfit-'))
      ) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore — browser may block storage access in some contexts
  }
}
