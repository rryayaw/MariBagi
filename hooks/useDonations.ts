import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Donation } from '@/types'

export const useDonations = (categoryId?: string) => {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDonations()
  }, [categoryId])

  const fetchDonations = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('donations')
        .select(`
          id,
          title,
          description,
          photo_url,
          pickup_method,
          status,
          created_at,
          category:categories (id, name),
          donor:donors (id, full_name, prof_pic, address)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query

      if (error) throw error
      setDonations(data as unknown as Donation[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { donations, loading, error, refetch: fetchDonations }
}
