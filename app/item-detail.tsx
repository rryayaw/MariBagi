import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Clock, AlertCircle, MessageCircle, Heart, Share2 } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { DonationDetail, NeedDetail } from '@/types'

export default function ItemDetailScreen() {
  const router = useRouter()
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>()
  const { user } = useAuth()

  const [item, setItem] = useState<DonationDetail | NeedDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingCount, setRatingCount] = useState(0)

  const getRelativeTime = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} menit lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam lalu`
    } else {
      return `${diffDays} hari lalu`
    }
  }

  useEffect(() => {
    if (!type || !id) {
      setError('Invalid item parameters')
      setLoading(false)
      return
    }

    fetchItem()
  }, [type, id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      setError(null)

      const table = type === 'donation' ? 'donations' : 'needs'
      const relationName = type === 'donation' ? 'donor' : 'org'
      const idField = type === 'donation' ? 'donor_id' : 'org_id'

      const { data, error: err } = await supabase
        .from(table)
        .select(`
          *,
          ${relationName}:${idField}(full_name, prof_pic, address, latitude, longitude, avg_rating),
          category:category_id(name)
        `)
        .eq('id', id)
        .single()

      if (err) throw err
      if (!data) throw new Error('Item not found')

      setItem(data as DonationDetail | NeedDetail)

      const posterId = type === 'donation' ? data.donor_id : data.org_id
      const { count } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('rated_entity', posterId)
      setRatingCount(count ?? 0)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  if (error || !item) {
    return (
      <View className="flex-1 bg-bg px-5 pt-10">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <ArrowLeft size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <AlertCircle size={48} color={Colors.textMuted} />
          <Text className="text-center text-text-dark font-bold mt-4">{error || 'Item not found'}</Text>
          <TouchableOpacity onPress={fetchItem} className="mt-6 px-6 py-3 bg-primary rounded-2xl">
            <Text className="text-white font-semibold">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const isDonation = type === 'donation'
  const accentColor = isDonation ? Colors.primary : Colors.orange
  const poster = isDonation ? (item as DonationDetail).donor : (item as NeedDetail).org

  const avgRating = poster?.avg_rating ?? 0
  const ratingLabel = ratingCount === 0
    ? 'Pengguna Baru'
    : ratingCount < 10
      ? `⭐ ${avgRating.toFixed(1)}  (${ratingCount} ulasan)`
      : `⭐ ${avgRating.toFixed(1)}`

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 50 }}>
      {/* photo and badges*/}
      <View className="relative">
        <View className="absolute top-4 left-0 right-0 px-5 z-10 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/90 rounded-full p-2"
            style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 }}
          >
            <ArrowLeft size={24} color={Colors.textDark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {}}
            className="bg-white/90 rounded-full p-2"
            style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 }}
          >
            <Share2 size={24} color={Colors.textDark} />
          </TouchableOpacity>
        </View>
        {item.photo_url && (
          <Image
            source={{ uri: item.photo_url }}
            style={{ width: '100%', height: 250 }}
            resizeMode="cover"
          />
        )}
        
        <View className="absolute bottom-3 left-3">
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: !isDonation && (item as NeedDetail).urgency === 'urgent' ? '#FEE2E2' : Colors.donorBg }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: !isDonation && (item as NeedDetail).urgency === 'urgent' ? '#DC2626' : accentColor }}
            >
              {!isDonation && (item as NeedDetail).urgency === 'urgent' ? 'Mendesak' : isDonation ? 'Donasi' : 'Kebutuhan'}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-5 pt-5">
        {/* item title */}
        <Text className="text-3xl font-bold text-text-dark mb-2">{item.title}</Text>

        {/* user info */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-sm text-text-muted font-medium">{poster?.full_name}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={12} color={Colors.textMuted} />
              <Text className="text-xs text-text-muted">1.2 km</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-text-muted">{ratingLabel}</Text>
          </View>
        </View>

        {/* description */}
        <View className="bg-white rounded-2xl p-4 mb-5 shadow-sm">
          <Text className="text-sm leading-relaxed text-text-dark">{item.description}</Text>
        </View>

        {/* Metode Pengambilan / Urgency section */}
        <View className="bg-white rounded-2xl p-4 mb-5 shadow-sm">
          <Text className="text-base font-bold text-text-dark mb-3">
            {isDonation ? 'Metode Pengambilan' : 'Tingkat Urgensi'}
          </Text>
          {isDonation ? (
            <>
              <View className="flex-row items-start gap-2 mb-3">
                <Text className="text-lg">
                  {(item as DonationDetail).pickup_method === 'pickup' ? '🚗' : '📦'}
                </Text>
                <View className="flex-1">
                  <Text className="font-semibold text-text-dark">
                    {(item as DonationDetail).pickup_method === 'pickup' ? 'Dijemput' : 'Diantar'} langsung atau jemput oleh kami
                  </Text>
                  <Text className="text-xs text-text-muted mt-1">{poster?.address}</Text>
                </View>
              </View>
            </>
          ) : (
            <View className="flex-row items-center gap-2">
              <AlertCircle size={18} color={Colors.orange} />
              <Text className="font-semibold text-text-dark">
                {(item as NeedDetail).urgency === 'urgent' ? 'Dibutuhkan Segera' : 'Normal'}
              </Text>
            </View>
          )}
        </View>

        {/* posted date */}
        <View className="flex-row items-center gap-2 mb-6">
          <Clock size={12} color={Colors.textLight} />
          <Text className="text-xs text-text-light">
            Diposting {getRelativeTime(item.created_at)}
          </Text>
        </View>

        {/* action buttons */}
        {user?.id !== (isDonation ? (item as DonationDetail).donor_id : (item as NeedDetail).org_id) ? (
          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center gap-2 border-2 rounded-2xl py-4"
              style={{ borderColor: Colors.textMuted }}
              onPress={() => Alert.alert('Info', 'Fitur chat belum tersedia')}
            >
              <MessageCircle size={18} color={Colors.textMuted} />
              <Text className="text-base font-bold text-text-muted">Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{ backgroundColor: accentColor }}
              onPress={() => Alert.alert('Info', isDonation ? 'Fitur request belum tersedia' : 'Fitur minta donasi belum tersedia')}
            >
              <Heart size={18} color="white" fill="white" />
              <Text className="text-base font-bold text-white">
                {isDonation ? 'Lihat Detail' : 'Minta Donasi'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: accentColor }}
          >
            <Text className="text-white font-bold text-base">Manage Item</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}
