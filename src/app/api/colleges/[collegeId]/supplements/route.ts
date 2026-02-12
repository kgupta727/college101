import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, context: { params: Promise<{ collegeId: string }> }) {
  const { collegeId } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('college_supplements')
    .select('id,college_id,prompt,word_limit,prompt_type,school_values,strategic_focus,source_url')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ supplements: data || [] })
}

export async function POST(request: Request, context: { params: Promise<{ collegeId: string }> }) {
  const { collegeId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const prompt = (body?.prompt || '').trim()
  const wordLimit = body?.wordLimit ? Number(body.wordLimit) : null
  const promptType = (body?.promptType || '').trim()
  const sourceUrl = (body?.sourceUrl || '').trim()

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('supplement_submissions')
    .insert({
      college_id: collegeId,
      prompt,
      word_limit: Number.isFinite(wordLimit) ? wordLimit : null,
      prompt_type: promptType || null,
      source_url: sourceUrl || null,
      submitted_by: user.id,
      status: 'pending',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
