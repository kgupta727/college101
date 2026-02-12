/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

// Missing international-popular colleges
const MISSING_COLLEGES = [
  {
    name: 'University of Illinois Urbana-Champaign',
    supplements: [
      {
        prompt: 'Explain, in detail, an experience you\'ve had in the past 3 to 4 years related to your first-choice major. This can be an experience from an extracurricular activity, in a class you\'ve taken, or through something else.',
        word_limit: 300,
        prompt_type: 'academic-preparation',
        school_values: ['academicExcellence', 'preparation'],
        strategic_focus: 'Demonstrate hands-on experience and genuine passion for your major'
      },
      {
        prompt: 'Describe your personal and/or career goals after graduating from UIUC and how your selected first-choice major will help you achieve them.',
        word_limit: 300,
        prompt_type: 'goals',
        school_values: ['purpose', 'careerPreparation'],
        strategic_focus: 'Show clear vision and connection between UIUC education and future goals'
      }
    ]
  }
]

// Supplements for colleges that already exist in DB
const EXISTING_COLLEGE_SUPPLEMENTS = {
  'The University of Texas at Austin': [
    {
      prompt: 'Why are you interested in the major you indicated as your first-choice major?',
      word_limit: 300,
      prompt_type: 'why-major',
      school_values: ['academicExcellence', 'research'],
      strategic_focus: 'Connect major to UT Austin\'s strengths and research opportunities'
    },
    {
      prompt: 'Think of all the activities and how you spend your time outside of class. Choose one activity and tell us why it is important to you.',
      word_limit: 300,
      prompt_type: 'activities',
      school_values: ['leadership', 'passion'],
      strategic_focus: 'Show depth of commitment and personal growth through one activity'
    }
  ],
  'Arizona State University Digital Immersion': [
    {
      prompt: 'Share why you are interested in the major you selected and describe how attending ASU will help you achieve your personal or professional goals.',
      word_limit: 350,
      prompt_type: 'why-major',
      school_values: ['innovation', 'entrepreneurship'],
      strategic_focus: 'Emphasize ASU\'s innovation focus and entrepreneurial opportunities'
    }
  ]
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Adding missing international-popular colleges and supplements...\n')

  // Add missing colleges
  for (const college of MISSING_COLLEGES) {
    console.log(`\nProcessing: ${college.name}`)
    
    // Insert college (will be fetched from API to get admission rate)
    const { data: insertedCollege, error: insertError } = await supabase
      .from('colleges')
      .upsert({
        name: college.name
      }, {
        onConflict: 'name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (insertError) {
      console.error(`  Error inserting college: ${insertError.message}`)
      continue
    }

    console.log(`  ✓ Added college (${insertedCollege.id})`)

    // Add supplements
    const supplementsToAdd = college.supplements.map(s => ({
      college_id: insertedCollege.id,
      prompt: s.prompt,
      word_limit: s.word_limit,
      prompt_type: s.prompt_type,
      school_values: s.school_values,
      strategic_focus: s.strategic_focus,
      source_url: 'https://www.commonapp.org'
    }))

    const { error: supplementError } = await supabase
      .from('college_supplements')
      .insert(supplementsToAdd)

    if (supplementError) {
      console.error(`  Error inserting supplements: ${supplementError.message}`)
      continue
    }

    console.log(`  ✓ Added ${college.supplements.length} supplement(s)`)
  }

  // Add supplements for existing colleges
  for (const [collegeName, prompts] of Object.entries(EXISTING_COLLEGE_SUPPLEMENTS)) {
    console.log(`\n\nProcessing: ${collegeName}`)
    
    const { data: collegeData, error: findError } = await supabase
      .from('colleges')
      .select('id, name')
      .eq('name', collegeName)
      .single()

    if (findError || !collegeData) {
      console.error(`  Error finding college: ${findError?.message || 'Not found'}`)
      continue
    }

    console.log(`  Found: ${collegeData.name} (${collegeData.id})`)

    // Check if supplements already exist
    const { data: existing } = await supabase
      .from('college_supplements')
      .select('id')
      .eq('college_id', collegeData.id)

    if (existing && existing.length > 0) {
      console.log(`  ⊗ Skipping - ${existing.length} supplements already exist`)
      continue
    }

    const supplementsToAdd = prompts.map(s => ({
      college_id: collegeData.id,
      prompt: s.prompt,
      word_limit: s.word_limit,
      prompt_type: s.prompt_type,
      school_values: s.school_values,
      strategic_focus: s.strategic_focus,
      source_url: 'https://www.commonapp.org'
    }))

    const { error: supplementError } = await supabase
      .from('college_supplements')
      .insert(supplementsToAdd)

    if (supplementError) {
      console.error(`  Error inserting supplements: ${supplementError.message}`)
      continue
    }

    console.log(`  ✓ Added ${prompts.length} supplement(s)`)
  }

  console.log('\n✅ Missing colleges and supplements added!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
