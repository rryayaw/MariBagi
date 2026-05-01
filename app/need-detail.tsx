import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Clock, AlertCircle, MessageCircle, Heart, Tag } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { NeedDetail } from '@/types'

export default function NeedDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()

  const [item, setItem] = useState<NeedDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingCount, setRatingCount] = useState(0)

  const getRelativeTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMs / 3600000)
    const days = Math.floor(diffMs / 86400000)
    if (mins < 60) return `${mins} menit lalu`
    if (hours < 24) return `${hours} jam lalu`
    return `${days} hari lalu`
  }

  useEffect(() => {
    if (!id) { setError('Invalid item'); setLoading(false); return }
    fetchItem()
  }, [id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('needs')
        .select('*, org:org_id(full_name, prof_pic, address, latitude, longitude, avg_rating), category:category_id(name)')
        .eq('id', id)
        .single()

      if (err) throw err
      setItem(data as NeedDetail)

      const { count } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('rated_entity', data.org_id)
      setRatingCount(count ?? 0)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={Colors.orange} size="large" />
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
          <Text className="text-center text-text-dark font-bold mt-4">{error || 'Post tidak ditemukan'}</Text>
          <TouchableOpacity onPress={fetchItem} className="mt-6 px-6 py-3 rounded-2xl" style={{ backgroundColor: Colors.orange }}>
            <Text className="text-white font-semibold">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const org = item.org
  const isUrgent = item.urgency === 'urgent'
  const isOwner = user?.id === item.org_id

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 60 }}>

      {/* Colored header */}
      <View style={{ backgroundColor: Colors.orange, paddingTop: 52, paddingBottom: 32, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-5">
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>

        <Text className="text-white/70 text-xs font-semibold tracking-widest mb-1">KEBUTUHAN ORGANISASI</Text>
        <Text className="text-white text-2xl font-extrabold leading-snug mb-4" numberOfLines={3}>
          {item.title}
        </Text>

        {/* Urgency + status pills */}
        <View className="flex-row gap-2">
          <View
            className="self-start px-3 py-1 rounded-full"
            style={{ backgroundColor: isUrgent ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}
          >
            <Text className="text-white text-xs font-bold">
              {isUrgent ? '🚨 Mendesak' : '📋 Normal'}
            </Text>
          </View>
          <View className="self-start px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Text className="text-white text-xs font-bold">
              {item.status === 'open' ? 'Terbuka' : item.status === 'partially_fulfilled' ? 'Sebagian' : item.status === 'fulfilled' ? 'Terpenuhi' : 'Ditutup'}
            </Text>
          </View>
        </View>
      </View>

      {/* Floating row: org thumbnail + info cards */}
      <View className="flex-row mx-5 gap-3" style={{ marginTop: -20 }}>
        {/* Org photo */}
        <View
          className="rounded-2xl overflow-hidden bg-white"
          style={{ width: 80, height: 80, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}
        >
          {org?.prof_pic ? (
            <Image source={{ uri: org.prof_pic }} style={{ width: 80, height: 80 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 80, height: 80, backgroundColor: Colors.orgBg }} className="items-center justify-center">
              <Text style={{ fontSize: 32 }}>🏢</Text>
            </View>
          )}
        </View>

        {/* Quick-info cards */}
        <View className="flex-1 flex-row gap-2">
          <View
            className="flex-1 bg-white rounded-2xl p-3 items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
          >
            <Tag size={15} color={Colors.orange} />
            <Text className="text-xs font-bold text-text-dark mt-1 text-center" numberOfLines={1}>
              {item.category?.name}
            </Text>
            <Text className="text-xs text-text-muted">Kategori</Text>
          </View>
          <View
            className="flex-1 bg-white rounded-2xl p-3 items-center justify-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
          >
            <Clock size={15} color={Colors.orange} />
            <Text className="text-xs font-bold text-text-dark mt-1 text-center" numberOfLines={2}>
              {getRelativeTime(item.created_at)}
            </Text>
            <Text className="text-xs text-text-muted">Diposting</Text>
          </View>
        </View>
      </View>

      <View className="px-5 mt-5">

        {/* Org info card */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-text-light tracking-widest mb-3">ORGANISASI</Text>
          <Text className="text-base font-bold text-text-dark mb-1">{org?.full_name}</Text>
          {ratingCount > 0 ? (
            <Text className="text-xs text-text-muted mb-2">
              ⭐ {org.avg_rating?.toFixed(1)} · {ratingCount} ulasan
            </Text>
          ) : (
            <Text className="text-xs text-text-muted mb-2">Organisasi Baru</Text>
          )}
          {org?.address ? (
            <View className="flex-row items-start gap-2 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <MapPin size={13} color={Colors.textLight} style={{ marginTop: 1 }} />
              <Text className="text-xs text-text-muted flex-1">{org.address}</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-xs font-bold text-text-light tracking-widest mb-3">DESKRIPSI</Text>
          <Text className="text-sm leading-relaxed text-text-dark">{item.description}</Text>
        </View>

        {/* Urgency detail */}
        <View
          className="rounded-2xl p-4 mb-6 flex-row items-center gap-3"
          style={{ backgroundColor: isUrgent ? '#FFF5F5' : '#F0FDF4' }}
        >
          <AlertCircle size={22} color={isUrgent ? '#DC2626' : '#16A34A'} />
          <View>
            <Text className="font-bold text-sm" style={{ color: isUrgent ? '#DC2626' : '#16A34A' }}>
              {isUrgent ? 'Dibutuhkan Segera' : 'Tidak Mendesak'}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: isUrgent ? '#DC2626' : '#16A34A', opacity: 0.7 }}>
              {isUrgent ? 'Organisasi sangat membutuhkan bantuan ini' : 'Kebutuhan rutin atau tidak mendesak'}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {!isOwner ? (
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
              style={{ backgroundColor: Colors.orange }}
              onPress={() => Alert.alert('Info', 'Fitur minta donasi belum tersedia')}
            >
              <Heart size={18} color="white" fill="white" />
              <Text className="text-base font-bold text-white">Minta Donasi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: Colors.orange }}
          >
            <Text className="text-white font-bold text-base">Kelola Post</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}
