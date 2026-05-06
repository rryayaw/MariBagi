import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Clock, AlertCircle, MessageCircle, Heart, Tag, X, ChevronRight } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { NeedDetail } from '@/types'
import { getRelativeTime } from '@/lib/utils'
import { ConfirmModal } from '@/components/ConfirmModal'

type MyDonation = {
  id: string
  title: string
  category: { name: string } | null
  pickup_method: 'pickup' | 'dropoff'
}

export default function NeedDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user, role } = useAuth()

  const [item, setItem] = useState<NeedDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingCount, setRatingCount] = useState(0)

  const [showPicker, setShowPicker] = useState(false)
  const [myDonations, setMyDonations] = useState<MyDonation[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [myRequestStatus, setMyRequestStatus] = useState<'available' | 'reserved' | null>(null)
  const [myRequestId, setMyRequestId] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const isDonor = role === 'donor'

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

      if (user) {
        const { data: req } = await supabase
          .from('requests')
          .select('id, status')
          .eq('donor_id', user.id)
          .eq('need_id', id)
          .neq('status', 'cancelled')
          .limit(1)
          .maybeSingle()
        if (req) {
          setMyRequestStatus(req.status as 'available' | 'reserved')
          setMyRequestId(req.id)
        }
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const openDonationPicker = async () => {
    if (!user) return
    setShowPicker(true)
    setPickerLoading(true)
    try {
      const { data } = await supabase
        .from('donations')
        .select('id, title, pickup_method, category:category_id(name)')
        .eq('donor_id', user.id)
        .eq('status', 'available')
      setMyDonations((data ?? []) as unknown as MyDonation[])
    } finally {
      setPickerLoading(false)
    }
  }

  const submitRequest = async (donationId: string) => {
    if (!user || !item) return
    setSubmitting(true)
    try {
      const { data: existing } = await supabase
        .from('requests')
        .select('id')
        .eq('donation_id', donationId)
        .eq('need_id', item.id)
        .not('status', 'eq', 'cancelled')
        .limit(1)

      if (existing && existing.length > 0) {
        Alert.alert('Info', 'Kamu sudah mengajukan donasi ini untuk kebutuhan tersebut.')
        setShowPicker(false)
        return
      }

      const { error } = await supabase.from('requests').insert({
        donation_id: donationId,
        need_id: item.id,
        donor_id: user.id,
        org_id: item.org_id,
        initiated: 'donor',
        status: 'available',
      })
      if (error) throw error

      setShowPicker(false)
      Alert.alert('Berhasil!', 'Penawaranmu telah dikirim ke organisasi. Tunggu konfirmasi mereka.')
    } catch (e) {
      Alert.alert('Gagal', String(e))
    } finally {
      setSubmitting(false)
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
    <>
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

        {/* Floating row */}
        <View className="flex-row mx-5 gap-3" style={{ marginTop: -20 }}>
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
          {isOwner ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: Colors.orange }}
            >
              <Text className="text-white font-bold text-base">Kelola Post</Text>
            </TouchableOpacity>
          ) : isDonor ? (
            item.status === 'fulfilled' || item.status === 'closed' ? (
              <View className="rounded-2xl py-4 items-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Text className="text-base font-bold text-text-muted">Sudah Terpenuhi</Text>
              </View>
            ) : myRequestStatus === 'reserved' ? (
              <View style={{ gap: 10 }}>
                <View className="rounded-2xl py-4 items-center" style={{ backgroundColor: '#D1FAE5' }}>
                  <Text className="text-base font-bold" style={{ color: '#059669' }}>Penawaranmu Diterima ✓</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCancelConfirm(true)}
                  className="rounded-2xl py-3 items-center"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Text className="text-sm font-bold" style={{ color: '#DC2626' }}>Batalkan Penawaran</Text>
                </TouchableOpacity>
              </View>
            ) : myRequestStatus === 'available' ? (
              <View>
                <View className="rounded-2xl py-4 items-center mb-3" style={{ backgroundColor: '#FEF3C7' }}>
                  <Text className="text-base font-bold" style={{ color: '#D97706' }}>Menunggu Konfirmasi...</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center gap-2 border-2 rounded-2xl py-3"
                  style={{ borderColor: Colors.textMuted }}
                  onPress={() => Alert.alert('Info', 'Fitur chat belum tersedia')}
                >
                  <MessageCircle size={16} color={Colors.textMuted} />
                  <Text className="text-sm font-bold text-text-muted">Hubungi Organisasi</Text>
                </TouchableOpacity>
              </View>
            ) : (
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
                  onPress={openDonationPicker}
                >
                  <Heart size={18} color="white" fill="white" />
                  <Text className="text-base font-bold text-white">Beri Donasi</Text>
                </TouchableOpacity>
              </View>
            )
          ) : null}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={cancelConfirm}
        title="Batalkan Penawaran?"
        message="Penawaran yang sudah diterima ini akan dibatalkan."
        confirmLabel="Batalkan"
        confirmColor="#DC2626"
        onCancel={() => setCancelConfirm(false)}
        onConfirm={async () => {
          setCancelConfirm(false)
          if (!myRequestId) return
          const { error } = await supabase.from('requests').update({ status: 'cancelled' }).eq('id', myRequestId)
          if (error) { Alert.alert('Gagal', error.message); return }
          setMyRequestStatus(null)
          setMyRequestId(null)
        }}
      />

      {/* Donation picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '72%' }}>

            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textDark }}>Pilih Donasi</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
              Pilih donasimu yang ingin ditawarkan untuk kebutuhan ini
            </Text>

            {pickerLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 30 }} />
            ) : myDonations.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>📦</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                  Kamu belum memiliki donasi yang tersedia.{'\n'}Buat donasi terlebih dahulu.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setShowPicker(false); router.push('/(tabs)/donation') }}
                  style={{ backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Buat Donasi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {myDonations.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    activeOpacity={0.8}
                    onPress={() => submitRequest(d.id)}
                    disabled={submitting}
                    style={{
                      backgroundColor: Colors.donorBg,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: Colors.textDark, fontSize: 15 }} numberOfLines={1}>
                        {d.title}
                      </Text>
                      <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 3 }}>
                        {d.category?.name} · {d.pickup_method === 'pickup' ? 'Bisa dijemput' : 'Diantar'}
                      </Text>
                    </View>
                    {submitting ? (
                      <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 12 }} />
                    ) : (
                      <ChevronRight size={18} color={Colors.primary} style={{ marginLeft: 12 }} />
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
