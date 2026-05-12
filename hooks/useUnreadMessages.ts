import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export function useUnreadMessages() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refetch = async (userId: string) => {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`donor_id.eq.${userId},org_id.eq.${userId}`)

    const ids = (convs ?? []).map(c => c.id)
    if (ids.length === 0) { setCount(0); return }

    const { count: c } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .neq('sender_id', userId)
      .eq('is_read', false)
      .eq('is_deleted', false)
    setCount(c ?? 0)
  }

  useEffect(() => {
    if (!user) return
    refetch(user.id)

    const channel = supabase
      .channel(`unread-msgs:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => refetch(user.id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => refetch(user.id))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return count
}
