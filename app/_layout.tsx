import { Stack } from 'expo-router'
import 'react-native-url-polyfill/auto'
import '@/global.css'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { AuthGuard } from '@/components/AuthGuard'


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </AuthProvider>
  )
}