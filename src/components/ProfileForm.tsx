'use client'

import { useState } from 'react'
import { StudentProfile } from '@/types'
import ActivitiesStep from './steps/ActivitiesStep'
import AcademicStep from './steps/AcademicStep'
import SchoolsStep from './steps/SchoolsStep'
import ConstraintsStep from './steps/ConstraintsStep'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

type Step = 'activities' | 'academic' | 'schools' | 'constraints' | 'review'

interface ProfileFormProps {
  onComplete: (profile: StudentProfile, additionalContext?: string) => void
  initialProfile?: StudentProfile | null
  onStepComplete?: (profile: StudentProfile) => Promise<void>
  loading?: boolean
}

export default function ProfileForm({ onComplete, initialProfile, onStepComplete, loading = false }: ProfileFormProps) {
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
  const [additionalContext, setAdditionalContext] = useState('')

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
            <SchoolsStep profile={profile} updateProfile={updateProfile} />
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
              <p className="text-forest-600 text-center leading-relaxed">Ready to generate your narratives? Add any extra context below, or click generate.</p>
              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Anything specific you want your narratives to highlight? <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. I want to emphasize my work with underfunded schools, or I’d like one narrative about my identity as a first-gen student..."
                  className="w-full p-3 text-sm text-slate-800 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  rows={3}
                />
              </div>
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
              onClick={() => onComplete(profile, additionalContext.trim() || undefined)}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg animate-smooth flex items-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Narratives'}
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
