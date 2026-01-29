'use client'

import { useState } from 'react'
import { StudentProfile, Activity, AcademicProfile, School } from '@/types'
import ActivitiesStep from './steps/ActivitiesStep'
import AcademicStep from './steps/AcademicStep'
import SchoolsStep from './steps/SchoolsStep'
import ConstraintsStep from './steps/ConstraintsStep'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SCHOOLS_DATABASE: School[] = [
  { id: '1', name: 'Stanford University', tier: 'Reach', satRange: [1470, 1570], actRange: [33, 35], admissionRate: 3.4, majorOfferingsCount: 275 },
  { id: '2', name: 'Harvard University', tier: 'Reach', satRange: [1480, 1570], actRange: [33, 35], admissionRate: 3.2, majorOfferingsCount: 86 },
  { id: '3', name: 'MIT', tier: 'Reach', satRange: [1500, 1570], actRange: [34, 35], admissionRate: 2.7, majorOfferingsCount: 30 },
  { id: '4', name: 'University of Pennsylvania', tier: 'Reach', satRange: [1450, 1560], actRange: [33, 35], admissionRate: 3.2, majorOfferingsCount: 280 },
  { id: '5', name: 'Northwestern University', tier: 'Reach', satRange: [1440, 1550], actRange: [32, 35], admissionRate: 5.6, majorOfferingsCount: 220 },
  { id: '6', name: 'UC Berkeley', tier: 'Target', satRange: [1320, 1540], actRange: [29, 35], admissionRate: 8.7, majorOfferingsCount: 350 },
  { id: '7', name: 'Michigan State University', tier: 'Target', satRange: [1140, 1340], actRange: [24, 31], admissionRate: 64.2, majorOfferingsCount: 200 },
  { id: '8', name: 'State University of New York', tier: 'Safety', satRange: [1000, 1200], actRange: [20, 27], admissionRate: 41.2, majorOfferingsCount: 250 },
]

type Step = 'activities' | 'academic' | 'schools' | 'constraints' | 'review'

interface ProfileFormProps {
  onComplete: (profile: StudentProfile) => void
  initialProfile?: StudentProfile | null
  onStepComplete?: (profile: StudentProfile) => Promise<void>
}

export default function ProfileForm({ onComplete, initialProfile, onStepComplete }: ProfileFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('activities')
  const [profile, setProfile] = useState<StudentProfile>(initialProfile || {
    id: Date.now().toString(),
    name: '',
    activities: [],
    academicProfile: {
      gpa: 0,
      testScores: {},
      apCount: 0,
      ibCount: 0,
      intendedMajors: [],
      academicInterests: '',
    },
    targetSchools: [],
    constraints: {
      monthsUntilDeadline: 8,
      budgetForNewActivities: false,
      geographicConstraints: [],
    },
    schoolFits: [],
  })
  const [saving, setSaving] = useState(false)

  const steps: Step[] = ['activities', 'academic', 'schools', 'constraints', 'review']
  const currentStepIndex = steps.indexOf(currentStep)

  const handleNext = async () => {
    // Auto-save on each Next click
    if (onStepComplete) {
      setSaving(true)
      try {
        await onStepComplete(profile)
      } catch (error) {
        console.error('Failed to save profile:', error)
      } finally {
        setSaving(false)
      }
    }
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1])
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1])
    }
  }

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'activities':
        return profile.activities.length > 0
      case 'academic':
        return profile.academicProfile.gpa > 0 && profile.academicProfile.intendedMajors.length > 0
      case 'schools':
        return profile.targetSchools.length > 0
      case 'constraints':
        return true
      case 'review':
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full mx-1 animate-smooth ${
                  idx <= currentStepIndex ? 'bg-gradient-to-r from-slate-900 to-slate-700 shadow-sm' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-slate-800 text-sm font-medium">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        {/* Form Content */}
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-8 mb-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] animate-slide-up">
          {currentStep === 'activities' && (
            <ActivitiesStep profile={profile} updateProfile={updateProfile} />
          )}
          {currentStep === 'academic' && (
            <AcademicStep profile={profile} updateProfile={updateProfile} />
          )}
          {currentStep === 'schools' && (
            <SchoolsStep profile={profile} updateProfile={updateProfile} allSchools={SCHOOLS_DATABASE} />
          )}
          {currentStep === 'constraints' && (
            <ConstraintsStep profile={profile} updateProfile={updateProfile} />
          )}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold text-forest-700">Review Your Profile</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-sand-50 border border-sand-100 p-4 rounded-lg">
                  <p className="text-forest-500 font-medium">Activities</p>
                  <p className="text-forest-700 font-bold text-lg">{profile.activities.length} activities</p>
                </div>
                <div className="bg-sand-50 border border-sand-100 p-4 rounded-lg">
                  <p className="text-forest-500 font-medium">GPA</p>
                  <p className="text-forest-700 font-bold text-lg">{profile.academicProfile.gpa.toFixed(2)}</p>
                </div>
                <div className="bg-sand-50 border border-sand-100 p-4 rounded-lg">
                  <p className="text-forest-500 font-medium">Target Schools</p>
                  <p className="text-forest-700 font-bold text-lg">{profile.targetSchools.length} schools</p>
                </div>
                <div className="bg-sand-50 border border-sand-100 p-4 rounded-lg">
                  <p className="text-forest-500 font-medium">Months to Deadline</p>
                  <p className="text-forest-700 font-bold text-lg">{profile.constraints.monthsUntilDeadline}</p>
                </div>
              </div>
              <p className="text-forest-600 text-center leading-relaxed">Ready to generate your narratives? Click "Generate Narratives" below.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-white animate-smooth disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === 'review' ? (
            <Button 
              onClick={() => onComplete(profile)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg animate-smooth"
            >
              Generate Narratives
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg animate-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
