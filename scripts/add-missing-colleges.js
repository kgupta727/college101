/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

const MISSING_COLLEGES = [
  {
    name: 'Princeton University',
    admission_rate: 0.045,
    supplements: [
      {
        prompt: 'Princeton values community and encourages students, faculty, staff and leadership to engage in respectful conversations that can expand their perspectives and challenge their ideas and beliefs. As a prospective member of this community, reflect on how your lived experiences will impact the conversations you will have in the classroom, the dining hall or other campus spaces. What lessons have you learned in life thus far? What will your classmates learn from you? In short, how has your lived experience shaped you?',
        word_limit: 500,
        prompt_type: 'diversity',
        school_values: ['diversity', 'community', 'perspective'],
        strategic_focus: 'Connect personal background to intellectual and social contributions'
      },
      {
        prompt: 'Princeton has a longstanding commitment to understanding our responsibility to society through service and civic engagement. How does your own story intersect with these ideals?',
        word_limit: 250,
        prompt_type: 'service',
        school_values: ['socialImpact', 'civicEngagement'],
        strategic_focus: 'Show commitment to service and societal impact'
      }
    ]
  },
  {
    name: 'University of Chicago',
    admission_rate: 0.049,
    supplements: [
      {
        prompt: 'How does the University of Chicago, as you know it now, satisfy your desire for a particular kind of learning, community, and future? Please address with some specificity your own wishes and how they relate to UChicago.',
        word_limit: 650,
        prompt_type: 'why-school',
        school_values: ['intellectualCuriosity', 'inquiry'],
        strategic_focus: 'Engage deeply with UChicago\'s intellectual culture and quirky traditions'
      },
      {
        prompt: 'Essay Option (Extended Essay - choose one unique prompt)',
        word_limit: 650,
        prompt_type: 'creative',
        school_values: ['creativity', 'intellectualPlayfulness'],
        strategic_focus: 'Take intellectual risks and show creative thinking'
      }
    ]
  }
]

const COLUMBIA_SUPPLEMENTS = [
  {
    prompt: 'Why are you interested in attending Columbia University? We encourage you to consider the aspect(s) that you find unique and compelling about Columbia.',
    word_limit: 200,
    prompt_type: 'why-school',
    school_values: ['corecurriculum', 'urbanEngagement'],
    strategic_focus: 'Reference Core Curriculum and NYC opportunities specifically'
  },
  {
    prompt: 'List a selection of texts, resources and outlets that have contributed to your intellectual development outside of academic courses, including but not limited to books, journals, websites, podcasts, essays, plays, presentations, videos, museums and other content that you enjoy.',
    word_limit: 150,
    prompt_type: 'intellectual-vitality',
    school_values: ['intellectualCuriosity', 'selfDirectedLearning'],
    strategic_focus: 'Show breadth and depth of intellectual curiosity'
  }
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Adding missing colleges and supplements...\n')

  // Add missing colleges
  for (const college of MISSING_COLLEGES) {
    console.log(`\nProcessing: ${college.name}`)
    
    // Insert college
    const { data: insertedCollege, error: insertError } = await supabase
      .from('colleges')
      .upsert({
        name: college.name,
        admission_rate: college.admission_rate
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

  // Add Columbia supplements (college already exists as "Columbia University in the City of New York")
  console.log(`\n\nProcessing: Columbia University`)
  const { data: columbiaData, error: columbiaFindError } = await supabase
    .from('colleges')
    .select('id, name')
    .eq('name', 'Columbia University in the City of New York')
    .single()

  if (columbiaFindError || !columbiaData) {
    console.error(`  Error finding Columbia: ${columbiaFindError?.message || 'Not found'}`)
  } else {
    console.log(`  Found: ${columbiaData.name} (${columbiaData.id})`)

    const supplementsToAdd = COLUMBIA_SUPPLEMENTS.map(s => ({
      college_id: columbiaData.id,
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
    } else {
      console.log(`  ✓ Added ${COLUMBIA_SUPPLEMENTS.length} supplement(s)`)
    }
  }

  console.log('\n✅ Missing colleges and supplements added!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
