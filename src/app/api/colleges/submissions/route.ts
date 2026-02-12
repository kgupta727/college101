import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const collegeName = (body?.collegeName || '').trim()
  const website = (body?.website || '').trim()

  if (!collegeName) {
    return NextResponse.json({ error: 'College name is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('college_submissions')
    .insert({
      college_name: collegeName,
      website: website || null,
      submitted_by: user.id,
      status: 'pending',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
