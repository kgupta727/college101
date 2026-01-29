'use client'

import { useState, useEffect, useCallback } from 'react'
import { StudentProfile, Narrative } from '@/types'
import { generateNarrativesAction } from '@/actions/generateNarratives'
import { loadProfileAction, saveProfileAction, saveNarrativesAction, loadNarrativesAction } from '@/actions/profileActions'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import ProgressIndicator from '@/components/ProgressIndicator'
import ProfileStep from '@/components/steps/ProfileStep'
import NarrativesStep from '@/components/steps/NarrativesStep'
import SchoolFitStep from '@/components/steps/SchoolFitStep'
import ActionPlanStep from '@/components/steps/ActionPlanStep'
import ErrorBoundary from '@/components/ErrorBoundary'
import { FlowStep } from '@/constants/flow'

export default function FlowPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('profile')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null)
  const [completionState, setCompletionState] = useState({
    narrativeCompleted: false,
    schoolFitCompleted: false,
    actionPlanCompleted: false,
  })
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

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
            setSelectedNarrative(savedNarratives[0])

            // Restore last visited page from localStorage
            const lastStep = localStorage.getItem('lastFlowStep') as FlowStep | null
            if (lastStep && ['narratives', 'schoolFit', 'actionPlan'].includes(lastStep)) {
              setCurrentStep(lastStep)
            } else {
              setCurrentStep('narratives')
            }

            // Mark all steps as completed
            setCompletionState({
              narrativeCompleted: true,
              schoolFitCompleted: true,
              actionPlanCompleted: true,
            })
          } else {
            const lastStep = localStorage.getItem('lastFlowStep') as FlowStep | null
            if (lastStep && lastStep !== 'profile') {
              setCurrentStep(lastStep)
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

  // Persist current step to localStorage
  useEffect(() => {
    localStorage.setItem('lastFlowStep', currentStep)
  }, [currentStep])

  // Wrapped handler functions with useCallback for performance optimization
  const handleProfileComplete = useCallback(async (completeProfile: StudentProfile) => {
    setProfile(completeProfile)
    setLoading(true)

    try {
      await saveProfileAction(completeProfile)
      const generatedNarratives = await generateNarrativesAction(completeProfile)
      setNarratives(generatedNarratives)
      await saveNarrativesAction(completeProfile.id, generatedNarratives)
      setCurrentStep('narratives')
    } catch (error) {
      console.error('Failed to generate narratives:', error)
      alert('Failed to generate narratives. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleProfileUpdate = useCallback(async (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile)
    setLoading(true)

    try {
      await saveProfileAction(updatedProfile)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRegenerateNarratives = useCallback(async () => {
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
  }, [profile])

  const handleNarrativeSelect = useCallback((narrative: Narrative) => {
    setCompletionState(prev => ({ ...prev, narrativeCompleted: true }))
    setSelectedNarrative(narrative)
  }, [])

  const handleProfileStepComplete = useCallback(async (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile)
    try {
      await saveProfileAction(updatedProfile)
    } catch (error) {
      console.error('Failed to save profile:', error)
      throw error
    }
  }, [])

  const handleSchoolFitCompleted = useCallback(() => {
    setCompletionState(prev => ({ ...prev, schoolFitCompleted: true }))
  }, [])

  const handleActionPlanCompleted = useCallback(() => {
    setCompletionState(prev => ({ ...prev, actionPlanCompleted: true }))
  }, [])

  const handleNavigateToStep = useCallback((step: FlowStep) => {
    setCurrentStep(step)
  }, [])

  return (
    <ErrorBoundary>
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
        <ProgressIndicator 
          currentStep={currentStep} 
          onStepChange={handleNavigateToStep}
          completionState={completionState}
        />

        {/* Step Content */}
        {currentStep === 'profile' && (
          <ProfileStep
            initialLoad={initialLoad}
            profile={profile}
            onComplete={handleProfileComplete}
            onStepComplete={handleProfileStepComplete}
          />
        )}

        {currentStep === 'narratives' && profile && (
          <NarrativesStep
            profile={profile}
            narratives={narratives}
            selectedNarrative={selectedNarrative}
            loading={loading}
            onSelectNarrative={handleNarrativeSelect}
            onRegenerate={handleRegenerateNarratives}
            onEditProfile={() => handleNavigateToStep('profile')}
            onProceedToSchoolFit={() => {
              if (selectedNarrative) {
                handleNavigateToStep('schoolFit')
              }
            }}
          />
        )}

        {currentStep === 'schoolFit' && profile && selectedNarrative && completionState.narrativeCompleted && (
          <SchoolFitStep
            profile={profile}
            narrative={selectedNarrative}
            onEditProfile={() => handleNavigateToStep('profile')}
            onCompleted={handleSchoolFitCompleted}
            onBack={() => handleNavigateToStep('narratives')}
            onProceedToActionPlan={() => handleNavigateToStep('actionPlan')}
          />
        )}

        {currentStep === 'actionPlan' && profile && selectedNarrative && completionState.schoolFitCompleted && (
          <ActionPlanStep
            profile={profile}
            narrative={selectedNarrative}
            onProfileUpdate={handleProfileUpdate}
            onComplete={handleActionPlanCompleted}
          />
        )}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  )
}
