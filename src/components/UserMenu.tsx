'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export default function UserMenu() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || null)
      setLoading(false)
    }
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading || !email) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-forest-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-forest-300 to-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {email[0].toUpperCase()}
        </div>
        <span className="text-forest-700 text-sm font-medium hidden sm:block">
          {email.split('@')[0]}
        </span>
      </button>

      {menuOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-sand-100 py-2 z-20">
            <div className="px-4 py-3 border-b border-sand-100">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-forest-700 truncate">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-coral-500 hover:bg-coral-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
