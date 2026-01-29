# Feature Summary: Dynamic Tiers & Essay Launch Kits

## 🎯 What Was Built

### 1. **Dynamic School Tier Classification**
**Location:** [lib/admissions-utils.ts](lib/admissions-utils.ts)

**How It Works:**
- `computeTier(profile, school, fit)` - Calculates tier based on:
  - **Admission Rate Rule**: Schools <10% admission = always Reach
  - **Academic Match Score**: Compares student's SAT/ACT vs school's ranges
    - Above range = 100 points
    - 70th-100th percentile = 70-100 points
    - 40th-70th percentile = 40-70 points
    - Below range = 0-40 points
  - **Fit Boost**: ±10 points based on narrative alignment
    - 80%+ fit = +10 points
    - <50% fit = -10 points
  - **Final Tier Mapping**:
    - Highly selective (10-20%): 75+ = Target, else Reach
    - Selective (20-40%): 85+ = Safety, 60+ = Target, else Reach
    - Less selective (40%+): 70+ = Safety, 45+ = Target, else Reach

**Example:**
- Student: SAT 1550, 85% fit with Stanford
- Stanford: 3.4% admit, SAT 1470-1570
- Result: **Reach** (admission rate <10% = auto-Reach)
- Rationale: "3.4% admission rate (ultra-competitive) • SAT 1550 above school's 1570 (top of range) • 85% narrative fit boosts chances"

### 2. **Essay Launch Kits with Metrics**
**Location:** [lib/admissions-utils.ts](lib/admissions-utils.ts)

**Generated Ideas:**
Each essay idea includes:
- **Title**: Catchy name (e.g., "Neighborhood AI Clinic Nights")
- **Concept**: 2-3 sentence pitch with concrete details
- **Why It Stands Out**: What makes it unique for admissions
- **Hardness**: ⚡1-5 (execution difficulty)
- **Effectiveness**: ⭐1-5 (impact on application)
- **Starter Steps**: 3 actionable steps to launch in next 2 weeks

**Sample Ideas:**
1. **Neighborhood AI Clinic Nights** (⚡⚡, ⭐⭐⭐⭐⭐)
   - Host monthly AI office hours at libraries for seniors/small businesses
   - Hardness: 2/5, Impact: 5/5
   
2. **Open-Source Micro-Grants Platform** (⚡⚡⚡⚡, ⭐⭐⭐⭐⭐)
   - Build web app to fund high schoolers' passion projects
   - Hardness: 4/5, Impact: 5/5
   
3. **Generative Jazz Rehearsal Assistant** (⚡⚡⚡⚡, ⭐⭐⭐⭐)
   - AI-powered chord progressions for band practice
   - Hardness: 4/5, Impact: 4/5

4. **Hyperlocal Environmental Data Tracker** (⚡⚡⚡, ⭐⭐⭐⭐⭐)
   - Deploy sensors, analyze data, present to city council
   - Hardness: 3/5, Impact: 5/5

## 📍 Where It Shows Up

### School Fit Analysis ([components/SchoolFitAnalysis.tsx](components/SchoolFitAnalysis.tsx))
- **School Selector Cards**: Dynamic tier badges (Reach/Target/Safety) with colored backgrounds
  - Rose = Reach, Blue = Target, Emerald = Safety
  - Shows admission rate next to tier
- **Tier Explanation Box**: 
  - Bullet-point rationale (e.g., "SAT 1550 vs school's 1470-1570 (strong match)")
  - Color-coded border matching tier
- **Essay Launch Kit**: School-aligned idea card with:
  - Gradient background (indigo/purple/pink)
  - Hardness (⚡) and Impact (⭐) meters
  - "Why it stands out" callout
  - Numbered starter steps

### Action Dashboard ([components/ActionDashboard.tsx](components/ActionDashboard.tsx))
- **Essay Launch Kits Section**: 
  - 2-3 bold ideas at top of essay section
  - Each idea in gradient card with metrics
  - Starter steps as numbered list
- **School-Specific Supplements**: Below essay ideas
  - School name + due date
  - Narrative alignment hints (emerald box)

## 🧪 Test Scenarios

### Scenario 1: High-Stats Student at Selective Schools
**Profile:**
- SAT 1580, GPA 4.0
- Schools: Stanford (3.4%), UC Berkeley (8.7%), Michigan State (64.2%)

**Expected Tiers:**
- Stanford: **Reach** (admit <10%)
- UC Berkeley: **Reach** (admit <10%)
- Michigan State: **Safety** (1580 >> 1140-1340)

**Rationale Examples:**
- Stanford: "3.4% admission rate (ultra-competitive) • SAT 1580 above school's 1570 (top of range)"
- Michigan State: "64.2% admission rate • SAT 1580 above school's 1340 (top of range)"

### Scenario 2: Average Student at Range of Schools
**Profile:**
- SAT 1200, GPA 3.5
- Schools: Harvard (3.2%), Northwestern (5.6%), SUNY (41.2%)

**Expected Tiers:**
- Harvard: **Reach** (admit <10%)
- Northwestern: **Reach** (admit <10%)
- SUNY: **Target** (1200 within 1000-1200 range, 41% admit)

### Scenario 3: Narrative Fit Boost
**Profile:**
- SAT 1450, 85% fit with UPenn
- UPenn: 1450-1560 SAT, 3.2% admit

**Expected Tier:**
- UPenn: **Reach** (admit <10%, but fit boost moves academic score from 40→50)
- Rationale: "3.2% admission rate (ultra-competitive) • SAT 1450 vs school's 1450-1560 (within range) • 85% narrative fit boosts chances"

## 🔥 What Makes This Real

### No More Fake Tiers
**Before:** UC Berkeley = "Target" for everyone (static in database)
**After:** UC Berkeley = Reach/Target/Safety based on your stats + fit

### Essays That Actually Work
**Before:** "Write about your narrative" (generic)
**After:** 
- "Open-Source Micro-Grants Platform" - Full execution plan
- Hardness rating so you know effort required
- Effectiveness rating so you know if it's worth it
- 3 steps to launch THIS WEEK

### Real Talk to Students
- "1600 SAT doesn't make Stanford a Safety—it's still 3.4% admit rate"
- "Your 1550 SAT + 85% narrative fit makes UPenn a strong Reach (not impossible)"
- "This essay idea is hard (⚡⚡⚡⚡) but will crush (⭐⭐⭐⭐⭐)"

## 🚀 Next Steps (Optional Enhancements)

1. **Tier Simulator**: Let students adjust GPA/SAT and see tiers change in real-time
2. **Essay Idea Voting**: Upvote/downvote ideas, track what gets students admitted
3. **Tier History**: Show how tier changed based on fit score after narrative generation
4. **Custom Essay Ideas**: Use AI to generate personalized ideas based on student's specific activities
5. **Difficulty Curve**: Show hardness/effectiveness scatter plot to help students pick optimal ideas

---

**Built:** January 2026  
**Impact:** Gives students real, actionable insights instead of generic college advice
