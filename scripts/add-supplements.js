/* eslint-disable no-console */

// Load environment variables from .env.local
const { loadEnvConfig } = require('@next/env')
const projectDir = require('path').resolve(__dirname, '..')
loadEnvConfig(projectDir)

const { createClient } = require('@supabase/supabase-js')

// Real supplemental essay prompts for 2024-2025 cycle
const SUPPLEMENTS = {
  'Harvard University': [
    {
      prompt: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard?',
      word_limit: 200,
      prompt_type: 'diversity',
      school_values: ['diversity', 'community', 'perspective'],
      strategic_focus: 'Emphasize unique background and how it will contribute to campus diversity'
    },
    {
      prompt: 'Briefly describe an intellectual experience that was important to you.',
      word_limit: 200,
      prompt_type: 'intellectual-vitality',
      school_values: ['intellectualCuriosity', 'academicExcellence'],
      strategic_focus: 'Show genuine intellectual curiosity and depth of thinking'
    },
    {
      prompt: 'Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are.',
      word_limit: 200,
      prompt_type: 'activities',
      school_values: ['leadership', 'community'],
      strategic_focus: 'Connect activities to personal growth and impact'
    }
  ],
  'Stanford University': [
    {
      prompt: 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.',
      word_limit: 250,
      prompt_type: 'intellectual-vitality',
      school_values: ['intellectualCuriosity', 'innovation'],
      strategic_focus: 'Demonstrate authentic intellectual passion and curiosity'
    },
    {
      prompt: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.',
      word_limit: 250,
      prompt_type: 'personal',
      school_values: ['community', 'authenticity'],
      strategic_focus: 'Be genuine and show personality while revealing values'
    },
    {
      prompt: 'Tell us about something that is meaningful to you and why.',
      word_limit: 250,
      prompt_type: 'values',
      school_values: ['values', 'purpose'],
      strategic_focus: 'Show depth of reflection and what matters most to you'
    }
  ],
  'Massachusetts Institute of Technology': [
    {
      prompt: 'Describe the world you come from (for example, your family, school, community, city, or town). How has that world shaped your dreams and aspirations?',
      word_limit: 300,
      prompt_type: 'background',
      school_values: ['community', 'innovation'],
      strategic_focus: 'Connect background to STEM aspirations and MIT fit'
    },
    {
      prompt: 'Tell us about the most significant challenge you\'ve faced or something important that didn\'t go according to plan. How did you manage the situation?',
      word_limit: 300,
      prompt_type: 'challenge',
      school_values: ['resilience', 'problemSolving'],
      strategic_focus: 'Emphasize problem-solving approach and growth mindset'
    },
    {
      prompt: 'At MIT, we bring people together to better the lives of others. MIT students work to improve their communities in different ways, from tackling the world\'s biggest challenges to being a good friend. Describe one way you have collaborated with others to effect positive change.',
      word_limit: 300,
      prompt_type: 'community',
      school_values: ['collaboration', 'socialImpact'],
      strategic_focus: 'Show teamwork and practical impact of your contributions'
    }
  ],
  'Yale University': [
    {
      prompt: 'What is it about Yale that has led you to apply?',
      word_limit: 125,
      prompt_type: 'why-school',
      school_values: ['fit', 'community'],
      strategic_focus: 'Demonstrate specific knowledge of Yale programs and culture'
    },
    {
      prompt: 'What inspires you?',
      word_limit: 200,
      prompt_type: 'values',
      school_values: ['intellectualCuriosity', 'passion'],
      strategic_focus: 'Show depth and authenticity in your motivations'
    },
    {
      prompt: 'If you could teach any college course, write a book, or create an original piece of art of any kind, what would it be?',
      word_limit: 200,
      prompt_type: 'creativity',
      school_values: ['creativity', 'intellectualCuriosity'],
      strategic_focus: 'Demonstrate creative thinking and intellectual interests'
    }
  ],
  'Princeton University': [
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
  ],
  'Columbia University': [
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
  ],
  'University of Chicago': [
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
  ],
  'University of Pennsylvania': [
    {
      prompt: 'Write a short thank-you note to someone you have not yet thanked and would like to acknowledge.',
      word_limit: 150,
      prompt_type: 'gratitude',
      school_values: ['community', 'reflection'],
      strategic_focus: 'Show depth of character and meaningful relationships'
    },
    {
      prompt: 'How will you explore community at Penn? Consider how Penn will help shape your perspective, and how your experiences and perspective will help shape Penn.',
      word_limit: 150,
      prompt_type: 'community',
      school_values: ['community', 'collaboration'],
      strategic_focus: 'Connect specific Penn communities to your interests'
    }
  ],
  'Duke University': [
    {
      prompt: 'What is your sense of Duke as a university and a community, and why do you consider it a good match for you?',
      word_limit: 250,
      prompt_type: 'why-school',
      school_values: ['community', 'scholarship'],
      strategic_focus: 'Show understanding of Duke\'s collaborative culture and specific programs'
    }
  ],
  'Northwestern University': [
    {
      prompt: 'Why Northwestern? We want to be sure you know what makes Northwestern special and we want to hear about what aspects of our community excite you.',
      word_limit: 300,
      prompt_type: 'why-school',
      school_values: ['collaboration', 'innovation'],
      strategic_focus: 'Reference specific programs, research opportunities, or traditions'
    }
  ],
  'Brown University': [
    {
      prompt: 'Brown\'s Open Curriculum allows students to explore broadly while also diving deeply into their academic pursuits. Tell us about an academic interest (or interests) that excites you, and how you might pursue it at Brown.',
      word_limit: 250,
      prompt_type: 'academic-interest',
      school_values: ['intellectualCuriosity', 'independence'],
      strategic_focus: 'Show how Open Curriculum fits your learning style and goals'
    }
  ],
  'Cornell University': [
    {
      prompt: 'Why are you drawn to studying the major you have selected and specifically, why do you want to pursue this major at Cornell?',
      word_limit: 650,
      prompt_type: 'why-major',
      school_values: ['academicExcellence', 'preprofessional'],
      strategic_focus: 'Connect major to specific Cornell resources and career goals'
    }
  ],
  'University of California-Berkeley': [
    {
      prompt: 'Please describe how you have prepared for your intended major, including your readiness to succeed in your upper-division courses once you enroll at the university.',
      word_limit: 350,
      prompt_type: 'academic-preparation',
      school_values: ['academicExcellence', 'preparation'],
      strategic_focus: 'Demonstrate subject mastery and readiness for rigorous coursework'
    }
  ],
  'University of California-Los Angeles': [
    {
      prompt: 'Please describe how you have prepared for your intended major, including your readiness to succeed in your upper-division courses once you enroll at the university.',
      word_limit: 350,
      prompt_type: 'academic-preparation',
      school_values: ['academicExcellence', 'preparation'],
      strategic_focus: 'Show academic preparation and research into UCLA programs'
    }
  ],
  'University of Michigan-Ann Arbor': [
    {
      prompt: 'Everyone belongs to many different communities and/or groups defined by (among other things) shared geography, religion, ethnicity, income, cuisine, interest, race, ideology, or intellectual heritage. Choose one of the communities to which you belong, and describe that community and your place within it.',
      word_limit: 300,
      prompt_type: 'community',
      school_values: ['community', 'diversity'],
      strategic_focus: 'Show deep engagement with a community and leadership within it'
    },
    {
      prompt: 'Describe the unique qualities that attract you to the specific undergraduate College or School to which you are applying at the University of Michigan. How would that curriculum support your interests?',
      word_limit: 550,
      prompt_type: 'why-school',
      school_values: ['academicExcellence', 'fit'],
      strategic_focus: 'Reference specific programs, professors, or opportunities at UMich'
    }
  ],
  'Carnegie Mellon University': [
    {
      prompt: 'Most students choose their intended major or area of study based on a passion or inspiration that\'s developed over time – what passion or inspiration led you to choose this area of study?',
      word_limit: 300,
      prompt_type: 'why-major',
      school_values: ['passion', 'innovation'],
      strategic_focus: 'Show genuine passion and connection to CMU\'s interdisciplinary approach'
    },
    {
      prompt: 'Many students pursue college for a specific degree, career opportunity or personal goal. Whichever it may be, learning will be critical to achieve your ultimate goal. As you think ahead to the process of learning during your college years, how will you define a successful college experience?',
      word_limit: 300,
      prompt_type: 'goals',
      school_values: ['growth', 'purpose'],
      strategic_focus: 'Connect learning goals to CMU resources and culture'
    }
  ],
  'Dartmouth College': [
    {
      prompt: 'While arguing a Dartmouth-related case before the U.S. Supreme Court in 1818, Daniel Webster, Class of 1801, uttered this memorable line: "It is, sir, as I have said, a small college. And yet there are those who love it!" As you seek admission to the Class of 2029, what aspects of the college\'s program, community, or campus environment attract your interest?',
      word_limit: 250,
      prompt_type: 'why-school',
      school_values: ['community', 'intimacy'],
      strategic_focus: 'Emphasize Dartmouth\'s tight-knit community and unique traditions'
    }
  ],
  'New York University': [
    {
      prompt: 'We would like to know more about your interest in NYU. What motivated you to apply to NYU? Why have you applied or expressed interest in a particular campus, school, college, program, and or area of study? If you have applied to more than one, please also tell us why you are interested in these additional areas of study or campuses.',
      word_limit: 400,
      prompt_type: 'why-school',
      school_values: ['urbanEngagement', 'global'],
      strategic_focus: 'Connect NYC location and global opportunities to your goals'
    }
  ],
  'University of Southern California': [
    {
      prompt: 'Describe how you plan to pursue your academic interests and why you want to explore them at USC specifically. Please feel free to address your first- and second-choice major selections.',
      word_limit: 250,
      prompt_type: 'why-school',
      school_values: ['innovation', 'collaboration'],
      strategic_focus: 'Reference USC\'s interdisciplinary approach and Los Angeles location'
    }
  ],
  'California Institute of Technology': [
    {
      prompt: 'Caltech students are often known for their sense of humor and creative pranks. What do you like to do for fun?',
      word_limit: 200,
      prompt_type: 'personal',
      school_values: ['creativity', 'community'],
      strategic_focus: 'Show personality and fit with Caltech\'s quirky culture'
    },
    {
      prompt: 'The creativity, inventiveness, and innovation of Caltech\'s students, faculty, and researchers have won Nobel Prizes and put rovers on Mars. But Techers also imagine smaller scale innovations every day, from new ways to design solar cells to how to 3D-print dorm decor. How have you been a creator, inventor, or innovator in your own life?',
      word_limit: 200,
      prompt_type: 'innovation',
      school_values: ['innovation', 'problemSolving'],
      strategic_focus: 'Demonstrate hands-on innovation and maker mindset'
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

  console.log('Adding supplemental essays for top colleges...\n')

  for (const [collegeName, prompts] of Object.entries(SUPPLEMENTS)) {
    console.log(`\nProcessing: ${collegeName}`)
    
    // Find college
    const { data: colleges, error: findError } = await supabase
      .from('colleges')
      .select('id, name')
      .ilike('name', collegeName)
      .limit(1)

    if (findError) {
      console.error(`  Error finding college: ${findError.message}`)
      continue
    }

    if (!colleges || colleges.length === 0) {
      console.warn(`  College not found in database`)
      continue
    }

    const college = colleges[0]
    console.log(`  Found: ${college.name} (${college.id})`)

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
  }

  console.log('\n✅ Supplement sync complete!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
