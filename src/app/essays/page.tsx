import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadProfileAction } from '@/actions/profileActions'
import EssayWriting from '@/components/EssayWriting'

export default async function EssaysPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await loadProfileAction()

  if (!profile) {
    redirect('/flow')
  }

  return <EssayWriting profile={profile} />
}
