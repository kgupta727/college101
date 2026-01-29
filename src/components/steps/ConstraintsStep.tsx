'use client'

import { StudentProfile } from '@/types'

interface ConstraintsStepProps {
  profile: StudentProfile
  updateProfile: (updates: Partial<StudentProfile>) => void
}

export default function ConstraintsStep({ profile, updateProfile }: ConstraintsStepProps) {
  const updateConstraints = (field: string, value: any) => {
    updateProfile({
      constraints: {
        ...profile.constraints,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Timeline & Constraints</h2>
        <p className="text-gray-700">Help us personalize your action plan.</p>
      </div>

      <div>
        <label className="block text-black font-medium mb-2">Months Until Application Deadline</label>
        <div className="flex gap-4 items-center">
          <input
            type="range"
            min="1"
            max="12"
            value={profile.constraints.monthsUntilDeadline}
            onChange={(e) => updateConstraints('monthsUntilDeadline', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-blue-600 w-16">
            {profile.constraints.monthsUntilDeadline}
          </span>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          {profile.constraints.monthsUntilDeadline} month{profile.constraints.monthsUntilDeadline !== 1 ? 's' : ''}{' '}
          gives us {profile.constraints.monthsUntilDeadline > 6 ? 'plenty of' : 'limited'} time for strategic planning.
        </p>
      </div>

      <div>
        <label className="block text-black font-medium mb-3">Can you take on new activities?</label>
        <div className="space-y-2">
          {[
            { value: true, label: '✓ Yes, I have budget to start new projects' },
            { value: false, label: '✗ No, focused on deepening existing activities' },
          ].map((option) => (
            <label
              key={String(option.value)}
              className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                profile.constraints.budgetForNewActivities === option.value
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <input
                type="radio"
                name="budget"
                checked={profile.constraints.budgetForNewActivities === option.value}
                onChange={() => updateConstraints('budgetForNewActivities', option.value)}
                className="mr-3"
              />
              <span className="text-black">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-black font-medium mb-2">Geographic Constraints (optional)</label>
        <p className="text-gray-600 text-sm mb-3">
          Any regions you're interested in? Help us suggest regional activities.
        </p>
        <input
          type="text"
          placeholder="e.g., East Coast, West Coast, Midwest"
          className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          <strong>💡 Timeline Tip:</strong> You have{' '}
          {Math.floor((profile.constraints.monthsUntilDeadline * 30) / 3)} days to take on meaningful new activities
          and show consistent engagement. Start small, think big.
        </p>
      </div>
    </div>
  )
}
