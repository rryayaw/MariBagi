import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { Bell, MapPin, Search, ChevronRight } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useNeeds } from '@/hooks/useNeeds'
import { useDonations } from '@/hooks/useDonations'
import { useCategories } from '@/hooks/useCategories'
import { Colors } from '@/constants/colors'
import { NeedCard } from '@/components/NeedCard'
import { DonationCard } from '@/components/DonationCard'
import { CategoryFilter } from '@/components/CategoryFilter'
import { useRouter } from 'expo-router'

export default function HomeScreen() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')

  const isOrg = role === 'organization'

  const { needs, loading: needsLoading } = useNeeds(selectedCategory)
  const { donations, loading: donationsLoading } = useDonations(selectedCategory)
  const { categories } = useCategories()

  const loading = isOrg ? donationsLoading : needsLoading
  const fullName = user?.user_metadata?.fullname ?? (isOrg ? 'Organisasi' : 'Donatur')

  const filteredNeeds = needs.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.org.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredDonations = donations.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.donor.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-5 pt-14">

        {/* Header */}
        <View className="flex-row items-start justify-between mb-6">
          <View>
            <Text className="text-sm text-text-muted">
              {isOrg ? 'Halo, Organisasi! 👋' : 'Halo, Donatur! 👋'}
            </Text>
            <Text className="text-2xl font-extrabold text-text-dark">{fullName}</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            <Bell size={18} color={Colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Location banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="rounded-2xl px-4 py-3 flex-row items-center gap-2 mb-5"
          style={{ backgroundColor: isOrg ? Colors.orgBg : Colors.donorBg }}
        >
          <MapPin size={15} color={isOrg ? Colors.orange : Colors.primary} />
          <Text
            className="text-sm font-semibold"
            style={{ color: isOrg ? Colors.orange : Colors.primaryDark }}
          >
            Menampilkan dalam radius 5 km dari lokasimu
          </Text>
        </TouchableOpacity>

        {/* Search */}
        <View
          className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-5"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
        >
          <Search size={16} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-3 text-sm text-text-dark"
            placeholder={isOrg ? 'Cari donasi tersedia...' : 'Cari kebutuhan organisasi...'}
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Section header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-extrabold text-text-dark">
            {isOrg ? 'Donasi Tersedia' : 'Kebutuhan Terdekat'}
          </Text>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold" style={{ color: isOrg ? Colors.orange : Colors.primary }}>
              Lihat Semua
            </Text>
            <ChevronRight size={14} color={isOrg ? Colors.orange : Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color={isOrg ? Colors.orange : Colors.primary} />
          </View>
        ) : isOrg ? (
          filteredDonations.length > 0
            ? filteredDonations.map(item => (
              <DonationCard
                key={item.id}
                item={item}
                onPress={() => router.push({ pathname: '/donation-detail', params: { id: item.id } })}
              />
            ))
            : (
              <View className="items-center py-10">
                <Text className="text-text-muted text-sm">Tidak ada donasi tersedia.</Text>
              </View>
            )
        ) : (
          filteredNeeds.length > 0
            ? filteredNeeds.map(item => (
              <NeedCard
                key={item.id}
                item={item}
                onPress={() => router.push({ pathname: '/need-detail', params: { id: item.id } })}
              />
            ))
            : (
              <View className="items-center py-10">
                <Text className="text-text-muted text-sm">Tidak ada kebutuhan ditemukan.</Text>
              </View>
            )
        )}

      </View>
    </ScrollView>
  )
}
