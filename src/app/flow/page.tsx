'use client'

import { useState, useEffect } from 'react'
import { StudentProfile, Narrative } from '@/types'
import ProfileForm from '@/components/ProfileForm'
import NarrativeDisplay from '@/components/NarrativeDisplay'
import SchoolFitAnalysis from '@/components/SchoolFitAnalysis'
import ActionDashboard from '@/components/ActionDashboard'
import { generateNarrativesAction } from '@/actions/generateNarratives'
import { loadProfileAction, saveProfileAction, saveNarrativesAction, loadNarrativesAction } from '@/actions/profileActions'
import { Button } from '@/components/ui/button'
import { ChevronLeft, RotateCw, Edit2 } from 'lucide-react'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'

type FlowStep = 'profile' | 'narratives' | 'schoolFit' | 'actionPlan'

export default function FlowPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('profile')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null)
  const [narrativeCompleted, setNarrativeCompleted] = useState(false)
  const [schoolFitCompleted, setSchoolFitCompleted] = useState(false)
  const [actionPlanCompleted, setActionPlanCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const steps: { key: FlowStep; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'narratives', label: 'Narratives' },
    { key: 'schoolFit', label: 'School Fit' },
    { key: 'actionPlan', label: 'Action Plan' },
  ]

  // Load existing profile on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const existingProfile = await loadProfileAction()
        if (existingProfile) {
          setProfile(existingProfile)
          
          // Load saved narratives
          const savedNarratives = await loadNarrativesAction()
          if (savedNarratives && savedNarratives.length > 0) {
            setNarratives(savedNarratives)
            // Auto-select first narrative
            setSelectedNarrative(savedNarratives[0])
            
            // Restore last visited page from localStorage
            const lastStep = localStorage.getItem('lastFlowStep')
            if (lastStep && ['narratives', 'schoolFit', 'actionPlan'].includes(lastStep)) {
              setCurrentStep(lastStep as FlowStep)
            } else {
              // If no saved step, go to narratives since we have narratives
              setCurrentStep('narratives')
            }
            
            // Mark all steps as completed since user has narratives and has visited them
            setNarrativeCompleted(true)
            setSchoolFitCompleted(true)
            setActionPlanCompleted(true)
          } else {
            // No narratives yet, stay on profile or narratives
            const lastStep = localStorage.getItem('lastFlowStep')
            if (lastStep && lastStep !== 'profile') {
              setCurrentStep(lastStep as FlowStep)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setInitialLoad(false)
      }
    }
    loadExistingProfile()
  }, [])

  // Save current step to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lastFlowStep', currentStep)
  }, [currentStep])

  const handleProfileComplete = async (completeProfile: StudentProfile) => {
    setProfile(completeProfile)
    setLoading(true)

    try {
      // Save profile to database
      await saveProfileAction(completeProfile)
      
      const generatedNarratives = await generateNarrativesAction(completeProfile)
      setNarratives(generatedNarratives)
      
      // Save narratives to database
      await saveNarrativesAction(completeProfile.id, generatedNarratives)
      
      setCurrentStep('narratives')
    } catch (error) {
      console.error('Failed to generate narratives:', error)
      alert('Failed to generate narratives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile)
    setLoading(true)

    try {
      // Save profile to database
      await saveProfileAction(updatedProfile)
      // Stay on current step after profile update
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateNarratives = async () => {
    if (!profile) return
    setLoading(true)

    try {
      const generatedNarratives = await generateNarrativesAction(profile)
      setNarratives(generatedNarratives)
      await saveNarrativesAction(profile.id, generatedNarratives)
      setSelectedNarrative(generatedNarratives[0] || null)
    } catch (error) {
      console.error('Failed to regenerate narratives:', error)
      alert(`Failed to regenerate narratives: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleNarrativeSelect = (narrative: Narrative) => {
    setNarrativeCompleted(true)
    setSelectedNarrative(narrative)
  }

  const handleProfileStepComplete = async (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile)
    try {
      await saveProfileAction(updatedProfile)
    } catch (error) {
      console.error('Failed to save profile:', error)
      throw error
    }
  }

  const handleProceedToSchoolFit = () => {
    if (selectedNarrative) {
      setCurrentStep('schoolFit')
    }
  }

  const handleProceedToActionPlan = () => {
    setCurrentStep('actionPlan')
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#eef2ff] to-white" />
      <div className="absolute inset-x-0 top-[-240px] h-[420px] blur-3xl bg-gradient-to-r from-blue-100 via-indigo-100 to-cyan-100 opacity-70" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(15,118,110,0.06), transparent 28%), radial-gradient(circle at 80% 10%, rgba(8,47,73,0.05), transparent 26%)' }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/30 bg-white/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-white/60">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">workspace</p>
              <p className="text-sm font-semibold text-slate-900">college101</p>
            </div>
            <UserMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key
                const isComplete = (
                  (step.key === 'profile') ||
                  (step.key === 'narratives' && narrativeCompleted) ||
                  (step.key === 'schoolFit' && schoolFitCompleted) ||
                  (step.key === 'actionPlan' && actionPlanCompleted)
                )
                const isClickable = isActive || isComplete
                
                return (
                  <div key={step.key} className="flex items-center gap-3 text-sm">
                    {index > 0 && <span className="text-slate-300">/</span>}
                    <button
                      onClick={() => isClickable && setCurrentStep(step.key)}
                      disabled={!isClickable}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium shadow-sm transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900'
                          : isClickable
                            ? 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white hover:shadow-md cursor-pointer'
                            : 'bg-white/60 text-slate-500 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: isActive ? '#22c55e' : isClickable && !isActive ? '#a5b4fc' : '#cbd5e1' }} />
                      {step.label}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Profile Step */}
          {currentStep === 'profile' && (
            <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
              {initialLoad ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Loading your profile...</p>
                </div>
              ) : (
                <ProfileForm 
                  onComplete={handleProfileComplete}
                  initialProfile={profile}
                  onStepComplete={handleProfileStepComplete}
                />
              )}
            </div>
          )}

          {/* Narratives Step */}
          {currentStep === 'narratives' && profile && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">Your narratives</h2>
                  <Button
                    onClick={handleRegenerateNarratives}
                    disabled={loading}
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-white gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    Generate New
                  </Button>
                </div>
                <NarrativeDisplay
                  narratives={narratives}
                  profile={profile}
                  onSelectNarrative={handleNarrativeSelect}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep('profile')}
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-white"
                >
                  Edit Profile
                </Button>
                <Button
                  onClick={handleProceedToSchoolFit}
                  disabled={!selectedNarrative}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze School Fit →
                </Button>
              </div>
            </div>
          )}

          {/* School Fit Step */}
          {currentStep === 'schoolFit' && profile && selectedNarrative && narrativeCompleted && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">School Fit Analysis</h2>
                  <Button
                    onClick={() => setCurrentStep('profile')}
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-white gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>
                <SchoolFitAnalysis narrative={selectedNarrative} profile={profile} onComplete={() => setSchoolFitCompleted(true)} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep('narratives')}
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-white"
                >
                  Back to Narratives
                </Button>
                <Button
                  onClick={handleProceedToActionPlan}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                >
                  Create Action Plan →
                </Button>
              </div>
            </div>
          )}

          {/* Action Plan Step */}
          {currentStep === 'actionPlan' && profile && selectedNarrative && schoolFitCompleted && (
            <div className="rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.08)] p-6">
              <ActionDashboard narrative={selectedNarrative} profile={profile} onProfileUpdate={handleProfileUpdate} onComplete={() => setActionPlanCompleted(true)} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
