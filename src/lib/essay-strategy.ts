/**
 * Multi-Essay Strategy Engine
 * Coordinates Common App + supplement essays to show different facets while maintaining narrative coherence
 */

import { Narrative, School } from '@/types'
import { COMMON_APP_PROMPTS, SCHOOL_SUPPLEMENTS, NARRATIVE_TO_PROMPT_MAPPING, SchoolName } from '@/constants/essay-prompts'

export interface EssayRecommendation {
  promptId: string
  prompt: string
  wordLimit: number
  type: string
  strategicAngle: string
  narrativeConnection: string
  whatToEmphasize: string[]
  whatToAvoid: string[]
  exampleHook?: string
}

export interface MultiEssayStrategy {
  commonApp: EssayRecommendation
  supplements: EssayRecommendation[]
  overallStrategy: string
  diversificationPlan: string
  coherenceNotes: string[]
}

export interface SupplementPrompt {
  id: string
  prompt: string
  wordLimit: number
  type: string
  schoolValues?: readonly string[]
  strategicFocus?: string
}

/**
 * Generate comprehensive essay strategy for a specific school
 */
export function generateSchoolEssayStrategy(
  narrative: Narrative,
  school: School,
  supplementsOverride?: SupplementPrompt[] | null
): MultiEssayStrategy | null {
  // Extract school name (e.g., "Stanford" from "Stanford University")
  const schoolNameBase = school.name.split(' ')[0].toLowerCase() as SchoolName
  
  // Get school supplements
  const supplements = supplementsOverride ?? SCHOOL_SUPPLEMENTS[schoolNameBase]
  if (!supplements || supplements.length === 0) {
    return null
  }

  // Select best Common App prompt for this narrative
  const commonAppRec = selectCommonAppPrompt(narrative)
  
  // Generate supplement recommendations
  const supplementRecs = supplements.map(supp => 
    generateSupplementRecommendation(supp, narrative, school)
  )

  // Create overall strategy
  const overallStrategy = createOverallStrategy(narrative, school, commonAppRec, supplementRecs)
  
  // Create diversification plan
  const diversificationPlan = createDiversificationPlan(commonAppRec, supplementRecs)
  
  // Coherence notes
  const coherenceNotes = createCoherenceNotes(narrative, commonAppRec, supplementRecs)

  return {
    commonApp: commonAppRec,
    supplements: supplementRecs,
    overallStrategy,
    diversificationPlan,
    coherenceNotes
  }
}

/**
 * Select best Common App prompt based on narrative theme
 */
export function selectCommonAppPrompt(narrative: Narrative): EssayRecommendation {
  // Extract narrative theme keywords
  const themeKeywords = narrative.theme.toLowerCase()
  
  // Find matching prompt based on narrative theme
  let selectedPrompt: typeof COMMON_APP_PROMPTS[number] = COMMON_APP_PROMPTS[5] // Default to passion prompt
  let bestMatch = 0
  
  for (const [theme, promptIds] of Object.entries(NARRATIVE_TO_PROMPT_MAPPING)) {
    if (themeKeywords.includes(theme.toLowerCase())) {
      const promptId = promptIds[0]
      const found = COMMON_APP_PROMPTS.find(p => p.id === promptId)
      if (found) selectedPrompt = found
      break
    }
  }
  
  // Check narrative text for keyword matches
  const narrativeText = `${narrative.title} ${narrative.theme}`.toLowerCase()
  for (const prompt of COMMON_APP_PROMPTS) {
    const matchCount = prompt.keywords.filter(kw => narrativeText.includes(kw.toLowerCase())).length
    if (matchCount > bestMatch) {
      bestMatch = matchCount
      selectedPrompt = prompt
    }
  }

  return {
    promptId: selectedPrompt.id,
    prompt: selectedPrompt.prompt,
    wordLimit: 650,
    type: selectedPrompt.type,
    strategicAngle: getCommonAppStrategicAngle(selectedPrompt.type, narrative),
    narrativeConnection: `This prompt allows you to showcase "${narrative.title}" through the lens of ${selectedPrompt.type.replace(/-/g, ' ')}.`,
    whatToEmphasize: getCommonAppEmphasis(selectedPrompt.type, narrative),
    whatToAvoid: getCommonAppAvoidances(selectedPrompt.type),
    exampleHook: generateExampleHook(selectedPrompt.type, narrative)
  }
}

/**
 * Generate recommendation for school-specific supplement
 */
function generateSupplementRecommendation(
  supplement: SupplementPrompt,
  narrative: Narrative,
  school: School
): EssayRecommendation {
  return {
    promptId: supplement.id,
    prompt: supplement.prompt,
    wordLimit: supplement.wordLimit,
    type: supplement.type,
    strategicAngle: supplement.strategicFocus || getSupplementStrategicFocus(supplement.type, narrative),
    narrativeConnection: connectSupplementToNarrative(supplement, narrative, school),
    whatToEmphasize: getSupplementEmphasis(supplement.type, narrative, school),
    whatToAvoid: getSupplementAvoidances(supplement.type),
    exampleHook: generateSupplementHook(supplement, narrative, school)
  }
}

/**
 * Create overall essay strategy across all essays
 */
function createOverallStrategy(
  narrative: Narrative,
  school: School,
  commonApp: EssayRecommendation,
  supplements: EssayRecommendation[]
): string {
  const schoolValues = getSchoolCoreValues(school.name)
  
  return `Your essay portfolio for ${school.name} should tell a cohesive story while showing different dimensions of "${narrative.title}". 

**Common App (${commonApp.type})**: Establish your core narrative - ${commonApp.strategicAngle}

**Supplements**: Each supplement reveals a different facet:
${supplements.map((s, i) => `  ${i + 1}. ${s.type.replace(/-/g, ' ')}: ${s.strategicAngle}`).join('\n')}

**School Alignment**: ${school.name} values ${schoolValues.join(', ')}. Weave these values throughout your essays while staying authentic to your story.`
}

/**
 * Create diversification plan to avoid repetition
 */
function createDiversificationPlan(
  commonApp: EssayRecommendation,
  supplements: EssayRecommendation[]
): string {
  const aspects = [
    'Common App: Tell your origin story - how you developed this interest/passion',
    ...supplements.map((s, i) => {
      if (s.type.includes('why-school')) return `Supplement ${i + 1}: School fit - specific programs and how you\'ll contribute`
      if (s.type.includes('community')) return `Supplement ${i + 1}: Community impact - your role in collaborative environments`
      if (s.type.includes('intellectual')) return `Supplement ${i + 1}: Intellectual curiosity - what excites you academically`
      if (s.type.includes('challenge')) return `Supplement ${i + 1}: Problem-solving approach - how you tackle obstacles`
      return `Supplement ${i + 1}: ${s.type.replace(/-/g, ' ')} perspective`
    })
  ]

  return `**To avoid repetition across essays:**\n\n${aspects.join('\n')}\n\nEach essay should introduce NEW details, stories, or perspectives while maintaining your central narrative thread.`
}

/**
 * Create coherence notes to tie essays together
 */
function createCoherenceNotes(
  narrative: Narrative,
  commonApp: EssayRecommendation,
  supplements: EssayRecommendation[]
): string[] {
  return [
    `Your central theme "${narrative.title}" should echo across all essays but manifest differently in each`,
    `Use consistent voice and values, but vary the stories and examples you share`,
    `Reference past experiences in Common App, present activities in supplements, future goals in "why school" essays`,
    `Ensure each essay passes the "learn something new" test - reader should discover something they didn\'t know from previous essays`,
    `Maintain emotional throughline: the "why this matters to you" should be consistent even as specific examples vary`
  ]
}

/**
 * Get strategic angle for Common App prompt types
 */
function getCommonAppStrategicAngle(type: string, narrative: Narrative): string {
  const angles: Record<string, string> = {
    'identity-background': `Use a specific moment or experience that shaped your identity. Connect to ${narrative.title} as the outcome of this background.`,
    'challenge-growth': `Choose a genuine challenge where you showed resilience. The "after" should lead directly to ${narrative.title}.`,
    'intellectual-engagement': `Describe when you questioned something related to your field. Show intellectual maturity and curiosity driving ${narrative.title}.`,
    'gratitude-impact': `Thank someone who influenced your path. Show how their impact manifested in ${narrative.title}.`,
    'growth-realization': `Use a pivotal moment of self-discovery. The "new understanding" should be the foundation of ${narrative.title}.`,
    'intellectual-passion': `Describe being in flow state while pursuing your interest. Make the reader feel your excitement about ${narrative.title}.`,
    'open-topic': `Creative freedom - use narrative structure (vignettes, metaphor, unique format) to illuminate ${narrative.title}.`
  }
  return angles[type] || `Connect this prompt to your core narrative: ${narrative.title}`
}

/**
 * Get what to emphasize for Common App prompts
 */
function getCommonAppEmphasis(type: string, narrative: Narrative): string[] {
  const emphasis: Record<string, string[]> = {
    'identity-background': ['Specific cultural/community context', 'How it shaped your values', 'Connection to your current pursuits'],
    'challenge-growth': ['The struggle (be vulnerable)', 'Your thought process', 'Concrete changes in perspective or behavior'],
    'intellectual-engagement': ['What triggered your questioning', 'Research or action you took', 'How it changed your thinking'],
    'gratitude-impact': ['Specific actions the person took', 'Your emotional response', 'How you\'ve paid it forward'],
    'growth-realization': ['The "before" version of you', 'The pivotal moment/event', 'Tangible evidence of growth'],
    'intellectual-passion': ['Sensory details of being engaged', 'Specific examples of pursuing it', 'Why it matters beyond personal interest'],
    'open-topic': ['Unique voice and perspective', 'Creative structure or approach', 'Depth over breadth']
  }
  return emphasis[type] || ['Be specific', 'Show vulnerability', 'Connect to your narrative']
}

/**
 * Get what to avoid for Common App prompts
 */
function getCommonAppAvoidances(type: string): string[] {
  const avoidances: Record<string, string[]> = {
    'identity-background': ['Writing about your race/ethnicity UNLESS it\'s genuinely central to your story', 'Generic immigrant narrative without specific details', 'Victim mentality without showing agency'],
    'challenge-growth': ['Choosing a trivial challenge', 'Blaming others', 'Ending without showing what you learned'],
    'intellectual-engagement': ['Describing the idea more than your engagement with it', 'Being preachy or self-righteous', 'Staying in abstract realm'],
    'gratitude-impact': ['Writing about famous person you never met', 'Generic parent appreciation', 'Forgetting to show YOUR growth'],
    'growth-realization': ['Cliché realizations ("everyone is different")', 'Growth that feels manufactured', 'Claiming too much transformation'],
    'intellectual-passion': ['Listing facts about the subject', 'Generic "I love learning"', 'Not showing what YOU specifically do'],
    'open-topic': ['Being too experimental without purpose', 'Forgetting to reveal yourself', 'Choosing topic that doesn\'t illuminate you']
  }
  return avoidances[type] || ['Being generic', 'Resume repetition', 'Not showing personality']
}

/**
 * Generate example hook for Common App prompt
 */
function generateExampleHook(type: string, narrative: Narrative): string {
  const hooks: Record<string, string> = {
    'identity-background': `Example: Start with a specific cultural object, ritual, or moment that captures your background in miniature`,
    'challenge-growth': `Example: Begin at the moment of failure/setback - use present tense to make it immediate`,
    'intellectual-engagement': `Example: Open with the question that sparked your curiosity, then describe your journey to answer it`,
    'gratitude-impact': `Example: Start with a specific scene showing the person's impact, then zoom out to explain why it mattered`,
    'growth-realization': `Example: Use "before/after" structure - vivid scene from before, then the turning point`,
    'intellectual-passion': `Example: Drop reader into a moment when you're deeply engaged - show the passion through details`,
    'open-topic': `Example: Use creative structure - vignettes, metaphor, unconventional format that fits your story`
  }
  return hooks[type] || `Start with a specific, vivid scene that captures "${narrative.title}" in action`
}

/**
 * Connect supplement prompt to narrative
 */
function connectSupplementToNarrative(
  supplement: SupplementPrompt,
  narrative: Narrative,
  school: School
): string {
  if (supplement.type.includes('why-school')) {
    return `Connect ${school.name}'s specific resources to how you'll continue developing "${narrative.title}". Be concrete about courses, labs, professors, student groups.`
  }
  if (supplement.type.includes('community')) {
    return `Show how "${narrative.title}" manifests in how you collaborate and contribute to communities. Use specific past examples.`
  }
  if (supplement.type.includes('intellectual')) {
    return `Reveal the intellectual curiosity behind "${narrative.title}". What questions drive you? What do you read/watch/explore?`
  }
  if (supplement.type.includes('challenge') || supplement.type.includes('resilience')) {
    return `Describe an obstacle in developing "${narrative.title}". Focus on your problem-solving process.`
  }
  return `Use this supplement to show a dimension of "${narrative.title}" not covered in your Common App essay.`
}

/**
 * Get what to emphasize for supplements
 */
function getSupplementEmphasis(type: string, narrative: Narrative, school: School): string[] {
  // Map specific supplement types to emphasis points
  const emphasize: Record<string, string[]> = {
    'intellectual-vitality': [
      'Specific moment or idea that genuinely excites you',
      'How you pursue learning beyond the classroom',
      'Connection to potential academic interests'
    ],
    'personal-voice': [
      'Authenticity and personality',
      'Quirks or values that define you',
      'Specific habits or interests that reveal who you are'
    ],
    'values-identity': [
      'What genuinely matters to you (not what sounds impressive)',
      'Why it\'s meaningful - the depth of your reflection',
      'How it shapes your decisions and actions'
    ],
    'diversity-contribution': [
      'Specific experiences that make you unique',
      `Concrete contributions you\'ll make to ${school.name}`,
      'How your background brings new perspectives'
    ],
    'service-impact': [
      'Specific story with measurable outcomes',
      'Challenges you faced and how you overcame them',
      'What you learned and how you grew'
    ],
    'goals-fit': [
      `Specific academic programs or research at ${school.name}`,
      'How they align with your long-term goals',
      'Personal and professional aspirations'
    ],
    'background-context': [
      'How your environment shaped your thinking and values',
      'Specific experiences from your background',
      'Connection between past and current aspirations'
    ],
    'collaboration-community': [
      'Specific example of working with others',
      'Your role and contribution to the group',
      'What you learned from the collaboration'
    ],
    'resilience-problemSolving': [
      'Your problem-solving process and approach',
      'How you handled the challenge',
      'Growth and lessons learned'
    ],
    'why-school': [
      `Specific programs, professors, or opportunities at ${school.name}`,
      'How they align with your goals and narrative',
      'Your unique contributions to their community'
    ],
    'inspiration-motivation': [
      'What genuinely inspires you (not what sounds impressive)',
      'How it connects to your passions and goals',
      'Your personal reaction and what you learned from it'
    ],
    'intellectual-engagement': [
      'Person/topic connected to your interests',
      'Thoughtful, specific questions you\'d ask',
      'Why this person matters to your growth'
    ],
    'community-perspective': [
      'Your unique lived experiences and perspective',
      'How you\'ll contribute to intellectual discourse',
      'Specific topics you\'re interested in discussing'
    ],
    'service-responsibility': [
      'Genuine commitment to service (not resume-padding)',
      'Specific impact you\'ve had',
      'How it connects to your core values'
    ],
    'intellectual-life': [
      'Books/media you actually enjoyed reading',
      'Why these works resonated with you',
      'How they shaped your thinking'
    ],
    'curiosity-exploration': [
      'Authentic outlets for your learning',
      'How you independently pursue knowledge',
      'Specific resources and why they matter to you'
    ],
    'gratitude-relationships': [
      'Genuine appreciation for a specific person',
      'Why this person deserves recognition',
      'What they taught you or how they supported you'
    ],
    'community-fit': [
      `Specific communities at ${school.name} that appeal to you`,
      'How you\'ll both give and receive from these communities',
      'Your unique perspective and contributions'
    ],
    'academic-exploration': [
      `Specific courses, departments, or programs at ${school.name}`,
      'How you\'d use the Open Curriculum',
      'Your intellectual curiosity and direction'
    ],
    'meaningful-interest': [
      'One deep interest or experience',
      'Your passion and what you\'ve learned',
      'How this shapes who you are'
    ],
    'personal': [
      'Genuine personality and quirks',
      'Real stories that reveal character',
      'Authenticity over perfection'
    ],
    'innovation': [
      'Your creative process',
      'What you built or invented',
      'What you learned from making'
    ],
    'why-major': [
      'Specific experiences that sparked interest',
      'How you\'ve explored the field',
      `Why ${school.name} is the right place`
    ],
    'challenge': [
      'The obstacle and your response',
      'Problem-solving approach',
      'Growth and lessons learned'
    ],
    'background': [
      'How your environment shaped you',
      'Values developed from context',
      'Connection to your aspirations'
    ],
    'activities': [
      'Depth over breadth',
      'Impact and leadership',
      'What this activity taught you'
    ],
    'creative': [
      'Your unique perspective',
      'Intellectual risk-taking',
      'Creative thinking process'
    ],
    'creativity': [
      'Your unique perspective',
      'Intellectual risk-taking',
      'Creative thinking process'
    ],
    'academic-interest': [
      'Genuine curiosity about the field',
      'Specific academic experiences',
      `How you\'ll pursue it at ${school.name}`
    ],
    'academic-preparation': [
      'Depth of subject knowledge',
      'How you\'ve challenged yourself',
      'Readiness for advanced work'
    ],
    'goals': [
      'Clear vision for the future',
      `Specific ${school.name} resources`,
      'Realistic pathway to goals'
    ],
    'gratitude': [
      'Specific person and actions',
      'Why they deserve thanks',
      'How they impacted you'
    ],
    'values': [
      'One core value with examples',
      'How you live this value',
      'Connection to your narrative'
    ],
    'service': [
      'Sustained commitment',
      'Concrete impact on others',
      'Connection to larger purpose'
    ],
    'diversity': [
      'Your unique perspective',
      'How you\'ve engaged with difference',
      'What you\'ll contribute to campus'
    ]
  }
  return emphasize[type] || ['Authenticity', 'Specific examples', 'Connection to school values']
}

function getSupplementStrategicFocus(type: string, narrative: Narrative): string {
  const focus: Record<string, string> = {
    'intellectual-vitality': 'Show genuine intellectual excitement tied to a specific question or experience.',
    'personal-voice': 'Be authentic and personable. Reveal values, quirks, and daily habits that feel real.',
    'values-identity': 'Choose something deeply meaningful and explain why it matters to you.',
    'diversity-contribution': 'Connect your lived experiences to the contribution you will make in community.',
    'service-impact': 'Highlight a concrete action and its ripple effects on others.',
    'goals-fit': 'Pair your goals with specific campus resources that make them realistic.',
    'background-context': 'Explain how your context shaped how you think and what you care about.',
    'collaboration-community': 'Focus on collaboration over solo achievement. Show what you learned with others.',
    'resilience-problemSolving': 'Emphasize your problem-solving process and growth, not just the obstacle.',
    'why-school': 'Be highly specific about programs, people, and opportunities you will engage with.',
    'inspiration-motivation': 'Show a genuine source of inspiration and how it changed your direction.',
    'intellectual-engagement': 'Highlight how you explore ideas beyond class and how that curiosity evolved.',
    'community-perspective': 'Share a perspective you will bring to conversations and how you will engage others.',
    'service-responsibility': 'Connect a personal story to a larger responsibility you have taken on.',
    'intellectual-life': 'Show what you read, watch, or explore and how it shapes your thinking.',
    'curiosity-exploration': 'Highlight the outlets you use to learn and why they matter to you.',
    'gratitude-relationships': 'Be specific, heartfelt, and show how gratitude changed your behavior.',
    'community-fit': 'Explain what you will contribute and how you will grow in the community.',
    'academic-exploration': 'Show what you would pursue and how you would take advantage of academic freedom.',
    'meaningful-interest': 'Go deep on one interest and show how it has shaped you over time.',
    'personal': 'Reveal your authentic personality, quirks, and values through specific stories.',
    'innovation': 'Show your creative process, what you made, and what you learned from inventing.',
    'why-major': 'Connect specific experiences to genuine passion for the field and school resources.',
    'challenge': 'Focus on your problem-solving approach and what you learned from the obstacle.',
    'background': 'Explain how your environment shaped your thinking, values, and aspirations.',
    'activities': 'Show depth, impact, and what this activity taught you about yourself.',
    'creative': 'Take intellectual risks and show your unique creative thinking process.',
    'creativity': 'Take intellectual risks and show your unique creative thinking process.',
    'academic-interest': 'Demonstrate genuine curiosity and how you\'ve explored the field deeply.',
    'academic-preparation': 'Show subject mastery and readiness for rigorous upper-division work.',
    'goals': 'Connect clear future vision to specific school resources and realistic pathways.',
    'gratitude': 'Be specific about who helped you, what they did, and how they changed you.',
    'values': 'Choose one core value, show how you live it, and connect to your narrative.',
    'service': 'Highlight sustained commitment, concrete impact, and larger purpose.',
    'diversity': 'Share your unique perspective and what you\'ll contribute to campus diversity.',
  }

  return focus[type] || `Connect this prompt to your core narrative: ${narrative.title}.`
}

/**
 * Get what to avoid for supplements
 */
function getSupplementAvoidances(type: string): string[] {
  const avoidances: Record<string, string[]> = {
    'intellectual-vitality': [
      'Generic "I love learning" without specifics',
      'Listing multiple interests without depth',
      'Boring description of an obvious thing'
    ],
    'personal-voice': [
      'Trying too hard to impress',
      'Being inauthentic or overly formal',
      'Revealing inappropriate personal details'
    ],
    'values-identity': [
      'Choosing something superficial',
      'Repeating something from Common App',
      'Explaining obvious values without reflection'
    ],
    'diversity-contribution': [
      'Generic diversity statements',
      'Making it all about disadvantages without agency',
      'Claiming contributions you haven\'t made'
    ],
    'service-impact': [
      'Vague descriptions without concrete examples',
      'Only talking about your feelings, not impact',
      'Ignoring the challenges or difficulties'
    ],
    'goals-fit': [
      'Saying you want to attend but not why',
      'Information from admissions website',
      'Generic goals without school specifics'
    ],
    'background-context': [
      'Listing facts without reflection',
      'Feeling sorry for yourself',
      'Not connecting past to your aspirations'
    ],
    'collaboration-community': [
      'Only talking about solo achievements',
      'Generic "teamwork is important"',
      'Not showing what you personally contributed'
    ],
    'resilience-problemSolving': [
      'Trivial or fabricated challenges',
      'Blaming others for the problem',
      'Not showing what you actually learned'
    ],
    'why-school': [
      'Generic praise ("great reputation")',
      'Information easily found on their website',
      'Only mentioning prestige or rankings'
    ],
    'inspiration-motivation': [
      'Cliché inspiration (e.g., celebrity gossip)',
      'Someone you admire but don\'t know well',
      'Vague descriptions of what inspires you'
    ],
    'intellectual-engagement': [
      'Choosing someone unrelated to your interests',
      'Questions that could be asked at any school',
      'Not showing why this person matters to you'
    ],
    'community-perspective': [
      'Vague identity statements',
      'Not clearly stating your perspective',
      'Generic "I\'ll bring diversity" claims'
    ],
    'service-responsibility': [
      'One-time volunteer experience as proof',
      'Self-righteous tone',
      'Not connecting to your core values'
    ],
    'intellectual-life': [
      'Listing prestige books you didn\'t actually enjoy',
      'Books required for school',
      'Not explaining why they mattered to you'
    ],
    'curiosity-exploration': [
      'Listing too many interests superficially',
      'Things you do because you think schools want it',
      'Forgetting to show genuine curiosity'
    ],
    'gratitude-relationships': [
      'Generic thank you (parents, teachers)',
      'Being overly sentimental',
      'Not being specific about what they did'
    ],
    'community-fit': [
      'Generic description of being a good community member',
      'Only focusing on what you\'ll get',
      'Not being specific to Penn communities'
    ],
    'academic-exploration': [
      'Generic interest without specifics',
      'Not mentioning Brown\'s unique opportunities',
      'Contradicting your stated interests'
    ],
    'meaningful-interest': [
      'Choosing something superficial',
      'Not showing genuine passion or depth',
      'Not connecting to your narrative'
    ],
    'personal': [
      'Being too formal or inauthentic',
      'Sharing inappropriate details',
      'Not revealing personality or values'
    ],
    'innovation': [
      'Just describing not creating',
      'Exaggerating the innovation',
      'Not showing your process or learning'
    ],
    'why-major': [
      'Generic interest in the field',
      'Not connecting to specific experiences',
      'Mentioning prestige over passion'
    ],
    'challenge': [
      'Trivial or fabricated obstacles',
      'Blaming others without reflection',
      'Not showing what you learned'
    ],
    'background': [
      'Listing facts without meaning',
      'Being a victim without agency',
      'Not connecting to your dreams'
    ],
    'activities': [
      'Just listing what you did',
      'Not showing impact or growth',
      'Repeating your activities list'
    ],
    'creative': [
      'Playing it too safe',
      'Not showing your thinking process',
      'Missing the intellectual angle'
    ],
    'creativity': [
      'Playing it too safe',
      'Not showing your thinking process',
      'Missing the intellectual angle'
    ],
    'academic-interest': [
      'Generic subject enthusiasm',
      'Not connecting to experiences',
      'Vague future plans'
    ],
    'academic-preparation': [
      'Just listing courses taken',
      'Not showing depth of understanding',
      'Exaggerating your expertise'
    ],
    'goals': [
      'Vague career aspirations',
      'Not connecting to school resources',
      'Unrealistic or generic goals'
    ],
    'gratitude': [
      'Generic thank you (teacher, parent)',
      'Being overly sentimental',
      'Not being specific about impact'
    ],
    'values': [
      'Abstract values without examples',
      'Common values everyone claims',
      'Not showing how you live them'
    ],
    'service': [
      'One-time volunteer hour padding',
      'Savior complex tone',
      'Not showing sustained commitment'
    ],
    'diversity': [
      'Generic diversity statements',
      'Victim narrative without agency',
      'Not showing what you\'ll contribute'
    ]
  }
  return avoidances[type] || ['Being generic', 'Repeating Common App content', 'Not being specific to this school']
}

/**
 * Generate example hook for supplement
 */
function generateSupplementHook(
  supplement: SupplementPrompt,
  narrative: Narrative,
  school: School
): string {
  if (supplement.type.includes('why-school')) {
    return `Example: Start with a specific moment when you discovered ${school.name} had exactly what you needed, or describe your ideal day on campus`
  }
  if (supplement.type.includes('roommate')) {
    return `Example: Use conversational tone - "Hi! You should know that I..." Be authentic and specific about quirks/values`
  }
  if (supplement.type.includes('community')) {
    return `Example: Open with a specific collaborative moment that captures how you work with others`
  }
  return `Example: Start with vivid details that immediately show your personality and perspective`
}

/**
 * Get core values for each school
 */
function getSchoolCoreValues(schoolName: string): string[] {
  const values: Record<string, string[]> = {
    'Stanford': ['innovation', 'impact', 'interdisciplinary thinking', 'entrepreneurship'],
    'Harvard': ['leadership', 'intellectual breadth', 'civic engagement', 'excellence'],
    'MIT': ['problem-solving', 'collaboration', 'hands-on learning', 'innovation'],
    'Yale': ['intellectual curiosity', 'community', 'residential college life', 'service'],
    'Princeton': ['academic depth', 'service', 'undergraduate focus', 'honor code'],
    'Columbia': ['urban engagement', 'Core Curriculum', 'intellectual discourse', 'global perspective'],
    'Penn': ['interdisciplinary learning', 'practical impact', 'collaboration', 'One University'],
    'Brown': ['intellectual independence', 'Open Curriculum', 'student agency', 'creative thinking']
  }
  return values[schoolName] || ['academic excellence', 'community', 'innovation']
}
