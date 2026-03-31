// hooks/useCategories.ts

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Category {
  id: string
  name: string
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [])

  return { categories }
}