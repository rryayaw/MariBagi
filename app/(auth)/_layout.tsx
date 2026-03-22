import { Stack } from 'expo-router'
import { useEffect } from 'react'
import 'react-native-url-polyfill/auto'
import '@/global.css'

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
    </Stack>
  )
}