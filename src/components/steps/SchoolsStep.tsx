'use client'

import { useState } from 'react'
import { StudentProfile, School } from '@/types'
import { X } from 'lucide-react'

interface SchoolsStepProps {
  profile: StudentProfile
  updateProfile: (updates: Partial<StudentProfile>) => void
  allSchools: School[]
}

export default function SchoolsStep({ profile, updateProfile, allSchools }: SchoolsStepProps) {
  const [searchInput, setSearchInput] = useState('')

  const addSchool = (school: School) => {
    if (!profile.targetSchools.find((s) => s.id === school.id)) {
      updateProfile({
        targetSchools: [...profile.targetSchools, school],
      })
    }
  }

  const removeSchool = (id: string) => {
    updateProfile({
      targetSchools: profile.targetSchools.filter((s) => s.id !== id),
    })
  }

  const categorizeTier = (satLow: number, satHigh: number, gpa: number, admissionRate: number, sat?: number): 'Reach' | 'Target' | 'Safety' => {
    const studentSAT = sat || 0
    
    // Schools with admission rate < 10% are ALWAYS Reach, regardless of scores
    if (admissionRate < 10) return 'Reach'
    
    // If student SAT is below school's low range, it's a Reach
    if (studentSAT > 0 && studentSAT < satLow - 50) return 'Reach'
    
    // If student SAT is above school's high range, it's a Safety
    if (studentSAT > 0 && studentSAT > satHigh + 50) return 'Safety'
    
    // If student SAT is within or near school's range, it's a Target
    if (studentSAT > 0 && studentSAT >= satLow - 50 && studentSAT <= satHigh + 50) return 'Target'
    
    // If no SAT score, use GPA
    if (gpa < 3.5) return 'Reach'
    if (gpa >= 3.8) return 'Target'
    return 'Target'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Target Schools</h2>
        <p className="text-gray-700">Select 5-10 colleges. We'll automatically categorize your fit level.</p>
      </div>

      <div>
        <label className="block text-black font-medium mb-2">Search Schools</label>
        <input
          type="text"
          placeholder="Search for schools..."
          className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {allSchools.map((school) => {
          const isSelected = profile.targetSchools.some((s) => s.id === school.id)
          const estimatedTier = categorizeTier(
            school.satRange[0],
            school.satRange[1],
            profile.academicProfile.gpa,
            school.admissionRate,
            profile.academicProfile.testScores.sat
          )

          return (
            <div
              key={school.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => addSchool(school)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-black font-semibold">{school.name}</h3>
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    <span>SAT: {school.satRange[0]}-{school.satRange[1]}</span>
                    <span>Admit Rate: {school.admissionRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      estimatedTier === 'Reach'
                        ? 'bg-red-500/20 text-red-300'
                        : estimatedTier === 'Target'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {estimatedTier}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {profile.targetSchools.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">
            Selected Schools ({profile.targetSchools.length})
          </h3>
          <div className="space-y-2">
            {profile.targetSchools.map((school) => (
              <div key={school.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-black font-medium">{school.name}</span>
                <button
                  onClick={() => removeSchool(school.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.targetSchools.length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            💡 You have {profile.targetSchools.filter((s) => s.tier === 'Reach').length} Reach,{' '}
            {profile.targetSchools.filter((s) => s.tier === 'Target').length} Target, and{' '}
            {profile.targetSchools.filter((s) => s.tier === 'Safety').length} Safety schools. A balanced list
            usually has 2-3 of each.
          </p>
        </div>
      )}
    </div>
  )
}
