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

Try it here: https://college101-tau.vercel.app/
