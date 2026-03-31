//type script defs

export interface Need {
  id: string
  title: string
  description: string
  urgency: 'normal' | 'urgent'
  status: 'open' | 'partially_fulfilled' | 'fulfilled' | 'closed'
  created_at: string
  category: {
    id: string
    name: string
  }
  org: {
    id: string
    full_name: string
    prof_pic: string
    latitude: number | null
    longitude: number | null
    address: string | null
  }
}