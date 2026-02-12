import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim()
  const limitParam = searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam || '50', 10) || 50, 200)

  const supabase = await createClient()

  let builder = supabase
    .from('colleges')
    .select('id,name,admission_rate,sat_low,sat_high,act_low,act_high,major_offerings_count,common_app_id,website')
    .order('name', { ascending: true })
    .limit(limit)

  if (query.length > 0) {
    builder = builder.ilike('name', `%${query}%`)
  }

  const { data, error } = await builder

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ colleges: data || [] })
}
