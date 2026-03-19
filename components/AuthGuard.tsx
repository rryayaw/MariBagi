// components/AuthGuard.tsx

import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { useAuth } from '../context/AuthContext'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isOnboarded, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    
    // Check if the current route is within the "(auth)" group (/login, /register) or the onboarding page, to prevent redirect loop
    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    // Not logged in -> go to login
    if (!user) {
      router.replace('/(auth)/login')
    } 

    // Logged in but data not complete -> go to onboarding
    else if (user && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding')
    }

    // Fully set up but still on login/onboarding -> go to home
    else if (user && isOnboarded && (inAuth || inOnboarding)) {
      router.replace('/(tabs)/home')
    }
  }, [user, isOnboarded, loading, segments])

  return <>{children}</>
}