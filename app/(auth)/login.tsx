// app/(auth)/login.tsx

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native'
import { signIn } from '@/lib/auth'
import { Colors } from '@/constants/colors'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields')
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) Alert.alert('Login failed', error.message)
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-10 pb-10">

        {/* Logo */}
        <View className="flex-row items-center gap-3 mb-16">
          <Image source={require('@/assets/maribagi-icon.png')} style={{ width: 40, height: 40 }} />
          <Text className="text-lg font-bold text-text-dark">MariBagi</Text>
        </View>

        {/* Header */}
        <Text className="text-3xl font-extrabold text-text-dark mb-2">Selamat datang</Text>
        <Text className="text-sm text-text-muted mb-10">
          Masuk untuk melanjutkan aktivitas donasi kamu.
        </Text>

        {/* Email input */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">EMAIL</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-4 shadow-sm">
          <Mail size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            placeholder="email@kamu.com"
            placeholderTextColor={Colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password input */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">PASSWORD</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-2 shadow-sm">
          <Lock size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            placeholder="••••••••"
            placeholderTextColor={Colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword
              ? <EyeOff size={18} color={Colors.textLight} />
              : <Eye size={18} color={Colors.textLight} />
            }
          </TouchableOpacity>
        </View>

        {/* Forgot password */}
        <TouchableOpacity className="mb-8 self-end">
          <Text className="text-xs text-primary-dark font-semibold">Lupa password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogin}
          disabled={loading}
          className="rounded-2xl py-4 items-center mb-4"
          style={{ backgroundColor: Colors.primary }}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Masuk</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center gap-3 mb-8">
          <View className="flex-1 h-px bg-text-light opacity-30" />
          <Text className="text-xs text-text-light">atau</Text>
          <View className="flex-1 h-px bg-text-light opacity-30" />
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push('/(auth)')}>
          <Text className="text-center text-sm text-text-muted">
            Belum punya akun?{' '}
            <Text className="font-bold" style={{ color: Colors.primary }}>Daftar sekarang</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}