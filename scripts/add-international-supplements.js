/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

// Real supplemental essay prompts for international-popular colleges
const SUPPLEMENTS = {
  'Georgia Institute of Technology-Main Campus': [
    {
      prompt: 'Why do you want to study your chosen major specifically at Georgia Tech?',
      word_limit: 300,
      prompt_type: 'why-major',
      school_values: ['innovation', 'technology', 'research'],
      strategic_focus: 'Connect major to Georgia Tech\'s cutting-edge research and innovation culture'
    }
  ],
  'Purdue University-Main Campus': [
    {
      prompt: 'How will opportunities at Purdue support your interests, both in and out of the classroom?',
      word_limit: 250,
      prompt_type: 'why-school',
      school_values: ['innovation', 'collaboration', 'research'],
      strategic_focus: 'Reference specific Purdue programs, research labs, or student organizations'
    },
    {
      prompt: 'Briefly discuss your reasons for pursuing the major you have selected.',
      word_limit: 250,
      prompt_type: 'why-major',
      school_values: ['academicExcellence', 'careerPreparation'],
      strategic_focus: 'Show clear connection between interests and chosen engineering/STEM field'
    }
  ],
  'University of Illinois Urbana-Champaign': [
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
  ],
  'Arizona State University-Tempe': [
    {
      prompt: 'Share why you are interested in the major you selected and describe how attending ASU will help you achieve your personal or professional goals.',
      word_limit: 350,
      prompt_type: 'why-major',
      school_values: ['innovation', 'entrepreneurship'],
      strategic_focus: 'Emphasize ASU\'s innovation focus and entrepreneurial opportunities'
    }
  ],
  'University of Texas at Austin': [
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
  'University of California-San Diego': [
    {
      prompt: 'Please describe how you have prepared for your intended major, including your readiness to succeed in your upper-division courses once you enroll at the university.',
      word_limit: 350,
      prompt_type: 'academic-preparation',
      school_values: ['academicExcellence', 'research'],
      strategic_focus: 'Demonstrate subject mastery and readiness for UCSD\'s rigorous STEM programs'
    }
  ],
  'University of California-Irvine': [
    {
      prompt: 'Please describe how you have prepared for your intended major, including your readiness to succeed in your upper-division courses once you enroll at the university.',
      word_limit: 350,
      prompt_type: 'academic-preparation',
      school_values: ['academicExcellence', 'preparation'],
      strategic_focus: 'Show academic preparation specific to UCI programs'
    }
  ],
  'University of California-Davis': [
    {
      prompt: 'Please describe how you have prepared for your intended major, including your readiness to succeed in your upper-division courses once you enroll at the university.',
      word_limit: 350,
      prompt_type: 'academic-preparation',
      school_values: ['academicExcellence', 'sustainability'],
      strategic_focus: 'Connect preparation to UC Davis strengths in agriculture, sustainability, or STEM'
    }
  ],
  'University of Washington-Seattle Campus': [
    {
      prompt: 'Tell us a story from your life, describing an experience that either demonstrates your character or helped to shape it.',
      word_limit: 650,
      prompt_type: 'personal',
      school_values: ['character', 'growth'],
      strategic_focus: 'Show genuine reflection and personal growth through storytelling'
    },
    {
      prompt: 'Our families and communities often define us and our individual worlds. Community might refer to your cultural group, extended family, religious group, neighborhood or school, sports team or club, co-workers, etc. Describe the world you come from and how you, as a product of it, might add to the diversity of the UW.',
      word_limit: 300,
      prompt_type: 'diversity',
      school_values: ['diversity', 'community'],
      strategic_focus: 'Connect international background to contributions to UW community'
    }
  ],
  'Boston University': [
    {
      prompt: 'What about being a student at Boston University most excites you?',
      word_limit: 300,
      prompt_type: 'why-school',
      school_values: ['urbanEngagement', 'research'],
      strategic_focus: 'Reference BU\'s Boston location and specific academic programs'
    }
  ],
  'Northeastern University': [
    {
      prompt: 'Northeastern\'s experience-powered learning model challenges students to forge their own paths within and beyond the classroom. What aspects of this model excite you?',
      word_limit: 200,
      prompt_type: 'why-school',
      school_values: ['experientialLearning', 'coop'],
      strategic_focus: 'Emphasize interest in co-op program and experiential learning'
    }
  ],
  'University of Wisconsin-Madison': [
    {
      prompt: 'Tell us why you decided to apply to the University of Wisconsin-Madison. In addition, please include why you are interested in studying the major(s) you have selected.',
      word_limit: 650,
      prompt_type: 'why-school',
      school_values: ['research', 'publicService'],
      strategic_focus: 'Connect research interests to UW-Madison\'s strengths'
    }
  ],
  'Pennsylvania State University-Main Campus': [
    {
      prompt: 'Please tell us something about yourself, your experiences, or activities that you believe would reflect positively on your ability to succeed at Penn State.',
      word_limit: 500,
      prompt_type: 'personal',
      school_values: ['resilience', 'academicExcellence'],
      strategic_focus: 'Demonstrate readiness for Penn State\'s rigorous programs'
    }
  ],
  'Ohio State University-Main Campus': [
    {
      prompt: 'Why are you interested in your chosen major(s)? Please share any experiences or influences that have shaped this interest.',
      word_limit: 400,
      prompt_type: 'why-major',
      school_values: ['academicExcellence', 'research'],
      strategic_focus: 'Show authentic interest in major and connection to OSU resources'
    }
  ],
  'University of Florida': [
    {
      prompt: 'Please provide more details on your most meaningful commitment outside of the classroom while in high school and explain why it was meaningful.',
      word_limit: 250,
      prompt_type: 'activities',
      school_values: ['leadership', 'community'],
      strategic_focus: 'Demonstrate sustained commitment and leadership'
    }
  ],
  'Texas A&M University-College Station': [
    {
      prompt: 'Tell us your story. What unique opportunities or challenges have you experienced throughout your high school career that have shaped who you are today?',
      word_limit: 500,
      prompt_type: 'personal',
      school_values: ['resilience', 'tradition'],
      strategic_focus: 'Show character development and fit with Texas A&M values'
    }
  ],
  'University of Minnesota-Twin Cities': [
    {
      prompt: 'Choose one of the communities to which you belong, and describe that community and your place within it.',
      word_limit: 150,
      prompt_type: 'community',
      school_values: ['community', 'diversity'],
      strategic_focus: 'Highlight international perspective and community engagement'
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

  console.log('Adding supplemental essays for international-popular colleges...\n')

  let totalAdded = 0
  let totalColleges = 0

  for (const [collegeName, prompts] of Object.entries(SUPPLEMENTS)) {
    console.log(`\nProcessing: ${collegeName}`)
    
    // Find college
    const { data: colleges, error: findError } = await supabase
      .from('colleges')
      .select('id, name')
      .eq('name', collegeName)
      .limit(1)

    if (findError) {
      console.error(`  Error finding college: ${findError.message}`)
      continue
    }

    if (!colleges || colleges.length === 0) {
      console.warn(`  ⚠ College not found in database - skipping`)
      continue
    }

    const college = colleges[0]
    console.log(`  Found: ${college.name}`)

    // Check if supplements already exist
    const { data: existing } = await supabase
      .from('college_supplements')
      .select('id')
      .eq('college_id', college.id)

    if (existing && existing.length > 0) {
      console.log(`  ⊗ Skipping - ${existing.length} supplements already exist`)
      continue
    }

    // Add supplements
    const supplementsToAdd = prompts.map(p => ({
      college_id: college.id,
      prompt: p.prompt,
      word_limit: p.word_limit,
      prompt_type: p.prompt_type,
      school_values: p.school_values,
      strategic_focus: p.strategic_focus,
      source_url: 'https://www.commonapp.org',
    }))

    const { error: insertError } = await supabase
      .from('college_supplements')
      .insert(supplementsToAdd)

    if (insertError) {
      console.error(`  Error inserting supplements: ${insertError.message}`)
      continue
    }

    console.log(`  ✓ Added ${prompts.length} supplement(s)`)
    totalAdded += prompts.length
    totalColleges++
  }

  console.log(`\n✅ Complete! Added ${totalAdded} supplements across ${totalColleges} colleges`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
