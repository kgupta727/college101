/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

const SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools'

function parseRange(range) {
  if (!range || typeof range !== 'string') return { low: null, high: null }
  const parts = range.split('-').map((value) => Number(value.trim()))
  if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) return { low: null, high: null }
  return { low: parts[0], high: parts[1] }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchPage(apiKey, page, retries = 3) {
  const params = new URLSearchParams({
    api_key: apiKey,
    per_page: '100',
    page: String(page),
    fields: [
      'school.name',
      'school.school_url',
      'latest.admissions.admission_rate.overall',
      'latest.admissions.sat_scores.middle_50_range.critical_reading',
      'latest.admissions.sat_scores.middle_50_range.math',
      'latest.admissions.act_scores.middle_50_range.cumulative',
    ].join(','),
  })

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${SCORECARD_API}?${params.toString()}`)
      
      // Retry on 5xx errors
      if (response.status >= 500) {
        if (attempt < retries - 1) {
          console.log(`API error ${response.status}, retrying in ${(attempt + 1) * 2}s...`)
          await sleep((attempt + 1) * 2000)
          continue
        }
        throw new Error(`Scorecard API error: ${response.status}`)
      }
      
      if (!response.ok) {
        throw new Error(`Scorecard API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      if (attempt < retries - 1) {
        console.log(`Request failed, retrying in ${(attempt + 1) * 2}s...`)
        await sleep((attempt + 1) * 2000)
      } else {
        throw error
      }
    }
  }
}

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey) throw new Error('Missing COLLEGE_SCORECARD_API_KEY')
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env vars')

  const supabase = createClient(supabaseUrl, supabaseKey)

  let page = 0
  let total = 1
  let processed = 0

  while (processed < total) {
    try {
      const payload = await fetchPage(apiKey, page)
      total = payload.metadata?.total || 0

      const rows = (payload.results || []).map((school) => {
        const satReading = parseRange(school['latest.admissions.sat_scores.middle_50_range.critical_reading'])
        const satMath = parseRange(school['latest.admissions.sat_scores.middle_50_range.math'])
        const act = parseRange(school['latest.admissions.act_scores.middle_50_range.cumulative'])

        const satLow = satReading.low && satMath.low ? satReading.low + satMath.low : null
        const satHigh = satReading.high && satMath.high ? satReading.high + satMath.high : null

        return {
          name: school['school.name'],
          website: school['school.school_url'] ? `https://${school['school.school_url']}` : null,
          admission_rate: school['latest.admissions.admission_rate.overall']
            ? Math.round(school['latest.admissions.admission_rate.overall'] * 10000) / 100
            : null,
          sat_low: satLow,
          sat_high: satHigh,
          act_low: act.low,
          act_high: act.high,
          source_url: 'https://collegescorecard.ed.gov/',
        }
      }).filter((row) => row.name)

      console.log(`Page ${page}: ${rows.length} rows to upsert`)
      if (page === 0 && rows.length > 0) {
        console.log('First row sample:', JSON.stringify(rows[0], null, 2))
      }

      if (rows.length > 0) {
        const { data, error } = await supabase
          .from('colleges')
          .upsert(rows, { onConflict: 'name' })
          .select()

        if (error) {
          console.error('Upsert error:', JSON.stringify(error, null, 2))
          throw error
        }
        
        console.log(`Page ${page}: Upserted ${data?.length || 0} rows`)
      }

      processed += payload.results?.length || 0
      page += 1
      console.log(`Synced ${Math.min(processed, total)} / ${total}`)

      if (!payload.results || payload.results.length === 0) break
      
      // Small delay to be gentle on the API
      await sleep(200)
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message)
      console.log('Continuing with next page...')
      page += 1
      await sleep(2000)
    }
  }

  console.log('College sync complete.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
