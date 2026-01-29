'use client'

import { StudentProfile } from '@/types'
import { Button } from '../ui/button'

interface AcademicStepProps {
  profile: StudentProfile
  updateProfile: (updates: Partial<StudentProfile>) => void
}

export default function AcademicStep({ profile, updateProfile }: AcademicStepProps) {
  const updateAcademic = (field: string, value: any) => {
    updateProfile({
      academicProfile: {
        ...profile.academicProfile,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Academic Profile</h2>
        <p className="text-gray-700">Help us understand your academic achievements.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-black font-medium mb-2">Unweighted GPA *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={profile.academicProfile.gpa}
            onChange={(e) => updateAcademic('gpa', parseFloat(e.target.value))}
            placeholder="3.85"
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-black font-medium mb-2">SAT Score (optional)</label>
          <input
            type="number"
            min="0"
            max="1600"
            value={profile.academicProfile.testScores.sat || ''}
            onChange={(e) =>
              updateAcademic('testScores', {
                ...profile.academicProfile.testScores,
                sat: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="1450"
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-black font-medium mb-2">ACT Score (optional)</label>
          <input
            type="number"
            min="0"
            max="36"
            value={profile.academicProfile.testScores.act || ''}
            onChange={(e) =>
              updateAcademic('testScores', {
                ...profile.academicProfile.testScores,
                act: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="33"
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-black font-medium mb-2">Number of AP Classes</label>
          <input
            type="number"
            min="0"
            value={profile.academicProfile.apCount}
            onChange={(e) => updateAcademic('apCount', parseInt(e.target.value))}
            placeholder="5"
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-black font-medium mb-2">Number of IB Classes</label>
          <input
            type="number"
            min="0"
            value={profile.academicProfile.ibCount}
            onChange={(e) => updateAcademic('ibCount', parseInt(e.target.value))}
            placeholder="0"
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-black font-medium mb-2">Intended Major(s) *</label>
        <p className="text-gray-600 text-sm mb-3">Add majors one at a time</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            id="majorInput"
            placeholder="e.g., Computer Science"
            className="flex-1 bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <Button
            onClick={() => {
              const input = document.getElementById('majorInput') as HTMLInputElement
              if (input.value.trim()) {
                updateAcademic('intendedMajors', [
                  ...profile.academicProfile.intendedMajors,
                  input.value.trim(),
                ])
                input.value = ''
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </Button>
        </div>

        {profile.academicProfile.intendedMajors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.academicProfile.intendedMajors.map((major, idx) => (
              <div key={idx} className="px-3 py-1 bg-blue-100 text-blue-900 text-sm rounded-full flex items-center gap-2 border border-blue-300">
                {major}
                <button
                  onClick={() =>
                    updateAcademic(
                      'intendedMajors',
                      profile.academicProfile.intendedMajors.filter((_, i) => i !== idx)
                    )
                  }
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-black font-medium mb-2">Academic Interests (optional)</label>
        <textarea
          value={profile.academicProfile.academicInterests}
          onChange={(e) => updateAcademic('academicInterests', e.target.value)}
          placeholder="What subjects fascinate you? What problems do you want to solve?"
          rows={3}
          className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  )
}
