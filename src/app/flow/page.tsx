'use client'

import { useState, useEffect } from 'react'
import { StudentProfile, Narrative } from '@/types'
import ProfileForm from '@/components/ProfileForm'
import NarrativeDisplay from '@/components/NarrativeDisplay'
import SchoolFitAnalysis from '@/components/SchoolFitAnalysis'
import ActionDashboard from '@/components/ActionDashboard'
import { generateNarrativesAction } from '@/actions/generateNarratives'
import { loadProfileAction, saveProfileAction } from '@/actions/profileActions'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'

type FlowStep = 'profile' | 'narratives' | 'schoolFit' | 'actionPlan'

export default function FlowPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('profile')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Load existing profile on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const existingProfile = await loadProfileAction()
        if (existingProfile) {
          setProfile(existingProfile)
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setInitialLoad(false)
      }
    }
    loadExistingProfile()
  }, [])

  const handleProfileComplete = async (completeProfile: StudentProfile) => {
    setProfile(completeProfile)
    setLoading(true)

    try {
      // Save profile to database
      await saveProfileAction(completeProfile)
      
      const generatedNarratives = await generateNarrativesAction(completeProfile)
      setNarratives(generatedNarratives)
      setCurrentStep('narratives')
    } catch (error) {
      console.error('Failed to generate narratives:', error)
      alert('Failed to generate narratives. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNarrativeSelect = (narrative: Narrative) => {
    setSelectedNarrative(narrative)
  }

  const handleProfileStepComplete = async (updatedProfile: StudentProfile) => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-sand-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-forest-600 hover:text-forest-700 hover:bg-sand-50 animate-smooth">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-forest-500 to-forest-300 bg-clip-text text-transparent">
              college101
            </h1>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        {currentStep !== 'profile' && (
          <div className="mb-8 animate-slide-in">
            <div className="flex items-center gap-2 text-sm text-forest-400 font-medium">
              <span className="line-through">Profile</span>
              <span>→</span>
              <span
                className={currentStep === 'narratives' ? 'text-coral-300 font-semibold' : 'line-through'}
              >
                Narratives
              </span>
              <span>→</span>
              <span
                className={currentStep === 'schoolFit' ? 'text-coral-300 font-semibold' : ''}
              >
                School Fit
              </span>
              <span>→</span>
              <span
                className={currentStep === 'actionPlan' ? 'text-coral-300 font-semibold' : ''}
              >
                Action Plan
              </span>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'profile' && (
          <div>
            {initialLoad ? (
              <div className="text-center py-12">
                <p className="text-forest-600">Loading your profile...</p>
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

        {currentStep === 'narratives' && profile && (
          <div>
            <NarrativeDisplay
              narratives={narratives}
              profile={profile}
              onSelectNarrative={handleNarrativeSelect}
            />

            {/* Action Button */}
            <div className="mt-8 flex gap-4 animate-slide-up">
              <Button
                onClick={() => setCurrentStep('profile')}
                variant="outline"
                className="border-forest-300 text-forest-600 hover:bg-forest-50 animate-smooth"
              >
                Back to Profile
              </Button>
              <Button
                onClick={handleProceedToSchoolFit}
                disabled={!selectedNarrative}
                className="flex-1 bg-gradient-to-r from-coral-300 to-coral-200 hover:from-coral-400 hover:to-coral-300 text-white shadow-lg animate-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze School Fit →
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'schoolFit' && profile && selectedNarrative && (
          <div>
            <SchoolFitAnalysis narrative={selectedNarrative} profile={profile} />

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 animate-slide-up">
              <Button
                onClick={() => setCurrentStep('narratives')}
                variant="outline"
                className="border-forest-300 text-forest-600 hover:bg-forest-50 animate-smooth"
              >
                Back to Narratives
              </Button>
              <Button
                onClick={handleProceedToActionPlan}
                className="flex-1 bg-gradient-to-r from-forest-300 to-forest-400 hover:from-forest-400 hover:to-forest-500 text-white shadow-lg animate-smooth"
              >
                Create Action Plan →
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'actionPlan' && profile && selectedNarrative && (
          <div>
            <ActionDashboard narrative={selectedNarrative} profile={profile} />
          </div>
        )}
      </main>
    </div>
  )
}
