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
  }, [supabase])

  const handleStartProfile = () => {
    if (isAuthenticated) {
      router.push('/flow')
    } else {
      router.push('/signup')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#eef2ff] to-white" />
      <div className="absolute inset-x-0 top-[-200px] h-[400px] blur-3xl bg-gradient-to-r from-blue-100 via-indigo-100 to-cyan-100 opacity-70" />

      <div className="relative z-10">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">college101</p>
            <p className="text-xs text-slate-400">Admissions toolkit</p>
          </div>
          <div className="flex items-center gap-3">
            {loading ? null : isAuthenticated ? (
              <Link href="/flow">
                <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 pb-24">
          <section className="text-center py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-slate-200 text-sm text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AI strategy copilot for ambitious students
            </div>
            <h1 className="mt-8 text-4xl sm:text-5xl md:text-6xl font-semibold text-slate-900 tracking-tight">
              Build admissions narratives
              <br /> that feel deliberate, not chaotic
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
              Paste every activity, competition, and passion project. We synthesize the chaos into polished "spikes", alignment summaries, and essay prompts tuned to each school on your list.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleStartProfile} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-base">
                {isAuthenticated ? 'Open dashboard' : 'Start free workspace'}
              </Button>
              <Link href="#features">
                <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-white px-8 py-6 text-base">
                  See how it works
                </Button>
              </Link>
            </div>

          </section>

          <section id="features" className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Narrative architect',
                description: 'Group scattered activities into 3 distinct spikes with positioning statements.',
              },
              {
                title: 'School DNA cards',
                description: 'Instantly see what each target school rewards and where your profile resonates.',
              },
              {
                title: 'Essay launch kits',
                description: 'Auto-generate outlines, voice guidelines, and concrete anecdotes to reuse.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card-surface rounded-3xl p-8 flex flex-col gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-900/90 text-white flex items-center justify-center text-lg">
                  •
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </section>

          <section className="mt-20">
            <div className="card-surface rounded-3xl p-12">
              <p className="text-base uppercase tracking-[0.35em] text-slate-400">workflow</p>
              <h3 className="mt-4 text-3xl sm:text-4xl font-semibold text-slate-900">Five deliberate passes instead of one messy sprint</h3>
              <ol className="mt-8 space-y-5 text-base text-slate-600">
                {[
                  'Dump every activity, job, research stint, and spark into the inbox list.',
                  'Auto-cluster into academic, community, creative, and leadership threads.',
                  'Let the model propose 3-4 coherent spikes plus supporting evidence.',
                  'Score each target school for resonance, gaps, and action items.',
                  'Generate essay kits and weekly follow-ups to keep momentum.',
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-5">
                    <span className="mt-1 h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <footer className="mt-24 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
            Built for students who refuse to be a bullet list.
          </footer>
        </main>
      </div>
    </div>
  )
}
