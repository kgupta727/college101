'use client'

import { useEffect, useMemo, useState } from 'react'
import { StudentProfile, School } from '@/types'
import { X } from 'lucide-react'

interface SchoolsStepProps {
  profile: StudentProfile
  updateProfile: (updates: Partial<StudentProfile>) => void
}

type CollegeApiItem = {
  id: string
  name: string
  admission_rate: number | null
  sat_low: number | null
  sat_high: number | null
  act_low: number | null
  act_high: number | null
  major_offerings_count: number | null
}

const normalizeAdmissionRate = (value: number | null | undefined): number => {
  if (!Number.isFinite(value as number)) return 0
  const numeric = value as number
  if (numeric <= 0) return 0
  return numeric <= 1 ? numeric * 100 : numeric
}

// Recommended famous colleges to show by default
const RECOMMENDED_COLLEGES = [
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology',
  'Yale University',
  'Princeton University',
  'Columbia University in the City of New York',
  'University of Chicago',
  'University of Pennsylvania',
  'California Institute of Technology',
  'Duke University',
  'Northwestern University',
  'Dartmouth College',
  'Brown University',
  'Cornell University',
  'University of California-Berkeley',
  'University of California-Los Angeles',
  'University of Michigan-Ann Arbor',
  'New York University',
  'University of Southern California',
  'Carnegie Mellon University',
]

export default function SchoolsStep({ profile, updateProfile }: SchoolsStepProps) {
  const [searchInput, setSearchInput] = useState('')
  const [allSchools, setAllSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddCollege, setShowAddCollege] = useState(false)
  const [collegeNameInput, setCollegeNameInput] = useState('')
  const [collegeWebsiteInput, setCollegeWebsiteInput] = useState('')
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  const addSchool = (school: School) => {
    if (!profile.targetSchools.find((s) => s.id === school.id)) {
      const tier = categorizeTier(
        school.satRange[0],
        school.satRange[1],
        profile.academicProfile.gpa,
        school.admissionRate,
        profile.academicProfile.testScores.sat
      )

      updateProfile({
        targetSchools: [...profile.targetSchools, { ...school, tier }],
      })
    }
  }

  const removeSchool = (id: string) => {
    updateProfile({
      targetSchools: profile.targetSchools.filter((s) => s.id !== id),
    })
  }

  const categorizeTier = (satLow: number, satHigh: number, gpa: number, admissionRate: number, sat?: number): 'Reach' | 'Target' | 'Safety' | 'N/A' => {
    const studentSAT = sat || 0
    const safeAdmissionRate = Number.isFinite(admissionRate) ? admissionRate : 0
    const safeSatLow = Number.isFinite(satLow) ? satLow : 0
    const safeSatHigh = Number.isFinite(satHigh) ? satHigh : 0
    
    // Unknown admission rate - cannot categorize
    if (!safeAdmissionRate || safeAdmissionRate === 0) return 'N/A'
    
    // Colleges with >70% admission rate are automatic Safety
    if (safeAdmissionRate > 70) return 'Safety'
    
    // Schools with admission rate < 10% are ALWAYS Reach, regardless of scores
    if (safeAdmissionRate < 10) return 'Reach'
    
    // If student SAT is below school's low range, it's a Reach
    if (studentSAT > 0 && safeSatLow > 0 && studentSAT < safeSatLow - 50) return 'Reach'
    
    // If student SAT is above school's high range, it's a Safety
    if (studentSAT > 0 && safeSatHigh > 0 && studentSAT > safeSatHigh + 50) return 'Safety'
    
    // If student SAT is within or near school's range, it's a Target
    if (studentSAT > 0 && safeSatLow > 0 && safeSatHigh > 0 && studentSAT >= safeSatLow - 50 && studentSAT <= safeSatHigh + 50) return 'Target'
    
    // If no SAT score, use GPA
    if (gpa < 3.5) return 'Reach'
    if (gpa >= 3.8) return 'Target'
    return 'Target'
  }

  useEffect(() => {
    let isMounted = true
    
    // Only fetch when there's a search query
    if (searchInput.trim().length === 0) {
      setAllSchools([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setLoadError(null)

    // Debounce search to avoid chattiness while typing
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        params.set('q', searchInput.trim())
        params.set('limit', '100')

        const response = await fetch(`/api/colleges?${params.toString()}`)
        if (!response.ok) throw new Error('Unable to load colleges')

        const payload = await response.json()
        const mapped: School[] = (payload.colleges || []).map((college: CollegeApiItem) => ({
          id: college.id,
          name: college.name,
          tier: 'Target',
          satRange: [college.sat_low || 0, college.sat_high || 0],
          actRange: [college.act_low || 0, college.act_high || 0],
          admissionRate: normalizeAdmissionRate(college.admission_rate),
          majorOfferingsCount: college.major_offerings_count || 0,
        }))

        if (isMounted) {
          setAllSchools(mapped)
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError('Unable to load colleges right now.')
          setLoading(false)
        }
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(handle)
    }
  }, [searchInput])

  // Fetch recommended colleges on mount
  useEffect(() => {
    async function fetchRecommended() {
      try {
        const fetchedColleges: School[] = []
        
        // Fetch each recommended college with exact name matching
        for (const collegeName of RECOMMENDED_COLLEGES.slice(0, 15)) {
          const params = new URLSearchParams()
          params.set('q', collegeName)
          params.set('limit', '20')  // Get more results to find exact match
          
          const response = await fetch(`/api/colleges?${params.toString()}`)
          if (!response.ok) continue
          
          const payload = await response.json()
          if (payload.colleges && payload.colleges.length > 0) {
            // Find exact match (case-insensitive)
            const exactMatch = payload.colleges.find((c: CollegeApiItem) => 
              c.name.toLowerCase() === collegeName.toLowerCase()
            )
            
            if (exactMatch) {
              fetchedColleges.push({
                id: exactMatch.id,
                name: exactMatch.name,
                tier: 'Target',
                satRange: [exactMatch.sat_low || 0, exactMatch.sat_high || 0],
                actRange: [exactMatch.act_low || 0, exactMatch.act_high || 0],
                admissionRate: normalizeAdmissionRate(exactMatch.admission_rate),
                majorOfferingsCount: exactMatch.major_offerings_count || 0,
              })
            }
          }
        }
        
        setAllSchools(fetchedColleges)
      } catch (error) {
        // Silently fail for recommended colleges
      }
    }
    
    fetchRecommended()
  }, [])

  const visibleSchools = useMemo(() => {
    return allSchools
  }, [allSchools])

  const submitCollegeRequest = async () => {
    setSubmitStatus(null)
    if (!collegeNameInput.trim()) {
      setSubmitStatus('Please enter a college name.')
      return
    }

    try {
      const response = await fetch('/api/colleges/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeName: collegeNameInput.trim(),
          website: collegeWebsiteInput.trim() || null,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || 'Failed to submit college')
      }

      setSubmitStatus('Thanks! We will add this college soon.')
      setCollegeNameInput('')
      setCollegeWebsiteInput('')
      setShowAddCollege(false)
    } catch (error: any) {
      setSubmitStatus(error.message || 'Failed to submit college')
    }
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
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Can’t find your college? Submit it so we can add it to the list.
        </p>
        <button
          type="button"
          onClick={() => setShowAddCollege((prev) => !prev)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showAddCollege ? 'Cancel' : 'Add college'}
        </button>
      </div>

      {showAddCollege && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">College name</label>
            <input
              type="text"
              value={collegeNameInput}
              onChange={(event) => setCollegeNameInput(event.target.value)}
              className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Example: Rice University"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Website (optional)</label>
            <input
              type="text"
              value={collegeWebsiteInput}
              onChange={(event) => setCollegeWebsiteInput(event.target.value)}
              className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="https://admissions.example.edu"
            />
          </div>
          <button
            type="button"
            onClick={submitCollegeRequest}
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            Submit college
          </button>
          {submitStatus && <p className="text-sm text-blue-800">{submitStatus}</p>}
        </div>
      )}

      {loadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-600 text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {searchInput.trim().length === 0 && visibleSchools.length > 0 && (
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommended Colleges</h3>
          </div>
        )}
        
        {loading && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-500">
            Loading colleges...
          </div>
        )}

        {!loading && searchInput.trim().length > 0 && visibleSchools.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-500">
            No colleges found. Try a different search term.
          </div>
        )}

        {visibleSchools.map((school) => {
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
                    <span>
                      SAT: {school.satRange[0] > 0 ? `${school.satRange[0]}-${school.satRange[1]}` : 'N/A'}
                    </span>
                    <span>
                      Admit Rate: {school.admissionRate > 0 ? `${school.admissionRate.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      estimatedTier === 'Reach'
                        ? 'bg-red-500/20 text-red-300'
                        : estimatedTier === 'Target'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : estimatedTier === 'Safety'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-400'
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
            {profile.targetSchools.filter((s) => s.tier === 'Target').length} Target,{' '}
            {profile.targetSchools.filter((s) => s.tier === 'Safety').length} Safety
            {profile.targetSchools.filter((s) => s.tier === 'N/A').length > 0 && (
              <>, and {profile.targetSchools.filter((s) => s.tier === 'N/A').length} N/A</>
            )} schools. A balanced list usually has 2-3 Reach, Target, and Safety schools each.
          </p>
        </div>
      )}
    </div>
  )
}
