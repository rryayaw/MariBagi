import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Image,
  TouchableOpacity, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { MapPin, Phone, Star, LogOut, Pencil } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { Colors } from '@/constants/colors'
import { Profile } from '@/types'


export default function ProfileScreen() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const isDonor = role === 'donor'
  const accentColor = isDonor ? Colors.primary : Colors.orange
  const table = isDonor ? 'donors' : 'orgs'

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(`
          full_name,
          prof_pic,
          address,
          avg_rating,
          profiles (phone, role)
        `)
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setProfile(data as unknown as Profile)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) return (
    <View className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator color={Colors.primary} />
    </View>
  )

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>

      {/* Header band */}
      <View
        className="w-full pt-14 pb-20 px-5 items-center"
        style={{ backgroundColor: accentColor }}
      >
        <Text className="text-white font-bold text-lg">Profil</Text>
      </View>

      {/* Avatar — overlaps header */}
      <View className="items-center" style={{ marginTop: -50 }}>
        <View
          style={{
            width: 100, height: 100, borderRadius: 50,
            overflow: 'hidden', borderWidth: 4, borderColor: Colors.bg,
            backgroundColor: Colors.donorBg
          }}
        >
          {profile?.prof_pic ? (
            <Image
              source={{ uri: profile.prof_pic }}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text style={{ fontSize: 36 }}>👤</Text>
            </View>
          )}
        </View>

        {/* Name + role badge */}
        <Text className="text-xl font-extrabold text-text-dark mt-3">
          {profile?.full_name}
        </Text>
        <View
          className="px-3 py-1 rounded-full mt-1"
          style={{ backgroundColor: isDonor ? Colors.donorBg : Colors.orgBg }}
        >
          <Text className="text-xs font-bold" style={{ color: accentColor }}>
            {isDonor ? 'Donatur' : 'Organisasi'}
          </Text>
        </View>

        {/* Rating */}
        <View className="flex-row items-center gap-1 mt-2">
          <Star size={14} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-sm font-semibold text-text-dark">
            {profile?.avg_rating?.toFixed(1) ?? '—'}
          </Text>
          <Text className="text-xs text-text-muted">rating</Text>
        </View>
      </View>

      {/* Info cards */}
      <View className="px-5 mt-6 gap-3">

        {profile?.profiles?.phone && (
          <View
            className="bg-white rounded-2xl px-4 py-4 flex-row items-center gap-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: isDonor ? Colors.donorBg : Colors.orgBg }}
            >
              <Phone size={16} color={accentColor} />
            </View>
            <View>
              <Text className="text-xs text-text-light font-medium">Nomor HP</Text>
              <Text className="text-sm font-semibold text-text-dark">
                {profile.profiles.phone}
              </Text>
            </View>
          </View>
        )}

        {profile?.address && (
          <View
            className="bg-white rounded-2xl px-4 py-4 flex-row items-center gap-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: isDonor ? Colors.donorBg : Colors.orgBg }}
            >
              <MapPin size={16} color={accentColor} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-text-light font-medium">Alamat</Text>
              <Text className="text-sm font-semibold text-text-dark" numberOfLines={2}>
                {profile.address}
              </Text>
            </View>
          </View>
        )}

      </View>

      {/* Action buttons */}
      <View className="px-5 mt-6 gap-3">

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('../(edit)/edit-profile')}
          className="rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          <Pencil size={16} color="white" />
          <Text className="text-white font-bold text-sm">Edit Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSignOut}
          className="bg-white rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{ borderWidth: 1, borderColor: '#FEE2E2' }}
        >
          <LogOut size={16} color="#DC2626" />
          <Text className="text-sm font-bold" style={{ color: '#DC2626' }}>Keluar</Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  )
}