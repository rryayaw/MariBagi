//type script defs

export interface Profile {
  full_name: string
  prof_pic: string
  address: string | null
  avg_rating: number
  profiles: {
    phone: string | null
    role: string
  }
}

export interface Stats { 
  donations: number 
  orgs: number
  rating: number 
}

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