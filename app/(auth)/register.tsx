// app/(auth)/register.tsx

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Mail, Lock, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react-native'
import { signUp } from '@/lib/auth'
import { Colors } from '@/constants/colors'

type Role = 'donor' | 'organization'

export default function RegisterScreen() {
  const router = useRouter()
  const { role } = useLocalSearchParams<{ role: Role }>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDonor = role === 'donor'
  const accentColor = isDonor ? Colors.primary : Colors.orange

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !phone) {
      return setError('Mohon isi semua kolom.')
    }
    if (password !== confirmPassword) {
      return setError('Password tidak cocok.')
    }
    if (password.length < 6) {
      return setError('Password minimal 6 karakter.')
    }

    setError(null)
    setLoading(true)
    const { error } = await signUp({ email, password, phone, role })
    setLoading(false)

    if (error) setError(error.message)
    // AuthGuard handles redirect to /onboarding
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-10 pb-8">

        {/* Back n Logo */}
        <View className="flex-row items-center justify-between mb-10">
          <View className="flex-row items-center gap-3">
            <Image source={require('@/assets/maribagi-icon.png')} style={{ width: 40, height: 40 }} />
            <Text className="text-lg font-bold text-text-dark">MariBagi</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
          >
            <ArrowLeft size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View className="flex-row items-center gap-2">
          <Text className="text-3xl font-extrabold text-text-dark">Daftar sebagai</Text>
        </View>
        <Text className="text-5xl font-extrabold mb-6" style={{ color: accentColor }}>
          {isDonor ? 'Donatur' : 'Organisasi'}
        </Text>

        {/* Email */}
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

        {/* Phone */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">NOMOR HP</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-4 shadow-sm">
          <Phone size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            placeholder="08xxxxxxxxxx"
            placeholderTextColor={Colors.textLight}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Password */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">PASSWORD</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-4 shadow-sm">
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

        {/* Confirm Password */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">KONFIRMASI PASSWORD</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-8 shadow-sm">
          <Lock size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            placeholder="••••••••"
            placeholderTextColor={Colors.textLight}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            {showConfirm
              ? <EyeOff size={18} color={Colors.textLight} />
              : <Eye size={18} color={Colors.textLight} />
            }
          </TouchableOpacity>
        </View>

        {/* Register button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRegister}
          disabled={loading}
          className="rounded-2xl py-4 items-center mb-3"
          style={{ backgroundColor: accentColor }}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Buat Akun</Text>
          }
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <Text className="text-red-500 text-xs text-center mb-4">{error}</Text>
        )}

        {/* Login link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text className="text-center text-sm text-text-muted">
            Sudah punya akun?{' '}
            <Text className="font-bold" style={{ color: accentColor }}>Masuk</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}