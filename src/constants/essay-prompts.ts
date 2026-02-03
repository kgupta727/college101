/**
 * Real college essay prompts for 2024-2025 application cycle
 * Sources: Common App, individual college websites
 */

// Common App 2024-2025 prompts (choose 1, 650 words)
export const COMMON_APP_PROMPTS = [
  {
    id: 'ca-1',
    prompt: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.',
    type: 'identity-background',
    keywords: ['identity', 'background', 'culture', 'heritage', 'formative experience']
  },
  {
    id: 'ca-2',
    prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
    type: 'challenge-growth',
    keywords: ['challenge', 'failure', 'resilience', 'growth', 'learning']
  },
  {
    id: 'ca-3',
    prompt: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
    type: 'intellectual-engagement',
    keywords: ['questioning', 'critical thinking', 'beliefs', 'intellectual curiosity']
  },
  {
    id: 'ca-4',
    prompt: 'Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?',
    type: 'gratitude-impact',
    keywords: ['gratitude', 'appreciation', 'relationships', 'community']
  },
  {
    id: 'ca-5',
    prompt: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.',
    type: 'growth-realization',
    keywords: ['accomplishment', 'personal growth', 'self-discovery', 'maturity']
  },
  {
    id: 'ca-6',
    prompt: 'Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?',
    type: 'intellectual-passion',
    keywords: ['passion', 'curiosity', 'deep interest', 'learning', 'engagement']
  },
  {
    id: 'ca-7',
    prompt: 'Share an essay on any topic of your choice. It can be one you\'ve already written, one that responds to a different prompt, or one of your own design.',
    type: 'open-topic',
    keywords: ['creative', 'unique perspective', 'personal choice']
  }
] as const

// School-specific supplemental essay prompts
export const SCHOOL_SUPPLEMENTS = {
  stanford: [
    {
      id: 'stanford-1',
      prompt: 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.',
      wordLimit: 250,
      type: 'intellectual-vitality',
      schoolValues: ['intellectualCuriosity', 'innovation'],
      strategicFocus: 'Show genuine intellectual excitement - specific moment or idea that sparked your curiosity'
    },
    {
      id: 'stanford-2',
      prompt: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.',
      wordLimit: 250,
      type: 'personal-voice',
      schoolValues: ['authenticity', 'community'],
      strategicFocus: 'Be authentic and personable - quirks, values, daily habits. Avoid trying too hard to impress.'
    },
    {
      id: 'stanford-3',
      prompt: 'Tell us about something that is meaningful to you and why.',
      wordLimit: 250,
      type: 'values-identity',
      schoolValues: ['reflection', 'depth'],
      strategicFocus: 'Choose something genuinely meaningful, not what you think they want to hear. Go deep, not broad.'
    }
  ],
  
  harvard: [
    {
      id: 'harvard-1',
      prompt: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard?',
      wordLimit: 200,
      type: 'diversity-contribution',
      schoolValues: ['diversity', 'community', 'leadership'],
      strategicFocus: 'Connect your unique experiences to specific contributions you\'ll make to Harvard community'
    },
    {
      id: 'harvard-2',
      prompt: 'Describe a time when you made a meaningful contribution to others in which the greater good was your focus. Discuss the challenges and rewards of making your contribution.',
      wordLimit: 200,
      type: 'service-impact',
      schoolValues: ['socialImpact', 'leadership', 'empathy'],
      strategicFocus: 'Specific story with measurable impact. Show both challenges faced and growth achieved.'
    },
    {
      id: 'harvard-3',
      prompt: 'What do you hope to achieve at Harvard, both academically and personally?',
      wordLimit: 200,
      type: 'goals-fit',
      schoolValues: ['ambition', 'intellectualCuriosity'],
      strategicFocus: 'Be specific about Harvard resources. Connect to your narrative and past experiences.'
    }
  ],

  mit: [
    {
      id: 'mit-1',
      prompt: 'Describe the world you come from (for example, your family, school, community, city, or town). How has that world shaped your dreams and aspirations?',
      wordLimit: 250,
      type: 'background-context',
      schoolValues: ['context', 'growth', 'aspiration'],
      strategicFocus: 'Show how your environment shaped your thinking, not just what you did'
    },
    {
      id: 'mit-2',
      prompt: 'MIT brings people with diverse backgrounds together to collaborate, from tackling the world\'s biggest challenges to lending a helping hand. Describe one way you have collaborated with others to learn from them, with them, or contribute to your community together.',
      wordLimit: 250,
      type: 'collaboration-community',
      schoolValues: ['collaboration', 'community', 'problemSolving'],
      strategicFocus: 'Emphasize collaboration over solo achievement. Show how you work with others.'
    },
    {
      id: 'mit-3',
      prompt: 'Tell us about a significant challenge you\'ve faced (that you feel comfortable sharing) or something that didn\'t go according to plan. How did you manage the situation?',
      wordLimit: 250,
      type: 'resilience-problemSolving',
      schoolValues: ['resilience', 'problemSolving', 'growth'],
      strategicFocus: 'Focus on your problem-solving process and what you learned, not the problem itself'
    }
  ],

  yale: [
    {
      id: 'yale-1',
      prompt: 'What is it about Yale that has led you to apply?',
      wordLimit: 125,
      type: 'why-school',
      schoolValues: ['fit', 'research', 'specificity'],
      strategicFocus: 'Be highly specific - professors, programs, residential colleges, extracurriculars'
    },
    {
      id: 'yale-2',
      prompt: 'What inspires you?',
      wordLimit: 250,
      type: 'inspiration-motivation',
      schoolValues: ['intellectualCuriosity', 'passion'],
      strategicFocus: 'Show genuine intellectual or creative inspiration, not cliché answers'
    },
    {
      id: 'yale-3',
      prompt: 'Yale\'s residential colleges regularly host conversations with guests representing a wide range of experiences and accomplishments. What person, past or present, would you invite to speak? What would you ask them to discuss?',
      wordLimit: 250,
      type: 'intellectual-engagement',
      schoolValues: ['intellectualCuriosity', 'community'],
      strategicFocus: 'Choose someone connected to your narrative. Ask thoughtful, specific questions.'
    }
  ],

  princeton: [
    {
      id: 'princeton-1',
      prompt: 'Princeton values community and encourages students, faculty, staff and leadership to engage in respectful conversations that can expand their perspectives and challenge their ideas and beliefs. As a prospective member of this community, reflect on how your lived experiences will impact the conversations you will have in the classroom, the dining hall, or other campus spaces.',
      wordLimit: 300,
      type: 'community-perspective',
      schoolValues: ['diversity', 'community', 'intellectualDiscourse'],
      strategicFocus: 'Connect your unique perspective to how you\'ll contribute to Princeton\'s intellectual community'
    },
    {
      id: 'princeton-2',
      prompt: 'Princeton has a longstanding commitment to understanding our responsibility to society through service and civic engagement. How does your own story intersect with these ideals?',
      wordLimit: 300,
      type: 'service-responsibility',
      schoolValues: ['service', 'socialImpact', 'civicEngagement'],
      strategicFocus: 'Show genuine commitment to service, not resume padding. Connect to your core values.'
    }
  ],

  columbia: [
    {
      id: 'columbia-1',
      prompt: 'Why are you interested in attending Columbia University? We encourage you to consider the aspect(s) that you find unique and compelling about Columbia.',
      wordLimit: 300,
      type: 'why-school',
      schoolValues: ['fit', 'intellectualCuriosity', 'urbanEngagement'],
      strategicFocus: 'Go beyond Core Curriculum. Mention specific courses, professors, NYC opportunities.'
    },
    {
      id: 'columbia-2',
      prompt: 'List the titles of the books, essays, poetry, short stories or plays you read outside of academic courses that you enjoyed most during secondary school.',
      wordLimit: 150,
      type: 'intellectual-life',
      schoolValues: ['intellectualCuriosity', 'reading'],
      strategicFocus: 'Be honest about what you actually read. Diversity of thought matters more than prestige.'
    },
    {
      id: 'columbia-3',
      prompt: "We're interested in learning about some of the ways that you explore your interests. List some resources and outlets that you enjoy.",
      wordLimit: 150,
      type: 'curiosity-exploration',
      schoolValues: ['intellectualCuriosity', 'initiative'],
      strategicFocus: 'Shows how you actually learn - podcasts, YouTube, museums, online courses, etc.'
    }
  ],

  penn: [
    {
      id: 'penn-1',
      prompt: 'Write a short thank-you note to someone you have not yet thanked and would like to acknowledge.',
      wordLimit: 150,
      type: 'gratitude-relationships',
      schoolValues: ['gratitude', 'community', 'empathy'],
      strategicFocus: 'Be genuine and specific. Show maturity through gratitude for often-overlooked people.'
    },
    {
      id: 'penn-2',
      prompt: 'How will you explore community at Penn? Consider how Penn will help shape your perspective, and how your experiences and perspective will help shape Penn.',
      wordLimit: 300,
      type: 'community-fit',
      schoolValues: ['community', 'collaboration', 'practicalImpact'],
      strategicFocus: 'Be specific about Penn communities. Show two-way relationship - what you give AND get.'
    }
  ],

  brown: [
    {
      id: 'brown-1',
      prompt: 'Brown\'s Open Curriculum allows students to explore broadly while also diving deeply into their academic pursuits. Tell us about any academic interests that excite you, and how you might pursue them at Brown.',
      wordLimit: 250,
      type: 'academic-exploration',
      schoolValues: ['intellectualIndependence', 'curiosity', 'interdisciplinary'],
      strategicFocus: 'Show how you\'d use the Open Curriculum. Mention specific courses, concentrations, cross-registration.'
    },
    {
      id: 'brown-2',
      prompt: 'Students at Brown have a multitude of opportunities to explore their interests. Tell us about an interest or experience that has been particularly meaningful to you.',
      wordLimit: 250,
      type: 'meaningful-interest',
      schoolValues: ['passion', 'depth', 'authenticity'],
      strategicFocus: 'Go deep on one interest. Show genuine passion and what you\'ve learned from pursuing it.'
    }
  ]
} as const

// Essay strategy: map narrative themes to best Common App prompts
export const NARRATIVE_TO_PROMPT_MAPPING = {
  'Overcoming adversity': ['ca-2', 'ca-5'], // Challenge/growth prompts
  'Intellectual passion': ['ca-6', 'ca-3'], // Passion and intellectual engagement
  'Leadership journey': ['ca-5', 'ca-1'], // Growth and identity
  'Cultural identity': ['ca-1', 'ca-4'], // Background and gratitude
  'Creative expression': ['ca-6', 'ca-7'], // Passion and open topic
  'Service/impact': ['ca-4', 'ca-5'], // Gratitude and accomplishment
  'Scientific curiosity': ['ca-6', 'ca-3'], // Passion and questioning
  'Entrepreneurship': ['ca-5', 'ca-2'], // Accomplishment and challenge
  'Social justice': ['ca-3', 'ca-4'] // Questioning beliefs and gratitude
} as const

export type SchoolName = keyof typeof SCHOOL_SUPPLEMENTS
export type PromptType = typeof COMMON_APP_PROMPTS[number]['type'] | typeof SCHOOL_SUPPLEMENTS[SchoolName][number]['type']
