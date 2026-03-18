import { Stack } from 'expo-router'
import { useEffect } from 'react'
import 'react-native-url-polyfill/auto'
import '../global.css'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}