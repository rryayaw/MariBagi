import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType{
    session: Session | null
    user: User | null
    role: 'donor' | 'organization' | null
    isOnboarded: boolean
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  isOnboarded: false,
  loading: true
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'donor' | 'organization' | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [loading, setLoading] = useState(true)

  //Get initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: {session}}) => {
        setSession(session)
        setUser(session?.user ?? null)
        if(session?.user) fetchProfile(session.user.id)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setRole(null)
        setIsOnboarded(false)
        setLoading (false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile) {
        setRole(profile.role)

        // Check if onboarding is complete
        const { data: onboarded } = await supabase.rpc('is_onboarded')
        setIsOnboarded(onboarded ?? false)
      }
    } finally {
      setLoading(false)
    }
  }

    return (
        <AuthContext.Provider value={{ session, user, role, isOnboarded, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

//Hook for child components to get the auth object and re-render when it changes.
export const useAuth = () => useContext(AuthContext)