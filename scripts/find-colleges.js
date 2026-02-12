/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const searches = [
    'Illinois Urbana',
    'Arizona State',
    'Texas Austin'
  ]
  
  for (const name of searches) {
    console.log(`\nSearching for: ${name}`)
    
    const { data } = await supabase
      .from('colleges')
      .select('id, name, admission_rate')
      .ilike('name', `%${name}%`)
      .order('admission_rate', { ascending: true, nullsLast: true })
      .limit(5)
    
    if (data && data.length > 0) {
      data.forEach(c => {
        const rate = c.admission_rate ? `${(c.admission_rate * 100).toFixed(1)}%` : 'N/A'
        console.log(`  - ${c.name} (${rate})`)
      })
    } else {
      console.log(`  ✗ Not found`)
    }
  }
}

main().catch(console.error)
