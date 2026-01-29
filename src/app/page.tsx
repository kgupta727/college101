'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setLoading(false)
    }
    checkAuth()
  }, [supabase.auth])

  const handleStartProfile = () => {
    if (isAuthenticated) {
      router.push('/flow')
    } else {
      router.push('/signup')
    }
  }

  return (
    <div 
      className="min-h-screen bg-white relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(5, 150, 105, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 0% 50%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 50%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
          white
        `,
      }}
    >
      {/* Light Rays Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            conic-gradient(from 0deg at 50% 0%, 
              rgba(5, 150, 105, 0.08) 0deg,
              transparent 60deg,
              transparent 300deg,
              rgba(5, 150, 105, 0.08) 360deg
            )
          `,
          opacity: 0.5,
        }}      />
      {/* Content */}      <div className="relative z-10">
      {/* Navigation */}
      <nav className="border-b border-sand-100 blur-backdrop sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold gradient-text">
            college101
          </h1>
          <div className="flex items-center gap-4">
            {loading ? null : isAuthenticated ? (
              <Link href="/flow">
                <Button variant="outline" className="border-forest-300 text-forest-600 hover:bg-forest-50">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-forest-300 text-forest-600 hover:bg-forest-50">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-forest-300 to-forest-400 hover:from-forest-400 hover:to-forest-500 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-slide-up">
        <h2 className="text-5xl sm:text-6xl font-display font-bold text-forest-700 mb-6 leading-tight">
          Turn Your Activities Into <span className="bg-gradient-to-r from-coral-300 to-coral-200 bg-clip-text text-transparent">Coherent Stories</span>
        </h2>
        <p className="text-xl text-forest-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          college101 analyzes your messy collection of activities and generates 2-3 powerful narrative "spikes" designed specifically for your target schools.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            onClick={handleStartProfile}
            size="lg" 
            className="bg-gradient-to-r from-coral-300 to-coral-200 hover:from-coral-400 hover:to-coral-300 text-white px-8 shadow-lg hover:shadow-xl glow hover:glow animate-smooth"
          >
            {isAuthenticated ? 'Continue to Dashboard' : 'Start Your Profile'}
          </Button>
          <Link href="#features">
            <Button size="lg" variant="outline" className="border-forest-300 text-forest-600 hover:bg-forest-50 px-8 animate-smooth">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Feature Preview */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="bg-white/80 border border-sand-100 rounded-xl p-6 card-hover shadow-md hover:glow-subtle hover:shadow-lg transition-all duration-300 float">
            <div className="text-4xl mb-3 block">📊</div>
            <h3 className="text-lg font-display font-semibold text-forest-600 mb-2">Narrative Analysis</h3>
            <p className="text-forest-500 text-sm leading-relaxed">
              AI generates 3 distinct narrative spikes from your activities with coherence scores
            </p>
          </div>

          <div className="bg-white/80 border border-sand-100 rounded-xl p-6 card-hover shadow-md hover:glow-subtle hover:shadow-lg transition-all duration-300 float" style={{ animationDelay: '200ms' }}>
            <div className="text-4xl mb-3 block">🎯</div>
            <h3 className="text-lg font-display font-semibold text-forest-600 mb-2">School Fit Analysis</h3>
            <p className="text-forest-500 text-sm leading-relaxed">
              See how your narrative aligns with each school's "admissions DNA"
            </p>
          </div>

          <div className="bg-white/80 border border-sand-100 rounded-xl p-6 card-hover shadow-md hover:glow-subtle hover:shadow-lg transition-all duration-300 float" style={{ animationDelay: '400ms' }}>
            <div className="text-4xl mb-3 block">✍️</div>
            <h3 className="text-lg font-display font-semibold text-forest-600 mb-2">Essay Optimization</h3>
            <p className="text-forest-500 text-sm leading-relaxed">
              Get AI-powered rewrite suggestions for each school's unique preferences
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-sand-100">
        <h3 className="text-3xl font-display font-bold text-forest-700 mb-8 text-center">How It Works</h3>
        <div className="space-y-6">
          <div className="flex gap-4 animate-slide-in">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-coral-300 to-coral-200 flex items-center justify-center text-white font-bold shadow-md glow">1</div>
            <div>
              <h4 className="font-display font-semibold text-forest-600 mb-1">Input Your Activities</h4>
              <p className="text-forest-500">Dump all your activities, clubs, projects, and academic interests</p>
            </div>
          </div>
          <div className="flex gap-4 animate-slide-in" style={{ animationDelay: '100ms' }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-coral-300 to-coral-200 flex items-center justify-center text-white font-bold shadow-md glow">2</div>
            <div>
              <h4 className="font-display font-semibold text-forest-600 mb-1">Get Narrative Suggestions</h4>
              <p className="text-forest-500">AI analyzes your profile and generates 3 coherent narrative spikes</p>
            </div>
          </div>
          <div className="flex gap-4 animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-coral-300 to-coral-200 flex items-center justify-center text-white font-bold shadow-md glow">3</div>
            <div>
              <h4 className="font-display font-semibold text-forest-600 mb-1">Analyze School Fit</h4>
              <p className="text-forest-500">See how each narrative fits your target schools with detailed breakdowns</p>
            </div>
          </div>
          <div className="flex gap-4 animate-slide-in" style={{ animationDelay: '300ms' }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-coral-300 to-coral-200 flex items-center justify-center text-white font-bold shadow-md glow">4</div>
            <div>
              <h4 className="font-display font-semibold text-forest-600 mb-1">Optimize Your Essays</h4>
              <p className="text-forest-500">Get school-specific essay suggestions and action timelines</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-100 py-8 text-center text-forest-500 blur-backdrop">
        <p className="font-medium">college101 • AI-powered college admissions strategy</p>
      </footer>
      </div>
    </div>
  )
}
