import { useState, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, TextInput
} from 'react-native'
import { ClipboardList, Star } from 'lucide-react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { notify } from '@/lib/notifications'
import { Colors } from '@/constants/colors'
import { Request } from '@/types'
import { RequestCard } from '@/components/RequestCard'
import { ConfirmModal } from '@/components/ConfirmModal'
import { EmptyState } from '@/components/EmptyState'

type TabType = 'all' | 'incoming' | 'outgoing'

export default function StatusScreen() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<TabType>('all')

  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const [tolakConfirm, setTolakConfirm] = useState<string | null>(null)
  const [terimaConfirm, setTerimaConfirm] = useState<string | null>(null)
  const [sudahKirimConfirm, setSudahKirimConfirm] = useState<string | null>(null)
  const [fulfillmentModal, setFulfillmentModal] = useState<{ requestId: string; needId: string } | null>(null)

  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())
  const [ratingTarget, setRatingTarget] = useState<Request | null>(null)
  const [ratingScore, setRatingScore] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const isOrg = role === 'organization'
  const accentColor = isOrg ? Colors.orange : Colors.primary

  const hubungiInFlight = useRef(false)
  const hasLoaded = useRef(false)

  const fetchRequests = useCallback(async () => {
    if (!user) return
    try {
      const col = isOrg ? 'org_id' : 'donor_id'
      const [{ data, error }, { data: ratedData }] = await Promise.all([
        supabase
          .from('requests')
          .select(`
            *,
            donation:donation_id(id, title, photo_url, category:category_id(name)),
            need:need_id(id, title, category:category_id(name)),
            donor:donor_id(id, full_name, prof_pic),
            org:org_id(id, full_name, prof_pic)
          `)
          .eq(col, user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('ratings')
          .select('request_id')
          .eq('rated_by', user.id),
      ])
      if (error) throw error
      setRequests((data ?? []) as unknown as Request[])
      setRatedIds(new Set((ratedData ?? []).map((r: any) => r.request_id as string)))
    } catch (e) {
      Alert.alert('Gagal memuat', String(e))
    }
  }, [user, isOrg])

  // Re-fetch every time the tab gains focus so the user always sees the latest
  // requests/status. Only the first load shows the full-screen spinner; later
  // visits refresh silently in the background to avoid a jarring spinner flash.
  useFocusEffect(
    useCallback(() => {
      if (hasLoaded.current) {
        fetchRequests()
      } else {
        setLoading(true)
        fetchRequests().finally(() => { setLoading(false); hasLoaded.current = true })
      }
    }, [fetchRequests])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRequests()
    setRefreshing(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', id)
      .select('id')
    if (error) { Alert.alert('Gagal', error.message); return }
    if (!data || data.length === 0) {
      Alert.alert('Gagal', 'Perubahan status tidak tersimpan. Periksa izin akses atau koneksimu.')
      return
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as Request['status'] } : r))
  }

  const submitRating = async () => {
    if (!ratingTarget || !user || ratingScore === 0) return
    setRatingSubmitting(true)
    const ratedEntity = isOrg ? ratingTarget.donor_id : ratingTarget.org_id
    const { error } = await supabase.from('ratings').insert({
      rated_by: user.id,
      rated_entity: ratedEntity,
      request_id: ratingTarget.id,
      score: ratingScore,
      comment: ratingComment.trim() || null,
    })
    setRatingSubmitting(false)
    if (error) { Alert.alert('Gagal mengirim nilai', error.message); return }
    setRatedIds(prev => new Set([...prev, ratingTarget.id]))
    setRatingTarget(null)
    setRatingScore(0)
    setRatingComment('')
    Alert.alert('Terima Kasih!', 'Penilaianmu telah dikirim.')
  }

  const handleSudahTerima = async (needStatus: 'fulfilled' | 'partially_fulfilled') => {
    if (!fulfillmentModal) return
    const { requestId, needId } = fulfillmentModal
    setFulfillmentModal(null)
    await updateStatus(requestId, 'completed')
    if (needId) await supabase.from('needs').update({ status: needStatus }).eq('id', needId)
    const r = requests.find(req => req.id === requestId)
    if (r) notify(r.donor_id, 'Donasi Diterima!', `"${(r as any).donation?.title ?? 'Donasi'}" telah diterima dengan baik.`, 'received', requestId)
  }

  const handleHubungi = async (donorId: string, orgId: string) => {
    if (hubungiInFlight.current) return
    hubungiInFlight.current = true
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('donor_id', donorId)
        .eq('org_id', orgId)
        .maybeSingle()

      if (existing) {
        router.push({ pathname: '/chat-detail', params: { id: existing.id } })
        return
      }

      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ donor_id: donorId, org_id: orgId })
        .select('id')
        .single()

      if (error || !created) { Alert.alert('Gagal membuka chat', String(error)); return }
      router.push({ pathname: '/chat-detail', params: { id: created.id } })
    } finally {
      hubungiInFlight.current = false
    }
  }

  const isIncoming = (r: Request) => isOrg ? r.initiated === 'donor' : r.initiated === 'org'

  const filtered = requests
    .filter(r => {
      if (tab === 'all') return true
      if (tab === 'incoming') return isIncoming(r)
      return !isIncoming(r)
    })
    .sort((a, b) => (a.status === 'cancelled' ? 1 : 0) - (b.status === 'cancelled' ? 1 : 0))

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'incoming', label: 'Masuk' },
    { key: 'outgoing', label: 'Keluar' },
  ]

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
      >
        <View className="px-5 pt-14">
          <Text className="text-2xl font-extrabold text-text-dark mb-1">Status</Text>
          <Text className="text-sm text-text-muted mb-6">Kelola permintaan donasi yang masuk dan keluar</Text>

          {/* Tabs */}
          <View className="flex-row gap-2 mb-6">
            {tabs.map(t => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                activeOpacity={0.8}
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: tab === t.key ? accentColor : 'white', borderWidth: 1, borderColor: tab === t.key ? accentColor : '#E5E7EB' }}
              >
                <Text className="text-sm font-semibold" style={{ color: tab === t.key ? 'white' : Colors.textMuted }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator color={accentColor} size="large" />
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={52} color={Colors.textLight} />}
              message={tab === 'all' ? 'Belum ada permintaan.' : tab === 'incoming' ? 'Tidak ada permintaan masuk.' : 'Tidak ada permintaan keluar.'}
            />
          ) : (
            filtered.map(r => (
              <RequestCard
                key={r.id}
                r={r}
                isOrg={isOrg}
                accentColor={accentColor}
                onPress={() => {
                  if (isOrg) router.push({ pathname: '/donation-detail', params: { id: r.donation_id } })
                  else router.push({ pathname: '/need-detail', params: { id: r.need_id } })
                }}
                onTolak={() => setTolakConfirm(r.id)}
                onTerima={() => setTerimaConfirm(r.id)}
                onCancel={() => setCancelConfirm(r.id)}
                onSudahKirim={() => setSudahKirimConfirm(r.id)}
                onSudahTerima={() => setFulfillmentModal({ requestId: r.id, needId: r.need_id })}
                onHubungi={() => handleHubungi(r.donor_id, r.org_id)}
                onBeriNilai={() => { setRatingTarget(r); setRatingScore(0); setRatingComment('') }}
                hasRated={ratedIds.has(r.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!cancelConfirm}
        title="Batalkan Permintaan?"
        message="Permintaan ini akan dibatalkan dan tidak bisa dikembalikan."
        confirmLabel="Batalkan"
        confirmColor="#DC2626"
        onCancel={() => setCancelConfirm(null)}
        onConfirm={() => { if (cancelConfirm) updateStatus(cancelConfirm, 'cancelled'); setCancelConfirm(null) }}
      />
      <ConfirmModal
        visible={!!tolakConfirm}
        title="Tolak Permintaan?"
        message="Permintaan ini akan ditolak dan tidak bisa dikembalikan."
        confirmLabel="Tolak"
        confirmColor="#DC2626"
        onCancel={() => setTolakConfirm(null)}
        onConfirm={async () => {
          const id = tolakConfirm
          setTolakConfirm(null)
          if (!id) return
          await updateStatus(id, 'cancelled')
          const r = requests.find(req => req.id === id)
          if (r) notify(r.donor_id, 'Permintaan Ditolak', `Permintaanmu untuk "${(r as any).donation?.title ?? 'donasi'}" ditolak.`, 'request_rejected', id)
        }}
      />
      <ConfirmModal
        visible={!!terimaConfirm}
        title="Terima Permintaan?"
        message="Kamu akan menerima permintaan donasi ini."
        confirmLabel="Terima"
        confirmColor="#059669"
        onCancel={() => setTerimaConfirm(null)}
        onConfirm={async () => {
          const id = terimaConfirm
          setTerimaConfirm(null)
          if (!id) return
          await updateStatus(id, 'reserved')
          const r = requests.find(req => req.id === id)
          if (r) notify(r.donor_id, 'Permintaan Diterima!', `Permintaanmu untuk "${(r as any).donation?.title ?? 'donasi'}" diterima.`, 'request_accepted', id)
        }}
      />
      <ConfirmModal
        visible={!!sudahKirimConfirm}
        title="Sudah Dikirim?"
        message="Konfirmasi bahwa kamu sudah mengirimkan barang donasi ini."
        confirmLabel="Sudah Dikirim"
        confirmColor={Colors.primary}
        onCancel={() => setSudahKirimConfirm(null)}
        onConfirm={async () => {
          const id = sudahKirimConfirm
          setSudahKirimConfirm(null)
          if (!id) return
          await updateStatus(id, 'shipping')
          const r = requests.find(req => req.id === id)
          if (r) notify(r.org_id, 'Barang Dalam Perjalanan', `Donatur sedang mengirimkan "${(r as any).donation?.title ?? 'donasi'}".`, 'shipped', id)
        }}
      />
      <Modal visible={!!ratingTarget} animationType="slide" transparent onRequestClose={() => setRatingTarget(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 }}>Beri Nilai</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              {isOrg ? ratingTarget?.donor?.full_name : ratingTarget?.org?.full_name}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRatingScore(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Star size={40} color="#F59E0B" fill={i <= ratingScore ? '#F59E0B' : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Tambahkan komentar (opsional)"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top', marginBottom: 20 }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setRatingTarget(null); setRatingScore(0); setRatingComment('') }}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#F3F4F6' }}
              >
                <Text style={{ fontWeight: '700', color: '#6B7280' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitRating}
                disabled={ratingScore === 0 || ratingSubmitting}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: ratingScore > 0 ? accentColor : '#D1D5DB' }}
              >
                {ratingSubmitting
                  ? <ActivityIndicator color="white" />
                  : <Text style={{ fontWeight: '700', color: 'white' }}>Kirim Nilai</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!fulfillmentModal} animationType="fade" transparent onRequestClose={() => setFulfillmentModal(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 8 }}>Barang Diterima?</Text>
            <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 }}>
              Apakah kebutuhan ini sudah terpenuhi sepenuhnya?
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSudahTerima('fulfilled')}
              style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#D1FAE5', marginBottom: 10 }}
            >
              <Text style={{ fontWeight: '700', color: '#059669' }}>Terpenuhi Penuh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSudahTerima('partially_fulfilled')}
              style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#FEF3C7', marginBottom: 10 }}
            >
              <Text style={{ fontWeight: '700', color: '#D97706' }}>Sebagian Terpenuhi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFulfillmentModal(null)}
              style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}
