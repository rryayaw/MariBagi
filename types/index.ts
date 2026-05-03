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

export interface Request {
  id: string
  donation_id: string
  need_id: string
  donor_id: string
  org_id: string
  initiated: 'org' | 'donor'
  status: 'available' | 'reserved' | 'completed' | 'cancelled'
  offer_title: string | null
  offer_description: string | null
  created_at: string
  donation: { id: string; title: string; photo_url: string | null; category: { name: string } }
  need: { id: string; title: string; category: { name: string } }
  donor: { id: string; full_name: string; prof_pic: string }
  org: { id: string; full_name: string; prof_pic: string }
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