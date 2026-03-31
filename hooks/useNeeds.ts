// hooks/useNeeds.ts

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Need } from '@/types'

export const useNeeds = (categoryId?: string) => {
  const [needs, setNeeds] = useState<Need[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNeeds()
  }, [categoryId])

  const fetchNeeds = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('needs')
        .select(`
          id,
          title,
          description,
          urgency,
          status,
          created_at,
          category:categories (id, name),
          org:orgs (id, full_name, prof_pic, latitude, longitude, address)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query

      if (error) throw error
      setNeeds(data as unknown as Need[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { needs, loading, error, refetch: fetchNeeds }
}