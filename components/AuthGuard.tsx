// components/AuthGuard.tsx

import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { useAuth } from '@/context/AuthContext'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isOnboarded, loading, isOffline } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'
    const inIndex = segments[0] === 'index'
    const inNoInternet = segments[0] === 'no-internet'

    if (isOffline && !inNoInternet) {
      router.replace('/no-internet')
      return
    }

    if (!isOffline && inNoInternet) return // let no-internet screen handle retry routing

    if (!user && !inAuth) {
      router.replace('/(auth)')
    } else if (user && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding')
    } else if (user && isOnboarded && (inAuth || inOnboarding || inIndex)) {
      router.replace('/(tabs)/home')
    }
  }, [user, isOnboarded, loading, isOffline, segments])

  return <>{children}</>
}