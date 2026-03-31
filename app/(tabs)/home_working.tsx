// app/(tabs)/home.tsx

import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, Image, ActivityIndicator
} from 'react-native'
import { Bell, MapPin, Search, ChevronRight } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useNeeds } from '@/hooks/useNeeds'
import { useCategories } from '@/hooks/useCategories'
import { Colors } from '@/constants/colors'
import { Need } from '@/types'
import { useRouter } from 'expo-router'
//router for redirecting to dummy home
const router = useRouter()

// ─── Urgency Badge ─────────────────────────────────────────
const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  const isUrgent = urgency === 'urgent'
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: isUrgent ? '#FEE2E2' : '#F0FDF4' }}
    >
      <Text
        className="text-xs font-semibold"
        style={{ color: isUrgent ? '#DC2626' : '#16A34A' }}
      >
        {isUrgent ? 'Mendesak' : 'Normal'}
      </Text>
    </View>
  )
}

// ─── Need Card ─────────────────────────────────────────────
const NeedCard = ({ item }: { item: Need }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
    style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}
  >
    {item.org.prof_pic ? (
      <Image
        source={{ uri: item.org.prof_pic }}
        style={{ width: 90, height: 110 }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{ width: 90, height: 110, backgroundColor: Colors.donorBg }}
        className="items-center justify-center"
      >
        <Text className="text-2xl">🏢</Text>
      </View>
    )}
    <View className="flex-1 p-3 justify-between">
      <View className="flex-row items-center justify-between mb-1">
        <UrgencyBadge urgency={item.urgency} />
      </View>
      <Text className="text-base font-bold text-text-dark" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-xs text-text-muted font-medium mb-1" numberOfLines={1}>
        {item.org.full_name}
      </Text>
      <Text className="text-xs text-text-muted leading-snug" numberOfLines={2}>
        {item.description}
      </Text>
      <Text className="text-xs mt-1 font-medium" style={{ color: Colors.primary }}>
        {item.category.name}
      </Text>
    </View>
  </TouchableOpacity>
)

// ─── Main Screen ───────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')

  const { needs, loading, refetch } = useNeeds(selectedCategory)
  const { categories } = useCategories()

  const fullName = user?.user_metadata?.fullname ?? 'Donatur'

  const filtered = needs.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.org.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-5 pt-14">

        {/* Header */}
        <View className="flex-row items-start justify-between mb-6">
          <View>
            <Text className="text-sm text-text-muted">Halo, Donatur! 👋</Text>
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
          style={{ backgroundColor: Colors.donorBg }}
        >
          <MapPin size={15} color={Colors.primary} />
          <Text className="text-sm font-semibold" style={{ color: Colors.primaryDark }}>
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
            placeholder="Cari kebutuhan organisasi..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-2">
            {/* All button */}
            <TouchableOpacity
              onPress={() => setSelectedCategory(undefined)}
              activeOpacity={0.8}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: !selectedCategory ? Colors.primary : 'white',
                borderWidth: 1,
                borderColor: !selectedCategory ? Colors.primary : '#E5E7EB',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: !selectedCategory ? 'white' : Colors.textMuted }}
              >
                Semua
              </Text>
            </TouchableOpacity>

            {/* Dynamic categories from DB */}
            {categories.map(cat => {
              const active = selectedCategory === cat.id
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: active ? Colors.primary : 'white',
                    borderWidth: 1,
                    borderColor: active ? Colors.primary : '#E5E7EB',
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: active ? 'white' : Colors.textMuted }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* Section header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-extrabold text-text-dark">Kebutuhan Terdekat</Text>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold" style={{ color: Colors.primary }}>
              Lihat Semua
            </Text>
            <ChevronRight size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : filtered.length > 0 ? (
          filtered.map(item => <NeedCard key={item.id} item={item} />)
        ) : (
          <View className="items-center py-10">
            <Text className="text-text-muted text-sm">Tidak ada kebutuhan ditemukan.</Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-primary py-3 rounded-full items-center justify-center mt-6"
          onPress={() => router.push('/home')}
        >
          <Text className="text-white font-semibold">Home Dummy</Text>
        </TouchableOpacity>


      </View>
    </ScrollView>
  )
}