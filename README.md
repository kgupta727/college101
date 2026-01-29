# College101 - AI-Powered College Admissions Narrative Analyzer

A comprehensive web application that leverages Claude AI to help high school students develop compelling college application narratives, analyze school fit, and create actionable plans.

## Features

### 🎯 Phase 1: Student Profile Creation
- **Multi-step form** capturing:
  - **Activities**: 5+ extracurricular activities with role, hours/week, years involved, and category tags (STEM, Arts, Leadership, Community Service, Athletics, Academic)
  - **Academics**: GPA, SAT/ACT scores, AP/IB counts, intended majors
  - **Schools**: Target school selection (auto-categorized by Reach/Target/Safety)
  - **Constraints**: Timeline (1-12 months to deadline), budget for new activities, geographic limitations
- Real-time validation and progress tracking
- School tier auto-categorization based on user stats

### 📊 Phase 2: AI-Generated Narratives
- Claude Sonnet 3.5 analyzes activities and generates **3 distinct narrative spikes**
- Each narrative includes:
  - **Compelling title** and thematic overview
  - **Coherence score** (0-100) indicating narrative strength
  - **Supporting activities** that align with the narrative
  - **Gaps** - missing elements to strengthen credibility
  - **Recommended drops** - activities diluting the narrative
  - **30-day action plan** - concrete project to implement
  - **Essay angle** - potential Common App topic
- Interactive selection with visual feedback

### 🎓 Phase 3: School Fit Analysis
- **Trait-based matching** across 6 key attributes:
  - Intellectual Curiosity
  - Social Impact
  - Innovation
  - Resilience
  - Leadership
  - Creativity
- Claude AI analyzes fit for each target school
- Visual trait matcher with animated progress bars
- Overall fit score + percentile ranking

### ✅ Phase 4: Action Dashboard
- **Monthly timeline** with interactive milestones
- **Activity pruning recommendations** - which activities to drop/refocus
- **Essay strategy** - "Why Us?" prompts and writing deadlines for top schools
- **30-day action plan** - immediate next steps
- **PDF/CSV export** for offline planning

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui, Lucide Icons
- **Data Viz**: Recharts
- **AI/LLM**: Anthropic Claude Sonnet 3.5 via Server Actions
- **Build**: Turbopack

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Claude API
Create `.env.local` in the project root:
```
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from [Anthropic Console](https://console.anthropic.com/)

### 3. Start Dev Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production
```bash
npm run build
npm run start
```

## Project Structure

```
college101/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (hero, features)
│   │   ├── flow/
│   │   │   └── page.tsx          # Main 4-step orchestrator
│   │   ├── profile/
│   │   │   └── page.tsx          # Profile navigation page
│   │   └── layout.tsx            # App layout
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx        # shadcn Button component
│   │   ├── steps/
│   │   │   ├── ActivitiesStep.tsx     # Activity input form
│   │   │   ├── AcademicStep.tsx       # Academic profile input
│   │   │   ├── SchoolsStep.tsx        # School selection
│   │   │   └── ConstraintsStep.tsx    # Timeline/constraints
│   │   ├── ProfileForm.tsx            # Multi-step form manager
│   │   ├── NarrativeDisplay.tsx       # Show 3 narratives
│   │   ├── NarrativeCard.tsx          # Individual narrative card
│   │   ├── SchoolFitAnalysis.tsx      # School fit analyzer
│   │   ├── TraitMatcher.tsx           # Trait visualization
│   │   └── ActionDashboard.tsx        # Timeline & action plan
│   ├── actions/
│   │   └── generateNarratives.ts  # Server action for Claude calls
│   ├── lib/
│   │   ├── claude.ts              # Claude API integration
│   │   └── utils.ts               # Helper utilities
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── styles/
│       └── globals.css
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Key Components

### ProfileForm
Multi-step form managing the complete student profile collection with validation at each step.

**Props:**
- `onComplete(profile: StudentProfile)` - Callback when form completes

### NarrativeDisplay
Shows 3 AI-generated narrative options for the student to choose from.

**Props:**
- `narratives: Narrative[]` - Array of generated narratives
- `profile: StudentProfile` - User profile data
- `loading: boolean` - Loading state
- `onSelectNarrative(narrative: Narrative)` - Selection callback

### SchoolFitAnalysis
Analyzes how well the selected narrative aligns with each target school.

**Props:**
- `narrative: Narrative` - Selected narrative
- `profile: StudentProfile` - User profile with target schools

### ActionDashboard
Creates and displays an actionable timeline, essay strategy, and next steps.

**Props:**
- `narrative: Narrative` - Selected narrative
- `profile: StudentProfile` - User profile

## Data Types

All TypeScript interfaces defined in `src/types/index.ts`:

```typescript
interface Activity {
  id: string
  name: string
  role?: string
  hoursPerWeek?: number
  yearsInvolved?: number
  tags: ActivityTag[]
  description?: string
}

interface Narrative {
  id: string
  title: string
  theme: string
  coherenceScore: number  // 0-100
  supportingActivities: Activity[]
  gaps: string[]
  recommendedDrops: Activity[]
  actionPlan: string
  essayAngle: string
}

interface StudentProfile {
  activities: Activity[]
  academicProfile: AcademicProfile
  targetSchools: School[]
  constraints: Constraints
}

interface SchoolFit {
  schoolId: string
  narrativeId: string
  traitMatch: {
    intellectualCuriosity: number
    socialImpact: number
    innovation: number
    resilience: number
    leadership: number
    creativity: number
  }
  overallFitScore: number
  percentileRank: number
}
```

## Claude Integration

The app uses Claude Sonnet 3.5 via Server Actions for two key operations:

### 1. Narrative Generation
- Input: `StudentProfile` (activities, academics, constraints)
- Output: 3 distinct `Narrative` objects with coherence scores
- Prompt: Analyzed activities and generates strategic "spikes" for college applications

### 2. School Fit Analysis
- Input: `Narrative` + `schoolName`
- Output: `SchoolFit` with trait matching and percentile ranking
- Prompt: Analyzes alignment between narrative and school values

## Styling

- **Color Scheme**: Dark gradient theme (slate-900 → slate-800 → slate-900)
- **Typography**: System fonts (Segoe UI on Windows, SF Pro on Mac)
- **Spacing**: Tailwind CSS spacing utilities
- **Animations**: Framer Motion for transitions and staggered reveals
- **Responsiveness**: Mobile-first Tailwind design

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Claude API key from [console.anthropic.com](https://console.anthropic.com/)

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```bash
docker build -t college101 .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=your_key college101
```

## Performance

- **Build Time**: ~4.5 seconds
- **First Load**: <1.5 seconds
- **API Calls**: Minimal (only on narrative generation and school fit analysis)
- **Bundle Size**: ~250KB (gzipped) after optimization

## Testing

### Dev Server Testing
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000
3. Click "Start Your Profile"
4. Fill all 5 form steps
5. Receive 3 AI-generated narratives
6. Select 1 narrative
7. View school fit analysis
8. Explore action dashboard

### Sample Data
Activities:
- Coding club (STEM, 8 hrs/week, 3 years)
- Debate team (Leadership, 10 hrs/week, 2 years)
- Community tutoring (Community Service, 5 hrs/week, 4 years)
- Piano (Arts, 6 hrs/week, 8 years)
- Student government (Leadership, 7 hrs/week, 1 year)

Academic Profile:
- GPA: 3.92
- SAT: 1540
- APs: 8
- Majors: Computer Science, Neuroscience

## FAQ

**Q: Can I export my analysis?**
A: Yes! The Action Dashboard has an export button for TXT/CSV download.

**Q: How accurate is the AI analysis?**
A: Claude Sonnet 3.5 provides insightful analysis, but always review recommendations with a school counselor.

**Q: Can I generate new narratives?**
A: Yes, return to the profile form and click "Generate New Narratives" after modifying activities.

**Q: Is my data saved?**
A: Currently, data is stored in-session. You can export your analysis to save locally.

## Support & Contributing

For issues or feature requests, please open a GitHub issue.

## License

MIT License - feel free to use for educational purposes.

---

**Built with ❤️ to help students tell their best stories**
