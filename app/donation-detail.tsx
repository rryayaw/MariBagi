import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Clock, AlertCircle, MessageCircle, Heart, Share2, X, ChevronRight } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { DonationDetail } from '@/types'

type MyNeed = {
  id: string
  title: string
  category: { name: string } | null
  urgency: 'normal' | 'urgent'
}

export default function DonationDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user, role } = useAuth()

  const [item, setItem] = useState<DonationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingCount, setRatingCount] = useState(0)

  const [showPicker, setShowPicker] = useState(false)
  const [myNeeds, setMyNeeds] = useState<MyNeed[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isOrg = role === 'organization'

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
        .from('donations')
        .select('*, donor:donor_id(full_name, prof_pic, address, latitude, longitude, avg_rating), category:category_id(name)')
        .eq('id', id)
        .single()

      if (err) throw err
      setItem(data as DonationDetail)

      const { count } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('rated_entity', data.donor_id)
      setRatingCount(count ?? 0)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const openNeedPicker = async () => {
    if (!user) return
    setShowPicker(true)
    setPickerLoading(true)
    try {
      const { data } = await supabase
        .from('needs')
        .select('id, title, urgency, category:category_id(name)')
        .eq('org_id', user.id)
        .in('status', ['open', 'partially_fulfilled'])
      setMyNeeds((data ?? []) as unknown as MyNeed[])
    } finally {
      setPickerLoading(false)
    }
  }

  const submitRequest = async (needId: string) => {
    if (!user || !item) return
    setSubmitting(true)
    try {
      const { data: existing } = await supabase
        .from('requests')
        .select('id')
        .eq('donation_id', item.id)
        .eq('need_id', needId)
        .not('status', 'eq', 'cancelled')
        .limit(1)

      if (existing && existing.length > 0) {
        Alert.alert('Info', 'Permintaan untuk kombinasi donasi dan kebutuhan ini sudah ada.')
        setShowPicker(false)
        return
      }

      const { error } = await supabase.from('requests').insert({
        donation_id: item.id,
        need_id: needId,
        donor_id: item.donor_id,
        org_id: user.id,
        initiated: 'org',
        status: 'available',
      })
      if (error) throw error

      setShowPicker(false)
      Alert.alert('Berhasil!', 'Permintaanmu telah dikirim ke donatur. Tunggu konfirmasi mereka.')
    } catch (e) {
      Alert.alert('Gagal', String(e))
    } finally {
      setSubmitting(false)
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
          <TouchableOpacity onPress={fetchItem} className="mt-6 px-6 py-3 rounded-2xl" style={{ backgroundColor: Colors.primary }}>
            <Text className="text-white font-semibold">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const donor = item.donor
  const isOwner = user?.id === item.donor_id
  const ratingLabel = ratingCount === 0
    ? 'Pengguna Baru'
    : `⭐ ${donor.avg_rating?.toFixed(1)}  (${ratingCount} ulasan)`

  return (
    <>
      <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 50 }}>

        {/* Photo / placeholder */}
        <View style={{ height: 260 }}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: 260, backgroundColor: Colors.donorBg }} className="items-center justify-center">
              {donor?.prof_pic ? (
                <Image source={{ uri: donor.prof_pic }} style={{ width: 96, height: 96, borderRadius: 48 }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 64 }}>🎁</Text>
              )}
            </View>
          )}

          {/* Back + Share overlay */}
          <View className="absolute top-12 left-0 right-0 px-5 flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/90 rounded-full p-2"
              style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 }}
            >
              <ArrowLeft size={22} color={Colors.textDark} />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white/90 rounded-full p-2"
              style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 }}
            >
              <Share2 size={22} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Badge */}
          <View className="absolute bottom-3 left-4">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: Colors.donorBg }}>
              <Text className="text-xs font-bold" style={{ color: Colors.primary }}>Donasi</Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-5">
          <Text className="text-3xl font-bold text-text-dark mb-1">{item.title}</Text>

          <View className="flex-row items-center gap-1 mb-1">
            <Text className="text-sm font-semibold text-text-muted">{donor?.full_name}</Text>
            <Text className="text-text-light"> · </Text>
            <MapPin size={12} color={Colors.textMuted} />
            <Text className="text-xs text-text-muted">1.2 km</Text>
          </View>
          <Text className="text-xs text-text-light mb-6">{ratingLabel}</Text>

          {/* Description */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-sm leading-relaxed text-text-dark">{item.description}</Text>
          </View>

          {/* Pickup method */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-bold text-text-dark mb-3">Metode Pengambilan</Text>
            <View className="flex-row items-start gap-3">
              <Text className="text-xl">{item.pickup_method === 'pickup' ? '🚗' : '📦'}</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text-dark">
                  {item.pickup_method === 'pickup' ? 'Antar langsung atau jemput oleh kami' : 'Diantar ke lokasi organisasi'}
                </Text>
                {donor?.address ? (
                  <Text className="text-xs text-text-muted mt-1">{donor.address}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Posted time */}
          <View className="flex-row items-center gap-2 mb-6">
            <Clock size={12} color={Colors.textLight} />
            <Text className="text-xs text-text-light">Diposting {getRelativeTime(item.created_at)}</Text>
          </View>

          {/* Action buttons */}
          {isOwner ? (
            <TouchableOpacity activeOpacity={0.8} className="rounded-2xl py-4 items-center" style={{ backgroundColor: Colors.primary }}>
              <Text className="text-white font-bold text-base">Kelola Post</Text>
            </TouchableOpacity>
          ) : isOrg ? (
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
                style={{ backgroundColor: Colors.primary }}
                onPress={openNeedPicker}
              >
                <Heart size={18} color="white" fill="white" />
                <Text className="text-base font-bold text-white">Minta Donasi</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Need picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '72%' }}>

            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textDark }}>Pilih Kebutuhan</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
              Pilih kebutuhan yang bisa dipenuhi oleh donasi ini
            </Text>

            {pickerLoading ? (
              <ActivityIndicator color={Colors.orange} style={{ marginVertical: 30 }} />
            ) : myNeeds.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                  Organisasimu belum memiliki kebutuhan terbuka.{'\n'}Buat kebutuhan terlebih dahulu.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {myNeeds.map(n => (
                  <TouchableOpacity
                    key={n.id}
                    activeOpacity={0.8}
                    onPress={() => submitRequest(n.id)}
                    disabled={submitting}
                    style={{
                      backgroundColor: Colors.orgBg,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: Colors.textDark, fontSize: 15 }} numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 3 }}>
                        {n.category?.name} · {n.urgency === 'urgent' ? '🚨 Mendesak' : '📋 Normal'}
                      </Text>
                    </View>
                    {submitting ? (
                      <ActivityIndicator size="small" color={Colors.orange} style={{ marginLeft: 12 }} />
                    ) : (
                      <ChevronRight size={18} color={Colors.orange} style={{ marginLeft: 12 }} />
                    )}
                  </TouchableOpacity>
                ))}
                <View style={{ height: 16 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  )
}
