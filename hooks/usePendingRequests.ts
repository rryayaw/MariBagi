import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export function usePendingRequests() {
  const { user, role } = useAuth()
  const [count, setCount] = useState(0)
  const isOrg = role === 'organization'

  const refetch = async (userId: string) => {
    const col = isOrg ? 'org_id' : 'donor_id'
    const initiatedBy = isOrg ? 'donor' : 'org'

    // Incoming requests waiting for accept/reject
    const { count: incoming } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq(col, userId)
      .eq('status', 'available')
      .eq('initiated', initiatedBy)

    // Reserved requests where this user needs to take the next action:
    // donor → needs to mark as shipped; org → needs to mark as received
    const { count: actionable } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq(col, userId)
      .eq('status', 'reserved')

    setCount((incoming ?? 0) + (actionable ?? 0))
  }

  useEffect(() => {
    if (!user) return
    refetch(user.id)

    const col = isOrg ? 'org_id' : 'donor_id'
    const channel = supabase
      .channel(`pending-req:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests', filter: `${col}=eq.${user.id}` },
        () => refetch(user.id)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        () => refetch(user.id)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, isOrg])

  return count
}
