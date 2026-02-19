'use server'

import { createClient } from '@/lib/supabase/server'
import { SchoolFit } from '@/types'

/**
 * Load persisted school-fit results from Supabase for a given narrative + school list.
 * Returns a plain object keyed by schoolId so it crosses the server-action boundary cleanly.
 * Convert to a Map<string, SchoolFit> on the client if needed.
 */
export async function loadSchoolFitsFromDB(
  narrativeTitle: string,
  schoolIds: string[]
): Promise<Record<string, SchoolFit>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || schoolIds.length === 0) return {}

  const { data } = await supabase
    .from('school_fits')
    .select('school_id, fit_data')
    .eq('user_id', user.id)
    .eq('narrative_title', narrativeTitle)
    .in('school_id', schoolIds)

  const result: Record<string, SchoolFit> = {}
  for (const row of data || []) {
    result[row.school_id] = row.fit_data as SchoolFit
  }
  return result
}

/**
 * Batch-upsert school-fit results into Supabase.
 * Accepts a plain array so it crosses the server-action boundary safely.
 */
export async function saveSchoolFitsToDB(
  narrativeTitle: string,
  entries: Array<{ schoolId: string; schoolName: string; fit: SchoolFit }>
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || entries.length === 0) return

  const rows = entries.map(({ schoolId, schoolName, fit }) => ({
    user_id: user.id,
    narrative_title: narrativeTitle,
    school_id: schoolId,
    school_name: schoolName,
    fit_data: fit as any,
    updated_at: new Date().toISOString(),
  }))

  await supabase
    .from('school_fits')
    .upsert(rows, { onConflict: 'user_id,narrative_title,school_id' })
}

/**
 * Delete all school-fit rows for the current user.
 * Called whenever a new profile is saved so stale scores are never served.
 */
export async function clearSchoolFitsFromDB(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('school_fits').delete().eq('user_id', user.id)
}
