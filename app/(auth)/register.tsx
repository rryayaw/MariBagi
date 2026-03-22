// app/(auth)/register.tsx

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { signUp } from '@/lib/auth'
import { useLocalSearchParams } from 'expo-router'

type Role = 'donor' | 'organization'

export default function RegisterScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !password || !phone || !role)
      return Alert.alert('Error', 'Please fill in all fields and select a role')

    setLoading(true)
    const { error } = await signUp({ email, password, phone, role })
    setLoading(false)

    if (error) Alert.alert('Registration failed', error.message)
    // AuthGuard will redirect to /onboarding
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-8">Create account</Text>

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 mb-4"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 mb-6"
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {/* Role selector */}
      <Text className="text-sm text-gray-500 mb-3">I am a...</Text>
      <View className="flex-row gap-3 mb-8">
        <TouchableOpacity
          className={`flex-1 py-4 rounded-xl items-center border-2 ${
            role === 'donor' ? 'bg-green-500 border-green-500' : 'border-gray-300'
          }`}
          onPress={() => setRole('donor')}
        >
          <Text className={`font-semibold ${role === 'donor' ? 'text-white' : 'text-gray-600'}`}>
            Donor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-4 rounded-xl items-center border-2 ${
            role === 'organization' ? 'bg-green-500 border-green-500' : 'border-gray-300'
          }`}
          onPress={() => setRole('organization')}
        >
          <Text className={`font-semibold ${role === 'organization' ? 'text-white' : 'text-gray-600'}`}>
            Organization
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-green-500 rounded-xl py-4 items-center"
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold text-base">Create account</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 items-center" onPress={() => router.push('/(auth)/login')}>
        <Text className="text-gray-500">Already have an account? <Text className="text-green-500 font-semibold">Login</Text></Text>
      </TouchableOpacity>
    </View>
  )
}