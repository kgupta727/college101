'use server'

import { createClient } from '@/lib/supabase/server'
import { StudentProfile } from '@/types'

export async function saveProfileAction(profile: StudentProfile) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // First, upsert the main profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      name: profile.name,
      gpa: profile.academicProfile.gpa,
      sat_score: profile.academicProfile.testScores.sat || null,
      act_score: profile.academicProfile.testScores.act || null,
      ap_count: profile.academicProfile.apCount || 0,
      ib_count: profile.academicProfile.ibCount || 0,
      intended_majors: profile.academicProfile.intendedMajors || [],
      academic_interests: profile.academicProfile.academicInterests || '',
      constraints: profile.constraints,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()

  if (profileError) {
    console.error('Profile save error:', profileError)
    throw new Error(`Failed to save profile: ${profileError.message}`)
  }

  // Delete existing activities and schools for this profile
  await supabase.from('activities').delete().eq('profile_id', profileData.id)
  await supabase.from('schools').delete().eq('profile_id', profileData.id)

  // Insert activities
  if (profile.activities.length > 0) {
    const activitiesData = profile.activities.map(activity => ({
      profile_id: profileData.id,
      name: activity.name,
      category: activity.tags?.join(', ') || '',
      hours_per_week: activity.hoursPerWeek || 0,
      weeks_per_year: activity.yearsInvolved ? activity.yearsInvolved * 40 : 0,
      years_participated: [],
      leadership_position: activity.role || '',
      description: activity.description || '',
      snapshot_data: null,
    }))

    const { error: activitiesError } = await supabase
      .from('activities')
      .insert(activitiesData)

    if (activitiesError) {
      console.error('Activities save error:', activitiesError)
      throw new Error(`Failed to save activities: ${activitiesError.message}`)
    }
  }

  // Insert schools
  if (profile.targetSchools.length > 0) {
    const schoolsData = profile.targetSchools.map(school => ({
      profile_id: profileData.id,
      name: school.name,
      type: school.tier,
      college_id: school.id,
    }))

    const { error: schoolsError } = await supabase
      .from('schools')
      .insert(schoolsData)

    if (schoolsError) {
      console.error('Schools save error:', schoolsError)
      throw new Error(`Failed to save schools: ${schoolsError.message}`)
    }
  }

  return { success: true, profileId: profileData.id }
}

export async function loadProfileAction(): Promise<StudentProfile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return null
  }

  // Load profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profileData) {
    return null
  }

  // Load activities
  const { data: activitiesData } = await supabase
    .from('activities')
    .select('*')
    .eq('profile_id', profileData.id)

  // Load schools
  const { data: schoolsData } = await supabase
    .from('schools')
    .select('id,name,type,college_id,colleges(id,name,sat_low,sat_high,act_low,act_high,admission_rate,major_offerings_count)')
    .eq('profile_id', profileData.id)

  // Convert back to StudentProfile format
  const profile: StudentProfile = {
    id: profileData.id,
    name: profileData.name || '',
    activities: (activitiesData || []).map(activity => ({
      id: activity.id,
      name: activity.name,
      role: activity.leadership_position || '',
      hoursPerWeek: activity.hours_per_week || 0,
      yearsInvolved: activity.weeks_per_year ? activity.weeks_per_year / 40 : 0,
      description: activity.description || '',
      tags: activity.category ? activity.category.split(', ').filter(Boolean) as any : [],
      impact: '',
    })),
    academicProfile: {
      gpa: profileData.gpa || 0,
      testScores: {
        sat: profileData.sat_score || undefined,
        act: profileData.act_score || undefined,
      },
      apCount: profileData.ap_count || 0,
      ibCount: profileData.ib_count || 0,
      intendedMajors: profileData.intended_majors || [],
      academicInterests: profileData.academic_interests || '',
    },
    targetSchools: (schoolsData || []).map((school: any) => {
      const college = school.colleges

      return {
        id: college?.id || school.college_id || school.id,
        name: college?.name || school.name,
        tier: school.type as any || 'Target',
        satRange: [college?.sat_low || 0, college?.sat_high || 0] as [number, number],
        actRange: [college?.act_low || 0, college?.act_high || 0] as [number, number],
        admissionRate: college?.admission_rate || 0,
        majorOfferingsCount: college?.major_offerings_count || 0,
      }
    }),
    constraints: profileData.constraints || {
      monthsUntilDeadline: 12,
      budgetForNewActivities: false,
      geographicConstraints: [],
    },
    schoolFits: [],
  }

  return profile
}

export async function saveNarrativesAction(profileId: string, narratives: any[]) {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  // Delete existing narratives for this profile
  await supabase.from('narratives').delete().eq('profile_id', profileId)

  // Insert new narratives
  if (narratives.length > 0) {
    const narrativesData = narratives.map(narrative => ({
      profile_id: profileId,
      title: narrative.title,
      theme: narrative.theme,
      coherence_score: narrative.coherenceScore,
      narrative_data: narrative,
      selected: false,
    }))

    const { error } = await supabase
      .from('narratives')
      .insert(narrativesData)

    if (error) {
      console.error('Narratives save error:', error)
      throw new Error(`Failed to save narratives: ${error.message}`)
    }
  }

  return { success: true }
}

export async function loadNarrativesAction(): Promise<any[]> {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return []
  }

  // Get profile for user
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profileData) return []

  // Load narratives
  const { data: narrativesData } = await supabase
    .from('narratives')
    .select('narrative_data')
    .eq('profile_id', profileData.id)

  return (narrativesData || [])
    .map(n => n.narrative_data)
    .filter(Boolean)
}
