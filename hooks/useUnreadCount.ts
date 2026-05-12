import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export function useUnreadCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refetch = async (userId: string) => {
    const { count: c } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setCount(c ?? 0)
  }

  useEffect(() => {
    if (!user) return
    refetch(user.id)

    const channel = supabase
      .channel(`notif-count:${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setCount(prev => prev + 1)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => refetch(user.id)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return count
}
