// app/(tabs)/05-profil.tsx

import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { Pencil, LogOut, Star, Edit, MapPin, Bell, Shield, HelpCircle } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { Colors } from '@/constants/colors'
import { Profile } from '@/types'
import { Stats } from '@/types'
import { MenuItem, Divider } from '@/components/MenuItem'

// main screen

export default function ProfileScreen() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ donations: 0, orgs: 0, rating: 0 })
  const [loading, setLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const isDonor = role === 'donor'
  const primaryColor = isDonor ? Colors.primary : Colors.orange
  const table = isDonor ? 'donors' : 'orgs'

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const { data } = await supabase
        .from(table)
        .select('full_name, prof_pic, address, avg_rating, profiles (phone)')
        .eq('id', user?.id)
        .single()

      if (data) {
        setProfile(data as unknown as Profile)

        if (isDonor) {
          const { count: donationCount } = await supabase
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('donor_id', user?.id)

          const { count: orgCount } = await supabase
            .from('requests')
            .select('org_id', { count: 'exact', head: true })
            .eq('donor_id', user?.id)
            .eq('status', 'completed')

          setStats({
            donations: donationCount ?? 0,
            orgs: orgCount ?? 0,
            rating: data.avg_rating ?? 0,
          })
        } else {
          const { count: needCount } = await supabase
            .from('needs')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', user?.id)

          const { data: donorRows } = await supabase
            .from('requests')
            .select('donor_id')
            .eq('org_id', user?.id)
            .eq('status', 'completed')

          const uniqueDonors = new Set((donorRows ?? []).map((d: any) => d.donor_id)).size

          setStats({
            donations: needCount ?? 0,
            orgs: uniqueDonors,
            rating: data.avg_rating ?? 0,
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <View className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator color={Colors.primary} />
    </View>
  )

  const hasActivity = stats.donations > 0 || stats.orgs > 0

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    signOut()
  }

  return (
    <>
      <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* hero */}
        <View
          className="pt-6 pb-40 px-5"
          style={{ backgroundColor: primaryColor }}
        >
        <View className="flex-row items-center gap-4">

          {/* Avatar */}
          <View className="relative">
            <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/40 bg-white/20">
              {profile?.prof_pic
                ? <Image source={{ uri: profile.prof_pic }} className="w-20 h-20" resizeMode="cover" />
                : <View className="flex-1 items-center justify-center"><Text className="text-3xl">👤</Text></View>
              }
            </View>
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.orange }}
            >
              <Pencil size={12} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name + badge */}
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-white">{profile?.full_name}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="bg-white/25 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {isDonor ? 'Donatur' : 'Organisasi'}
                </Text>
              </View>
              {hasActivity && (
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#FCD34D" fill="#FCD34D" />
                  <Text className="text-white text-xs font-semibold">
                    {isDonor ? 'Donatur Aktif' : 'Organisasi Aktif'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className="px-5">

        {/* stats card - overlaps hero */}
        <View
          className="rounded-2xl p-5 flex-row justify-around -mt-36 mb-3 bg-white/30"
          style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 }}
        >
          {(isDonor
            ? [
                { emoji: '📦', value: stats.donations, label: 'Donasi' },
                { emoji: '🏠', value: stats.orgs, label: 'Organisasi' },
                { emoji: '⭐', value: stats.rating > 0 ? stats.rating.toFixed(1) : '—', label: 'Rating' },
              ]
            : [
                { emoji: '📋', value: stats.donations, label: 'Kebutuhan' },
                { emoji: '👤', value: stats.orgs, label: 'Donatur' },
                { emoji: '⭐', value: stats.rating > 0 ? stats.rating.toFixed(1) : '—', label: 'Rating' },
              ]
          ).map((s, i) => (
            <View key={i} className="items-center flex-1">
              <Text className="text-2xl mb-1">{s.emoji}</Text>
              <Text className="text-xl font-extrabold text-white">{s.value}</Text>
              <Text className="text-xs text-white/80">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Impact card*/}
        <View className="bg-white rounded-2xl p-4 flex-row items-center gap-4 mb-6 shadow-sm">
          <View
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: isDonor ? Colors.donorBg : Colors.orgBg }}
          >
            <Text className="text-xl">{isDonor ? '❤️' : '🤝'}</Text>
          </View>
          <View className="flex-1">
            {hasActivity ? (
              isDonor ? (
                <>
                  <Text className="text-sm font-bold text-text-dark">Dampak Donasimu</Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Telah membantu melalui{' '}
                    <Text className="font-bold" style={{ color: primaryColor }}>{stats.donations} donasi</Text>
                    {' '}ke{' '}
                    <Text className="font-bold" style={{ color: primaryColor }}>{stats.orgs} organisasi</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-sm font-bold text-text-dark">Dampak Komunitasmu</Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Menerima bantuan dari{' '}
                    <Text className="font-bold" style={{ color: primaryColor }}>{stats.orgs} donatur</Text>
                    {' '}untuk{' '}
                    <Text className="font-bold" style={{ color: primaryColor }}>{stats.donations} kebutuhan</Text>
                  </Text>
                </>
              )
            ) : (
              isDonor ? (
                <>
                  <Text className="text-sm font-bold text-text-dark">Mulai Berdonasi!</Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Donasikan barang layak pakaimu dan bantu yang membutuhkan.
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-sm font-bold text-text-dark">Mulai Posting Kebutuhan!</Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Buat kebutuhan dan dapatkan bantuan dari donatur.
                  </Text>
                </>
              )
            )}
          </View>
        </View>

        {/* akun section */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-3">AKUN</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-5">
        <MenuItem icon={<Edit size={16} color={Colors.primary} />} label="Edit Profil" onPress={() => router.push('/edit-profile')} />
        <Divider />
        <MenuItem icon={<MapPin size={16} color={Colors.primary} />} label="Alamat Saya" onPress={() => {}} />
        <Divider />
        <MenuItem icon={<Bell size={16} color={Colors.primary} />} label="Notifikasi" onPress={() => {}} />
        </View>

        {/* Lainnya section */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-3">LAINNYA</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-5">
        <MenuItem icon={<Shield size={16} color={Colors.primary} />} label="Privasi & Keamanan" onPress={() => {}} />
        <Divider />
        <MenuItem icon={<HelpCircle size={16} color={Colors.primary} />} label="Bantuan" onPress={() => {}} />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          className="bg-red-100 rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{ borderWidth: 1, borderColor: '#FEE2E2' }}
        >
          <LogOut size={16} color="#DC2626" />
          <Text className="text-sm font-bold text-red-600">Keluar</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>

    {/* Logout confirmation modal */} 
    <Modal
      visible={showLogoutModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View className="flex-1 bg-black/40 items-center justify-center">
        <View className="bg-white rounded-md p-6 w-4/5 items-center">
          <Text className="text-xl font-bold text-text-dark mb-2">Konfirmasi Keluar</Text>
          <Text className="text-sm text-text-muted text-center mb-6">Apakah Anda yakin ingin keluar?</Text>
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={() => setShowLogoutModal(false)}
              className="flex-1 py-3 rounded-2xl items-center border-2 border-text-light"
            >
              <Text className="font-semibold text-text-dark">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmLogout}
              className="flex-1 py-3 rounded-2xl items-center bg-red-500"
            >
              <Text className="font-semibold text-white">Keluar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  )
}