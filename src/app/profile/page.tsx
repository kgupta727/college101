'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-sand-50 flex items-center justify-center">
      <div className="text-center space-y-6 animate-scale-in">
        <h1 className="text-4xl font-display font-bold text-forest-700">Build Your Profile</h1>
        <p className="text-forest-500 max-w-md mx-auto leading-relaxed">
          Start your college admissions narrative journey by creating your student profile.
        </p>
        <Link href="/flow">
          <Button size="lg" className="bg-gradient-to-r from-coral-300 to-coral-200 hover:from-coral-400 hover:to-coral-300 text-white shadow-lg animate-smooth">
            Start Profile Creation →
          </Button>
        </Link>
      </div>
    </div>
  )
}
