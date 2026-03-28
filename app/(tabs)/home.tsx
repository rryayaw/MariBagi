// app/(tabs)/home.tsx

import { useState } from 'react'
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, Image, FlatList
} from 'react-native'
import { Bell, MapPin, Search, ChevronRight } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { Colors } from '@/constants/colors'

// DUMMY DATA
const CATEGORIES = ['Semua', 'Pakaian', 'Buku', 'Makanan', 'Elektronik', 'Lainnya']

const NEEDS = [
  {
    id: '1',
    title: 'Pakaian Anak',
    org: 'Panti Asuhan Harapan Baru',
    description: 'Membutuhkan pakaian anak usia 5–10 tahun, kondisi layak pakai.',
    urgency: 'urgent',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200',
    category: 'Pakaian',
  },
  {
    id: '2',
    title: 'Buku & Alat Tulis',
    org: 'Yayasan Cahaya Masa Depan',
    description: 'Butuh buku pelajaran SD dan alat tulis untuk 30 anak.',
    urgency: 'normal',
    distance: '2.8 km',
    image: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=200',
    category: 'Buku',
  },
  {
    id: '3',
    title: 'Bahan Makanan',
    org: 'Komunitas Peduli Sesama',
    description: 'Kebutuhan beras, minyak, dan sembako non-perishable untuk 50 keluarga.',
    urgency: 'normal',
    distance: '4.5 km',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200',
    category: 'Makanan',
  },
  {
    id: '4',
    title: 'Selimut & Kasur Lipat',
    org: 'Rumah Singgah Sejahtera',
    description: 'Dibutuhkan selimut tebal dan kasur lipat untuk 20 penghuni baru.',
    urgency: 'urgent',
    distance: '5.1 km',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200',
    category: 'Lainnya',
  },
]

// urgency badge component for need card
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

// Need card component
const NeedCard = ({ item }: { item: typeof NEEDS[0] }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
    style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}
  >
    <Image
      source={{ uri: item.image }}
      style={{ width: 90, height: 110 }}
      resizeMode="cover"
    />
    <View className="flex-1 p-3 justify-between">
      <View className="flex-row items-center justify-between mb-1">
        <UrgencyBadge urgency={item.urgency} />
        <Text className="text-xs text-text-muted">{item.distance}</Text>
      </View>
      <Text className="text-base font-bold text-text-dark" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-xs text-text-muted font-medium mb-1" numberOfLines={1}>
        {item.org}
      </Text>
      <Text className="text-xs text-text-muted leading-snug" numberOfLines={2}>
        {item.description}
      </Text>
    </View>
  </TouchableOpacity>
)

// main screen
export default function HomeScreen() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [search, setSearch] = useState('')

  const fullName = user?.user_metadata?.fullname ?? 'Donatur'

  const filtered = NEEDS.filter(n => {
    const matchCategory = selectedCategory === 'Semua' || n.category === selectedCategory
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

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

        {/* Location banner / Temp banner */}
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
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-5"
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
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
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
                    {cat}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* section header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-extrabold text-text-dark">Kebutuhan Terdekat</Text>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold" style={{ color: Colors.primary }}>
              Lihat Semua
            </Text>
            <ChevronRight size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Need cards*/}
        {filtered.length > 0
          ? filtered.map(item => <NeedCard key={item.id} item={item} />)
          : (
            <View className="items-center py-10">
              <Text className="text-text-muted text-sm">Tidak ada kebutuhan ditemukan.</Text>
            </View>
          )
        }

      </View>
    </ScrollView>
  )
}