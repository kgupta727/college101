// Activity Types
export interface Activity {
  id: string
  name: string
  role?: string
  hoursPerWeek?: number
  yearsInvolved?: number
  description?: string
  tags: ActivityTag[]
  impact?: string
}

export type ActivityTag = 'STEM' | 'Arts' | 'Leadership' | 'Community Service' | 'Athletics' | 'Academic'

// Academic Profile
export interface AcademicProfile {
  gpa: number
  testScores: {
    sat?: number
    act?: number
  }
  apCount: number
  ibCount: number
  intendedMajors: string[]
  academicInterests: string
}

// School
export interface School {
  id: string
  name: string
  tier: 'Reach' | 'Target' | 'Safety' | 'N/A'
  satRange: [number, number]
  actRange: [number, number]
  admissionRate: number
  majorOfferingsCount: number
}

// Narrative
export interface Narrative {
  id: string
  title: string
  theme: string
  coherenceScore: number
  supportingActivities: Activity[]
  gaps: string[]
  recommendedDrops: Activity[]
  actionPlan: string
  essayAngle: string
  surprisingHook?: string
  lensKey?: string
}

// Narrative Analysis
export interface NarrativeAnalysis {
  narratives: Narrative[]
  selectedNarrativeId?: string
  generatedAt: Date
}

// School Fit
export interface SchoolFit {
  schoolId: string
  narrativeId: string
  /** Dynamic per-college trait names (camelCase) → score 0-100 */
  traitMatch: Record<string, number>
  overallFitScore: number
  percentileRank: number
  /** What this college specifically looks for in applicants */
  collegeValues: string[]
  /** Student's profile highlights that map well to this college */
  strengths: string[]
  /** Gaps or areas to address for this college */
  improvements: string[]
  essayRewriteSuggestions?: {
    original: string
    rewritten: string
    colorCoding: Array<{ text: string; fit: 'strong' | 'neutral' | 'misaligned' }>
  }
}

// Student Profile
export interface StudentProfile {
  id: string
  name: string
  activities: Activity[]
  academicProfile: AcademicProfile
  targetSchools: School[]
  essayDraft?: string
  constraints: {
    monthsUntilDeadline: number
    budgetForNewActivities: boolean
    geographicConstraints?: string[]
  }
  narrativeAnalysis?: NarrativeAnalysis
  schoolFits: SchoolFit[]
}

// Timeline
export interface TimelineEvent {
  date: Date
  milestone: string
  type: 'activity' | 'essay' | 'deadline'
  priority: 'high' | 'medium' | 'low'
}
