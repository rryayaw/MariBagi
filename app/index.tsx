// app/index.tsx

import { useEffect, useRef } from 'react'
import { Animated, View, Image, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { Colors } from '@/constants/colors'

export default function Index() {
  const { user, isOnboarded, loading } = useAuth()
  const router = useRouter()

  const fadeIn = useRef(new Animated.Value(0)).current
  const fadeOut = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    if (loading) return

    const timeout = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (!user) router.replace('/(auth)')
        else if (!isOnboarded) router.replace('/onboarding')
        else router.replace('/(tabs)/home')
      })
    }, loading ? 800 : 300)

    return () => clearTimeout(timeout)
  }, [loading, user, isOnboarded])

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View style={[styles.row, { opacity: fadeIn }]}>
        <Image
          source={require('@/assets/logo.png')}
          style={{ width: 320, height: 80 }}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})