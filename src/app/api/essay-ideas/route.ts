import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEssayIdeas } from '@/lib/openai'
import { StudentProfile, Activity } from '@/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const essayType = searchParams.get('essay_type') as 'common_app' | 'supplement' | null
  const collegeId = searchParams.get('college_id')
  const supplementId = searchParams.get('supplement_id')
  const promptNumber = searchParams.get('common_app_prompt_number')

  if (!essayType) {
    return NextResponse.json({ error: 'Missing essay_type' }, { status: 400 })
  }

  if (essayType === 'common_app' && !promptNumber) {
    return NextResponse.json({ ideas: [] })
  }

  const query = supabase
    .from('essay_ideas')
    .select('*')
    .eq('user_id', user.id)
    .eq('essay_type', essayType)
    .order('created_at', { ascending: false })
    .limit(20)

  if (essayType === 'supplement') {
    query.eq('college_id', collegeId).eq('supplement_id', supplementId)
  } else {
    query.eq('college_id', null).eq('supplement_id', null)
    if (promptNumber) {
      query.eq('common_app_prompt_number', Number(promptNumber))
    }
  }

  const { data: ideas, error } = await query

  if (error) {
    if (
      essayType === 'common_app' &&
      promptNumber &&
      error.message.toLowerCase().includes('common_app_prompt_number')
    ) {
      const fallbackQuery = supabase
        .from('essay_ideas')
        .select('*')
        .eq('user_id', user.id)
        .eq('essay_type', essayType)
        .eq('college_id', null)
        .eq('supplement_id', null)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: fallbackIdeas, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({ ideas: fallbackIdeas || [] })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ideas: ideas || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    essay_type,
    college_id,
    supplement_id,
    common_app_prompt_number,
    user_context,
  } = body

  if (!essay_type) {
    return NextResponse.json({ error: 'Missing essay_type' }, { status: 400 })
  }

  if (essay_type === 'common_app' && !common_app_prompt_number) {
    return NextResponse.json({ error: 'Select a Common App prompt first' }, { status: 400 })
  }

  // Load profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profileData) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: activitiesData } = await supabase
    .from('activities')
    .select('*')
    .eq('profile_id', profileData.id)

  const profile: StudentProfile = {
    id: profileData.id,
    name: profileData.name || '',
    activities: (activitiesData || []).map((activity: any) => ({
      id: activity.id,
      name: activity.name,
      role: activity.leadership_position || '',
      hoursPerWeek: activity.hours_per_week || 0,
      yearsInvolved: activity.weeks_per_year ? activity.weeks_per_year / 40 : 0,
      description: activity.description || '',
      tags: activity.category ? activity.category.split(', ').filter(Boolean) as any : [],
      impact: '',
    })) as Activity[],
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
    targetSchools: [],
    constraints: profileData.constraints || {
      monthsUntilDeadline: 12,
      budgetForNewActivities: false,
      geographicConstraints: [],
    },
    schoolFits: [],
  }

  // Load context for supplement/common app
  let collegeName: string | undefined
  let supplementPrompt: string | undefined
  let supplementPromptType: string | undefined
  let supplementWordLimit: number | null = null

  if (college_id) {
    const { data: collegeData } = await supabase
      .from('colleges')
      .select('name')
      .eq('id', college_id)
      .single()
    collegeName = collegeData?.name
  }

  if (supplement_id) {
    const { data: supplementData } = await supabase
      .from('college_supplements')
      .select('prompt,word_limit,prompt_type')
      .eq('id', supplement_id)
      .single()
    supplementPrompt = supplementData?.prompt
    supplementPromptType = supplementData?.prompt_type
    supplementWordLimit = supplementData?.word_limit || null
  }

  // Load existing ideas to avoid repetition
  const existingQuery = supabase
    .from('essay_ideas')
    .select('title,idea_text,angle_type')
    .eq('user_id', user.id)
    .eq('essay_type', essay_type)
    .order('created_at', { ascending: false })
    .limit(25)

  if (essay_type === 'supplement') {
    existingQuery.eq('college_id', college_id || null).eq('supplement_id', supplement_id || null)
  } else {
    existingQuery.eq('college_id', null).eq('supplement_id', null)
    if (common_app_prompt_number) {
      existingQuery.eq('common_app_prompt_number', Number(common_app_prompt_number))
    }
  }

  const { data: existingIdeas } = await existingQuery

  const commonAppPrompts: Record<number, string> = {
    1: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
    2: "The lessons we take from obstacles we encounter can be fundamental to later success.",
    3: "Reflect on a time when you questioned or challenged a belief or idea.",
    4: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way.",
    5: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    6: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time.",
    7: "Share an essay on any topic of your choice.",
  }

  const ideas = await generateEssayIdeas({
    profile,
    essayType: essay_type,
    collegeName,
    supplementPrompt,
    supplementPromptType,
    supplementWordLimit,
    commonAppPromptNumber: common_app_prompt_number || null,
    commonAppPromptText: common_app_prompt_number ? commonAppPrompts[Number(common_app_prompt_number)] : null,
    userContext: user_context || null,
    existingIdeas: existingIdeas || [],
  })

  const insertPayload = ideas.map((idea: any) => ({
    user_id: user.id,
    essay_type,
    college_id: essay_type === 'supplement' ? (college_id || null) : null,
    supplement_id: essay_type === 'supplement' ? (supplement_id || null) : null,
    common_app_prompt_number: essay_type === 'common_app' ? (common_app_prompt_number || null) : null,
    title: idea.title,
    idea_text: idea.idea_text,
    angle_type: idea.angle_type,
    risk_level: idea.risk_level,
    difficulty: idea.difficulty,
    proof_points: idea.proof_points || [],
    uniqueness_rationale: idea.uniqueness_rationale,
    source_context: user_context || null,
  }))

  const { data: savedIdeas, error } = await supabase
    .from('essay_ideas')
    .insert(insertPayload)
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ideas: savedIdeas || [] })
}
