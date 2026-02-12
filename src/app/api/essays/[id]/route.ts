import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function PATCH(request: Request, props: { params: Params }) {
  const params = await props.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content, title, notes, is_primary, common_app_prompt_number } = body

  // If marking as primary, unmark others first
  if (is_primary) {
    // Get the draft to find its essay context
    const { data: currentDraft } = await supabase
      .from('essay_drafts')
      .select('essay_type, college_id, supplement_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (currentDraft) {
      await supabase
        .from('essay_drafts')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('essay_type', currentDraft.essay_type)
        .eq('college_id', currentDraft.college_id)
        .eq('supplement_id', currentDraft.supplement_id)
    }
  }

  // Update the draft
  const { data: draft, error } = await supabase
    .from('essay_drafts')
    .update({
      content,
      title,
      notes,
      is_primary,
      common_app_prompt_number,
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ draft })
}

export async function DELETE(request: Request, props: { params: Params }) {
  const params = await props.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('essay_drafts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
