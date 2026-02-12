import { StudentProfile, School, SchoolFit, Narrative } from '@/types'

/**
 * Dynamically compute school tier based on student profile and school selectivity
 */
export function computeTier(
  profile: StudentProfile,
  school: School,
  fit?: SchoolFit
): 'Reach' | 'Target' | 'Safety' {
  const { academicProfile } = profile
  const { admissionRate, satRange, actRange } = school

  // Rule 1: Schools with <10% admission rate are always Reach (ultra-competitive)
  if (admissionRate < 10) {
    return 'Reach'
  }

  // Rule 2: Calculate academic match score (0-100)
  let academicScore = 50 // Default middle score if no test score provided
  const sat = academicProfile.testScores.sat
  const act = academicProfile.testScores.act
  
  if (sat) {
    // SAT scoring
    const [low, high] = satRange
    const mid = (low + high) / 2
    
    if (sat >= high) {
      academicScore = 100 // Above school's range
    } else if (sat >= mid) {
      academicScore = 70 + ((sat - mid) / (high - mid)) * 30 // 70-100
    } else if (sat >= low) {
      academicScore = 40 + ((sat - low) / (mid - low)) * 30 // 40-70
    } else {
      academicScore = Math.max(0, 40 * (sat / low)) // 0-40
    }
  } else if (act) {
    // ACT scoring (convert to SAT equivalent for consistency)
    const [low, high] = actRange
    const mid = (low + high) / 2
    
    if (act >= high) {
      academicScore = 100
    } else if (act >= mid) {
      academicScore = 70 + ((act - mid) / (high - mid)) * 30
    } else if (act >= low) {
      academicScore = 40 + ((act - low) / (mid - low)) * 30
    } else {
      academicScore = Math.max(0, 40 * (act / low))
    }
  }

  // Rule 3: Apply fit boost (±10 points)
  if (fit) {
    if (fit.overallFitScore >= 80) {
      academicScore = Math.min(100, academicScore + 10)
    } else if (fit.overallFitScore <= 50) {
      academicScore = Math.max(0, academicScore - 10)
    }
  }

  // Rule 4: Convert to tier based on admission rate and academic score
  if (admissionRate < 20) {
    // Highly selective (10-20%)
    if (academicScore >= 75) return 'Target'
    return 'Reach'
  } else if (admissionRate < 40) {
    // Selective (20-40%)
    if (academicScore >= 85) return 'Safety'
    if (academicScore >= 60) return 'Target'
    return 'Reach'
  } else {
    // Less selective (40%+)
    if (academicScore >= 70) return 'Safety'
    if (academicScore >= 45) return 'Target'
    return 'Reach'
  }
}

/**
 * Rationale for computed tier
 */
export function getTierRationale(
  profile: StudentProfile,
  school: School,
  tier: 'Reach' | 'Target' | 'Safety' | 'N/A',
  fit?: SchoolFit
): string {
  const { academicProfile } = profile
  const { admissionRate, satRange, actRange } = school
  const testScore = academicProfile.testScores.sat || academicProfile.testScores.act

  const reasons: string[] = []

  // N/A tier - insufficient data
  if (tier === 'N/A') {
    return 'Admission rate data not available. Unable to categorize this school automatically.'
  }

  // Admission rate factor
  if (admissionRate < 10) {
    reasons.push(`${admissionRate.toFixed(1)}% admission rate (ultra-competitive)`)
  } else if (admissionRate < 20) {
    reasons.push(`${admissionRate.toFixed(1)}% admission rate (highly selective)`)
  } else if (admissionRate < 40) {
    reasons.push(`${admissionRate.toFixed(1)}% admission rate (selective)`)
  }

  // Test score factor
  if (testScore) {
    const scoreType = academicProfile.testScores.sat ? 'SAT' : 'ACT'
    const range = academicProfile.testScores.sat ? satRange : actRange
    const [low, high] = range
    const mid = (low + high) / 2

    if (testScore >= high) {
      reasons.push(`${scoreType} ${testScore} above school's ${high} (top of range)`)
    } else if (testScore >= mid) {
      reasons.push(`${scoreType} ${testScore} vs school's ${mid}-${high} (strong match)`)
    } else if (testScore >= low) {
      reasons.push(`${scoreType} ${testScore} vs school's ${low}-${high} (within range)`)
    } else {
      reasons.push(`${scoreType} ${testScore} below school's ${low} (below range)`)
    }
  }

  // Fit factor
  if (fit) {
    if (fit.overallFitScore >= 80) {
      reasons.push(`${fit.overallFitScore}% narrative fit boosts chances`)
    } else if (fit.overallFitScore <= 50) {
      reasons.push(`${fit.overallFitScore}% narrative fit may lower odds`)
    }
  }

  return reasons.join(' • ')
}

/**
 * Essay idea with hardness and effectiveness metrics
 */
export interface EssayIdea {
  title: string
  concept: string
  whyItStandsOut: string
  hardness: 1 | 2 | 3 | 4 | 5 // 1=easy, 5=very hard
  effectiveness: 1 | 2 | 3 | 4 | 5 // 1=low impact, 5=high impact
  starterSteps: string[]
}

/**
 * Generate bold, specific essay ideas with metrics
 */
export function getEssayIdeas(
  narrative: Narrative,
  school?: School
): EssayIdea[] {
  const ideas: EssayIdea[] = []

  // Idea 1: Tech for good / community impact
  if (narrative.theme.toLowerCase().includes('stem') || narrative.theme.toLowerCase().includes('tech') || narrative.theme.toLowerCase().includes('community')) {
    ideas.push({
      title: 'Neighborhood AI Clinic Nights',
      concept: 'Host monthly "AI office hours" at your local library or community center where you help seniors, small business owners, and non-profits use ChatGPT, Gemini, or other AI tools for real tasks (résumé writing, business plans, grant applications).',
      whyItStandsOut: 'Bridges cutting-edge tech with grassroots impact. Shows you\'re not just building apps—you\'re democratizing access to AI in underserved communities.',
      hardness: 2,
      effectiveness: 5,
      starterSteps: [
        'Partner with 1-2 local libraries or community centers',
        'Create a simple sign-up form + 3-page "AI Quick Start" guide',
        'Run first session with 5-10 attendees, document stories + photos'
      ]
    })
  }

  // Idea 2: Open-source / entrepreneurial angle
  if (narrative.theme.toLowerCase().includes('leadership') || narrative.theme.toLowerCase().includes('innovation') || narrative.theme.toLowerCase().includes('stem')) {
    ideas.push({
      title: 'Open-Source Micro-Grants Platform',
      concept: 'Build a GitHub repo + simple web app that lets high schoolers apply for $50-$200 micro-grants to fund their passion projects. You fundraise the seed capital (alumni donations, local businesses) and run it like a mini YC—reviewing apps, disbursing funds, showcasing winners.',
      whyItStandsOut: 'Combines technical skills (full-stack dev), entrepreneurship (fundraising), and systemic impact (funding other students). Admissions officers love "meta" projects that empower peers.',
      hardness: 4,
      effectiveness: 5,
      starterSteps: [
        'Build MVP: simple form + Stripe/PayPal integration for disbursement',
        'Secure $500-$1000 seed funding (pitch 5-10 local businesses or alumni)',
        'Launch first cohort of 5-10 grantees, document outcomes on blog'
      ]
    })
  }

  // Idea 3: Creative/Arts angle
  if (narrative.theme.toLowerCase().includes('arts') || narrative.theme.toLowerCase().includes('music') || narrative.theme.toLowerCase().includes('creative')) {
    ideas.push({
      title: 'Generative Jazz Rehearsal Assistant',
      concept: 'Code a web app that generates chord progressions, backing tracks, or improvisation prompts using AI models (e.g., OpenAI API or open-source music gen). Use it with your jazz ensemble to practice improv, then publish it for other high school bands.',
      whyItStandsOut: 'Fuses deep technical skill with artistic passion. Shows you\'re pushing the boundaries of both fields—not choosing one over the other.',
      hardness: 4,
      effectiveness: 4,
      starterSteps: [
        'Research music generation APIs (Magenta, OpenAI Jukebox, or simple MIDI libraries)',
        'Build basic prototype: user selects key/style → app generates 4-bar progression',
        'Test with your band, iterate based on feedback, open-source on GitHub'
      ]
    })
  }

  // Idea 4: Research/Academic angle
  if (narrative.theme.toLowerCase().includes('research') || narrative.theme.toLowerCase().includes('academic') || narrative.theme.toLowerCase().includes('intellectual')) {
    ideas.push({
      title: 'Hyperlocal Environmental Data Tracker',
      concept: 'Deploy low-cost sensors (air quality, water pH, noise levels) around your neighborhood. Collect data for 3-6 months, analyze trends, publish findings on a public dashboard. Present to city council or local environmental groups.',
      whyItStandsOut: 'Real-world data science with civic engagement. Moves beyond "I did a science fair project" to "I generated actionable insights that influenced local policy."',
      hardness: 3,
      effectiveness: 5,
      starterSteps: [
        'Buy/build 3-5 sensors (e.g., PurpleAir for air quality, Arduino pH sensors)',
        'Set up data pipeline: sensors → database → simple web dashboard',
        'Collect 8-12 weeks of data, write analysis report, present to local officials'
      ]
    })
  }

  // Fallback: Generic high-impact idea
  if (ideas.length === 0) {
    ideas.push({
      title: 'Student-to-Student Skill Exchange Platform',
      concept: 'Create a web platform where high schoolers can teach each other skills (coding, music, art, etc.) via 1-on-1 video calls. You match students based on what they want to learn/teach, facilitate sessions, and track outcomes.',
      whyItStandsOut: 'Scalable peer-to-peer education model. Shows you understand platform dynamics and community-building.',
      hardness: 3,
      effectiveness: 4,
      starterSteps: [
        'Build basic matching form + scheduling system (Google Calendar integration)',
        'Recruit 10-20 students from your school as pilot users',
        'Run for 1 month, collect testimonials, expand to other schools'
      ]
    })
  }

  // Return top 2-3 ideas
  return ideas.slice(0, 3)
}

/**
 * Get essay idea aligned with specific school values
 */
export function getSchoolAlignedEssayIdea(
  narrative: Narrative,
  school: School,
  fit: SchoolFit
): EssayIdea | null {
  const ideas = getEssayIdeas(narrative, school)
  
  // Find idea that best aligns with school's top traits
  const topTraits = Object.entries(fit.traitMatch)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([trait]) => trait)

  // Match idea to traits (simple heuristic)
  const traitKeywords: Record<string, string[]> = {
    intellectualCuriosity: ['research', 'data', 'analysis', 'academic'],
    socialImpact: ['community', 'clinic', 'neighborhood', 'civic'],
    innovation: ['platform', 'open-source', 'generative', 'ai'],
    leadership: ['grants', 'platform', 'exchange', 'council'],
    creativity: ['jazz', 'generative', 'music', 'arts']
  }

  for (const idea of ideas) {
    for (const trait of topTraits) {
      const keywords = traitKeywords[trait] || []
      if (keywords.some(kw => idea.concept.toLowerCase().includes(kw) || idea.title.toLowerCase().includes(kw))) {
        return idea
      }
    }
  }

  return ideas[0] || null
}
