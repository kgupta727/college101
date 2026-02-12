/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('Using URL:', supabaseUrl)
  console.log('Using key:', supabaseKey ? 'Present' : 'MISSING')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Try to count colleges
  const { count, error: countError } = await supabase
    .from('colleges')
    .select('*', { count: 'exact', head: true })

  console.log('\n=== College Count ===')
  console.log('Count:', count)
  console.log('Error:', countError)

  // Try to get first 5 colleges
  const { data, error } = await supabase
    .from('colleges')
    .select('id,name')
    .limit(5)

  console.log('\n=== First 5 Colleges ===')
  console.log('Data:', data)
  console.log('Error:', error)

  // Search for Harvard
  const { data: harvardData, error: harvardError } = await supabase
    .from('colleges')
    .select('id,name')
    .ilike('name', '%Harvard%')

  console.log('\n=== Harvard Search ===')
  console.log('Data:', harvardData)
  console.log('Error:', harvardError)

  // Try to insert a test college
  console.log('\n=== Test Insert ===')
  const { data: insertData, error: insertError } = await supabase
    .from('colleges')
    .insert({ name: 'Test College' })
    .select()

  console.log('Insert Data:', insertData)
  console.log('Insert Error:', insertError)
}

main().catch(console.error)
