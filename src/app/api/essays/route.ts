import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all essay drafts for the user with college and supplement details
  const { data: drafts, error } = await supabase
    .from('essay_drafts')
    .select(`
      *,
      college:colleges(id, name),
      supplement:college_supplements(id, prompt, word_limit, prompt_type)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ drafts })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { essay_type, college_id, supplement_id, content, title, notes, is_primary } = body

  // Validate required fields
  if (!essay_type || (essay_type === 'supplement' && !supplement_id)) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Get next version number
  const { data: existing } = await supabase
    .from('essay_drafts')
    .select('version_number')
    .eq('user_id', user.id)
    .eq('essay_type', essay_type)
    .eq('college_id', college_id || null)
    .eq('supplement_id', supplement_id || null)
    .order('version_number', { ascending: false })
    .limit(1)

  const version_number = existing && existing.length > 0 ? existing[0].version_number + 1 : 1

  // If this is marked as primary, unmark others
  if (is_primary) {
    await supabase
      .from('essay_drafts')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('essay_type', essay_type)
      .eq('college_id', college_id || null)
      .eq('supplement_id', supplement_id || null)
  }

  // Insert the draft
  const { data: draft, error } = await supabase
    .from('essay_drafts')
    .insert({
      user_id: user.id,
      essay_type,
      college_id: college_id || null,
      supplement_id: supplement_id || null,
      content: content || '',
      title,
      notes,
      is_primary: is_primary || false,
      version_number,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch with college + supplement joins so the client doesn't need a second GET
  const { data: draftWithJoins } = await supabase
    .from('essay_drafts')
    .select(`
      *,
      college:colleges(id, name),
      supplement:college_supplements(id, prompt, word_limit, prompt_type)
    `)
    .eq('id', draft.id)
    .single()

  return NextResponse.json({ draft: draftWithJoins ?? draft })
}
