// components/AuthGuard.tsx

import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isOnboarded, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return //if auth state loading, dont do anything
    
    // Check if the current route is within the "(auth)" group (/login, /register) or the onboarding page, to prevent redirect loop
    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'
    const inIndex = segments[0] === 'index' // root page

    // Not logged in -> go to login
    if (!user && !inAuth) {
      // Not logged in and not already in auth group → go to role select
      router.replace('/(auth)')

    } else if (user && !isOnboarded && !inOnboarding) {
      // Logged in but not onboarded → go to onboarding
      router.replace('/onboarding')
      
    } else if (user && isOnboarded && (inAuth || inOnboarding || inIndex)) {
      // Fully set up but still on auth/onboarding → go to home
      router.replace('/(tabs)/home')
    }
  }, [user, isOnboarded, loading, segments])

  return <>{children}</>
}