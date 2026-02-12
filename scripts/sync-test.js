/* eslint-disable no-console */

const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

const SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools'

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('API Key:', apiKey ? 'Present' : 'MISSING')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseKey ? 'Present' : 'MISSING')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch just first page
  const params = new URLSearchParams({
    api_key: apiKey,
    per_page: '5', // Just 5 for testing
    page: '0',
    fields: ['school.name', 'school.school_url'].join(','),
  })

  console.log('\nFetching from College Scorecard...')
  const response = await fetch(`${SCORECARD_API}?${params.toString()}`)
  const payload = await response.json()

  console.log('Results:', payload.results?.length)
  console.log('First result:', payload.results?.[0])

  const rows = (payload.results || []).map((school) => ({
    name: school['school.name'],
    website: school['school.school_url'] ? `https://${school['school.school_url']}` : null,
    source_url: 'https://collegescorecard.ed.gov/',
  })).filter((row) => row.name)

  console.log('\nRows to insert:', rows.length)
  console.log('First row:', rows[0])

  console.log('\nAttempting upsert...')
  const { data, error } = await supabase
    .from('colleges')
    .upsert(rows, { onConflict: 'name' })
    .select()

  console.log('Upsert data:', data)
  console.log('Upsert error:', error)
}

main().catch(console.error)
