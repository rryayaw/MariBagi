import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, RefreshControl, Modal
} from 'react-native'
import { ClipboardList, Clock, Package, Truck, Star, CheckCircle, MessageCircle } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { Request } from '@/types'

type TabType = 'all' | 'incoming' | 'outgoing'

const STATUS_LABEL: Record<string, string> = {
  available: 'Menunggu',
  reserved: 'Disetujui',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  available: '#F59E0B',
  reserved: '#3B82F6',
  completed: '#10B981',
  cancelled: '#9CA3AF',
}

const STATUS_BG: Record<string, string> = {
  available: '#FEF3C7',
  reserved: '#EFF6FF',
  completed: '#D1FAE5',
  cancelled: '#F3F4F6',
}

const STEPS = [
  { label: 'Menunggu', Icon: Clock },
  { label: 'Disetujui', Icon: Package },
  { label: 'Pengiriman', Icon: Truck },
  { label: 'Selesai', Icon: Star },
]

function getStepIndex(status: string) {
  if (status === 'available') return 0
  if (status === 'reserved') return 1
  if (status === 'completed') return 3
  return -1
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProgressBar({ stepIndex, accentColor }: { stepIndex: number; accentColor: string }) {
  return (
    <View style={{ marginTop: 14, marginBottom: 2, marginHorizontal: -16 }}>
      <View style={{ flexDirection: 'row' }}>
        {STEPS.map((step, i) => {
          const filled = stepIndex >= 0 && i <= stepIndex
          const leftActive = stepIndex >= 0 && i <= stepIndex
          const rightActive = stepIndex >= 0 && i < stepIndex
          const { Icon } = step
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {/* Left half-line */}
              {i > 0 && (
                <View style={{ position: 'absolute', left: 0, right: '50%', top: 16, height: 2, backgroundColor: leftActive ? accentColor : '#E5E7EB' }} />
              )}
              {/* Right half-line */}
              {i < 3 && (
                <View style={{ position: 'absolute', left: '50%', right: 0, top: 16, height: 2, backgroundColor: rightActive ? accentColor : '#E5E7EB' }} />
              )}
              {/* Node */}
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: filled ? accentColor : '#E5E7EB', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Icon size={14} color={filled ? 'white' : '#9CA3AF'} />
              </View>
              <Text style={{ fontSize: 8, marginTop: 4, color: filled ? accentColor : '#9CA3AF', fontWeight: filled ? '700' : '400' }}>
                {step.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function ConfirmModal({
  visible, title, message, confirmLabel, confirmColor, onCancel, onConfirm,
}: {
  visible: boolean; title: string; message: string
  confirmLabel: string; confirmColor: string
  onCancel: () => void; onConfirm: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={onCancel} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F3F4F6' }}>
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={onConfirm} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: confirmColor }}>
              <Text style={{ fontWeight: '700', color: 'white' }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

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
  const [sudahTerimaConfirm, setSudahTerimaConfirm] = useState<string | null>(null)

  const isOrg = role === 'organization'
  const accentColor = isOrg ? Colors.orange : Colors.primary

  const fetchRequests = useCallback(async () => {
    if (!user) return
    try {
      const col = isOrg ? 'org_id' : 'donor_id'
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          donation:donation_id(id, title, photo_url, category:category_id(name)),
          need:need_id(id, title, category:category_id(name)),
          donor:donor_id(id, full_name, prof_pic),
          org:org_id(id, full_name, prof_pic)
        `)
        .eq(col, user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequests((data ?? []) as unknown as Request[])
    } catch (e) {
      Alert.alert('Gagal memuat', String(e))
    }
  }, [user, isOrg])

  useEffect(() => {
    setLoading(true)
    fetchRequests().finally(() => setLoading(false))
  }, [fetchRequests])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRequests()
    setRefreshing(false)
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('requests').update({ status }).eq('id', id)
    if (error) { Alert.alert('Gagal', String(error)); return }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as Request['status'] } : r))
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
            <View className="py-20 items-center">
              <ClipboardList size={52} color={Colors.textLight} />
              <Text className="text-text-muted text-sm mt-4 text-center">
                {tab === 'all' ? 'Belum ada permintaan.' : tab === 'incoming' ? 'Tidak ada permintaan masuk.' : 'Tidak ada permintaan keluar.'}
              </Text>
            </View>
          ) : (
            filtered.map(r => {
              const incoming = isIncoming(r)
              const cancelled = r.status === 'cancelled'
              const stepIndex = getStepIndex(r.status)

              const imageUri = isOrg ? r.donation?.photo_url : r.org?.prof_pic
              const fallbackEmoji = isOrg ? '🎁' : '🏢'
              const fallbackBg = isOrg ? Colors.donorBg : Colors.orgBg
              const mainTitle = isOrg ? r.donation?.title : r.need?.title
              const partyName = isOrg ? r.donor?.full_name : r.org?.full_name
              const subLabel = isOrg
                ? `Untuk: ${r.need?.title ?? '—'}`
                : `Donasimu: ${r.donation?.title ?? '—'}`

              return (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.92}
                  onPress={() => {
                    if (isOrg) router.push({ pathname: '/donation-detail', params: { id: r.donation_id } })
                    else router.push({ pathname: '/need-detail', params: { id: r.need_id } })
                  }}
                  style={{
                    backgroundColor: 'white', borderRadius: 20, marginBottom: 12, padding: 16,
                    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                    opacity: cancelled ? 0.65 : 1,
                  }}
                >
                  {/* Top row */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 64, height: 64, backgroundColor: fallbackBg, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 26 }}>{fallbackEmoji}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.textDark }} numberOfLines={1}>{mainTitle}</Text>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }} numberOfLines={1}>{partyName}</Text>
                      <Text style={{ fontSize: 11, color: Colors.textLight }} numberOfLines={1}>{subLabel}</Text>
                    </View>

                    {/* Badge */}
                    <View style={{ backgroundColor: STATUS_BG[r.status], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      {r.status === 'available' && <Clock size={10} color={STATUS_COLOR[r.status]} />}
                      {(r.status === 'reserved' || r.status === 'completed') && <CheckCircle size={10} color={STATUS_COLOR[r.status]} />}
                      <Text style={{ fontSize: 11, fontWeight: '700', color: STATUS_COLOR[r.status] }}>
                        {STATUS_LABEL[r.status]}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  {!cancelled && <ProgressBar stepIndex={stepIndex} accentColor={accentColor} />}

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginTop: cancelled ? 14 : 10, marginBottom: 12 }} />

                  {/* Footer: date + actions */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: Colors.textLight }}>{formatDate(r.created_at)}</Text>

                    <View style={{ flexDirection: 'row', gap: 8 }}>

                      {/* available + incoming → Tolak + Terima */}
                      {r.status === 'available' && incoming && (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setTolakConfirm(r.id)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEE2E2' }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Tolak</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setTerimaConfirm(r.id)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#D1FAE5' }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>Terima</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* available + outgoing → Batalkan */}
                      {r.status === 'available' && !incoming && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setCancelConfirm(r.id)}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEE2E2' }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Batalkan</Text>
                        </TouchableOpacity>
                      )}

                      {/* reserved → secondary action + Hubungi */}
                      {r.status === 'reserved' && (
                        <>
                          {isOrg ? (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => setSudahTerimaConfirm(r.id)}
                              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.orgBg, borderWidth: 1, borderColor: Colors.orange }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.orange }}>Diterima</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => setSudahKirimConfirm(r.id)}
                              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.donorBg, borderWidth: 1, borderColor: Colors.primary }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>Sudah Dikirim</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <MessageCircle size={12} color={Colors.textMuted} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textMuted }}>Hubungi</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* completed → Beri Nilai */}
                      {r.status === 'completed' && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEF3C7', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <Star size={12} color="#F59E0B" fill="#F59E0B" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>Beri Nilai</Text>
                        </TouchableOpacity>
                      )}

                    </View>
                  </View>
                </TouchableOpacity>
              )
            })
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
        onConfirm={() => { if (tolakConfirm) updateStatus(tolakConfirm, 'cancelled'); setTolakConfirm(null) }}
      />
      <ConfirmModal
        visible={!!terimaConfirm}
        title="Terima Permintaan?"
        message="Kamu akan menerima permintaan donasi ini."
        confirmLabel="Terima"
        confirmColor="#059669"
        onCancel={() => setTerimaConfirm(null)}
        onConfirm={() => { if (terimaConfirm) updateStatus(terimaConfirm, 'reserved'); setTerimaConfirm(null) }}
      />
      <ConfirmModal
        visible={!!sudahKirimConfirm}
        title="Sudah Dikirim?"
        message="Konfirmasi bahwa kamu sudah mengirimkan barang donasi ini."
        confirmLabel="Sudah Dikirim"
        confirmColor={Colors.primary}
        onCancel={() => setSudahKirimConfirm(null)}
        onConfirm={() => { if (sudahKirimConfirm) updateStatus(sudahKirimConfirm, 'completed'); setSudahKirimConfirm(null) }}
      />
      <ConfirmModal
        visible={!!sudahTerimaConfirm}
        title="Barang Diterima?"
        message="Konfirmasi bahwa kamu sudah menerima barang donasi ini."
        confirmLabel="Diterima"
        confirmColor={Colors.orange}
        onCancel={() => setSudahTerimaConfirm(null)}
        onConfirm={() => { if (sudahTerimaConfirm) updateStatus(sudahTerimaConfirm, 'completed'); setSudahTerimaConfirm(null) }}
      />
    </>
  )
}
