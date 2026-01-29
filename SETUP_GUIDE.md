# Getting Started with College101

## Prerequisites
- Node.js 18+ installed
- npm or yarn
- An Anthropic Claude API key ([get one here](https://console.anthropic.com/))

## Installation & Setup

### Step 1: Clone/Navigate to Project
```bash
cd college101
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Create a `.env.local` file in the project root:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-v1-xxxxxxxxxxxx
```

Replace `sk-ant-v1-xxxxxxxxxxxx` with your actual API key from [console.anthropic.com](https://console.anthropic.com/)

### Step 4: Start Development Server
```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## Running the Application

### Development Mode
```bash
npm run dev
```
- Hot module reloading (changes auto-reflect)
- TypeScript type checking
- Server at http://localhost:3000

### Production Build
```bash
npm run build
npm run start
```
- Optimized production bundle
- Static asset optimization
- Server at http://localhost:3000

### Type Checking Only
```bash
npm run type-check
```

## Using the Application

### Flow
1. **Landing Page** (`/`) - Overview of features
2. **Profile Creation** (`/flow`) - 5-step form:
   - Activities (add 5+ extracurriculars)
   - Academics (GPA, test scores, majors)
   - Schools (select target universities)
   - Constraints (timeline, budget, location)
   - Review & Generate
3. **Narrative Selection** - Choose from 3 AI-generated narratives
4. **School Fit Analysis** - View how narrative aligns with each school
5. **Action Dashboard** - Timeline, essay strategy, next steps

### Useful Features
- **Export Analysis**: Download action plan as TXT/CSV
- **Activity Tags**: STEM, Arts, Leadership, Community Service, Athletics, Academic
- **School Tiers**: Reach, Target, Safety (auto-calculated based on stats)
- **Coherence Scoring**: 0-100 scale for narrative strength
- **Trait Matching**: 6 attributes across all schools

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"
- Check `.env.local` file exists in project root
- Verify API key is correct and not expired
- Restart dev server after adding key

### Build fails with TypeScript errors
```bash
npm run type-check  # Check for type issues
npm run build       # Try clean build
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001  # Use different port
```

### Module not found errors
```bash
rm -rf node_modules
npm install  # Clean reinstall
```

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel deploy
```

Add `ANTHROPIC_API_KEY` to Vercel environment variables in your project settings.

### Docker
```bash
docker build -t college101 .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  college101
```

## Development Tips

### Debugging
- Open Chrome DevTools (F12)
- React DevTools browser extension recommended
- Console logs appear in both terminal and DevTools

### Making Changes
- Component files in `src/components/`
- Pages in `src/app/`
- Types in `src/types/index.ts`
- Claude prompts in `src/lib/claude.ts`

### Testing Components
1. Update the component
2. Dev server auto-reloads
3. Test in browser (http://localhost:3000)
4. Check console for errors

## Performance Tips
- Clear browser cache if styles don't update
- Use incognito mode to test fresh experience
- Check Network tab in DevTools for API calls
- Monitor performance using Chrome Lighthouse

## Getting Help

### Check Logs
- **Dev Server**: Terminal output shows compilation errors
- **Browser Console**: F12 → Console tab for runtime errors
- **Claude API Issues**: Check [Anthropic Documentation](https://docs.anthropic.com)

### Common Issues
- **API timeouts**: Increase API rate limit or reduce text length
- **Memory issues**: Restart dev server
- **TypeScript errors**: Run `npm run type-check`

## Next Steps
- Read [Project README](./README.md) for full feature overview
- Check [Anthropic API Docs](https://docs.anthropic.com) for Claude capabilities
- Explore [Next.js Documentation](https://nextjs.org/docs)
- Review type definitions in `src/types/index.ts`

---

Happy building! 🚀
