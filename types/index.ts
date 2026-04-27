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

export interface Donation {
  id: string
  title: string
  description: string
  photo_url: string | null
  pickup_method: 'pickup' | 'dropoff'
  status: 'available' | 'reserved' | 'completed'
  created_at: string
  category: {
    id: string
    name: string
  }
  donor: {
    id: string
    full_name: string
    prof_pic: string
    address: string | null
  }
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

export interface DonationDetail {
  id: string
  donor_id: string
  category_id: string
  title: string
  description: string
  photo_url: string | null
  pickup_method: 'pickup' | 'dropoff'
  status: 'available' | 'reserved' | 'completed'
  created_at: string
  donor: {
    full_name: string
    prof_pic: string
    address: string | null
    latitude: number
    longitude: number
    avg_rating: number
  }
  category: {
    name: string
  }
}

export interface NeedDetail {
  id: string
  org_id: string
  category_id: string
  title: string
  description: string
  photo_url: string | null
  urgency: 'normal' | 'urgent'
  status: 'open' | 'partially_fulfilled' | 'fulfilled' | 'closed'
  created_at: string
  org: {
    full_name: string
    prof_pic: string
    address: string | null
    latitude: number
    longitude: number
    avg_rating: number
  }
  category: {
    name: string
  }
}