import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, RefreshControl, Modal
} from 'react-native'
import { ClipboardList } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { Request } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  available: 'Menunggu',
  reserved: 'Diterima',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  available: '#F59E0B',
  reserved: '#10B981',
  completed: '#6366F1',
  cancelled: '#9CA3AF',
}

type TabType = 'all' | 'incoming' | 'outgoing'

export default function StatusScreen() {
  const { user, role } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<TabType>('all')
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const [tolakConfirm, setTolakConfirm] = useState<string | null>(null)
  const [terimaConfirm, setTerimaConfirm] = useState<string | null>(null)

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

  const isIncoming = (r: Request) =>
    isOrg ? r.initiated === 'donor' : r.initiated === 'org'

  const filtered = requests
    .filter(r => {
      if (tab === 'all') return true
      if (tab === 'incoming') return isIncoming(r)
      return !isIncoming(r)
    })
    .sort((a, b) => {
      const aCancelled = a.status === 'cancelled' ? 1 : 0
      const bCancelled = b.status === 'cancelled' ? 1 : 0
      return aCancelled - bCancelled
    })

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

        {/* Header */}
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
              style={{
                backgroundColor: tab === t.key ? accentColor : 'white',
                borderWidth: 1,
                borderColor: tab === t.key ? accentColor : '#E5E7EB',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: tab === t.key ? 'white' : Colors.textMuted }}
              >
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
            const otherName = isOrg ? r.donor?.full_name : r.org?.full_name
            const otherPic = isOrg ? r.donor?.prof_pic : r.org?.prof_pic
            const otherEmoji = isOrg ? '👤' : '🏢'
            const otherBg = isOrg ? Colors.donorBg : Colors.orgBg

            return (
              <View
                key={r.id}
                className="bg-white rounded-2xl mb-3 p-4"
                style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
              >
                {/* Top row: avatar + other party + status */}
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="rounded-xl overflow-hidden" style={{ width: 46, height: 46 }}>
                    {otherPic ? (
                      <Image source={{ uri: otherPic }} style={{ width: 46, height: 46 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 46, height: 46, backgroundColor: otherBg }} className="items-center justify-center">
                        <Text style={{ fontSize: 20 }}>{otherEmoji}</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-0.5">
                      {incoming ? '📥 Permintaan Masuk' : '📤 Permintaan Keluar'}
                    </Text>
                    <Text className="font-bold text-text-dark text-sm" numberOfLines={1}>{otherName}</Text>
                  </View>

                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[r.status] + '22' }}
                  >
                    <Text className="text-xs font-bold" style={{ color: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </Text>
                  </View>
                </View>

                {/* Donation + Need summary */}
                <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: '#F9F9F7' }}>
                  <View className="flex-row gap-2 mb-2">
                    <Text className="text-xs font-bold text-text-light w-16">DONASI</Text>
                    <Text className="text-xs font-semibold text-text-dark flex-1" numberOfLines={1}>
                      {r.donation?.title ?? '—'}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#EDEDED', marginBottom: 8 }} />
                  <View className="flex-row gap-2">
                    <Text className="text-xs font-bold text-text-light w-16">KEBUTUHAN</Text>
                    <Text className="text-xs font-semibold text-text-dark flex-1" numberOfLines={1}>
                      {r.need?.title ?? '—'}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {r.status === 'available' && incoming && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{ backgroundColor: '#FEE2E2' }}
                      onPress={() => setTolakConfirm(r.id)}
                    >
                      <Text className="font-bold text-sm" style={{ color: '#DC2626' }}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{ backgroundColor: '#D1FAE5' }}
                      onPress={() => setTerimaConfirm(r.id)}
                    >
                      <Text className="font-bold text-sm" style={{ color: '#059669' }}>Terima</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {r.status === 'available' && !incoming && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="py-3 rounded-xl items-center"
                    style={{ backgroundColor: '#FEE2E2' }}
                    onPress={() => setCancelConfirm(r.id)}
                  >
                    <Text className="font-bold text-sm" style={{ color: '#DC2626' }}>Batalkan</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })
        )}
      </View>
    </ScrollView>

    {/* Cancel confirm modal */}

    <Modal visible={!!cancelConfirm} transparent animationType="fade" onRequestClose={() => setCancelConfirm(null)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 8 }}>
            Batalkan Permintaan?
          </Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 }}>
            Permintaan ini akan dibatalkan dan tidak bisa dikembalikan.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCancelConfirm(null)}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>Tidak</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (cancelConfirm) updateStatus(cancelConfirm, 'cancelled')
                setCancelConfirm(null)
              }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#DC2626' }}
            >
              <Text style={{ fontWeight: '700', color: 'white' }}>Batalkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Tolak confirm modal */}
    <Modal visible={!!tolakConfirm} transparent animationType="fade" onRequestClose={() => setTolakConfirm(null)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 8 }}>Tolak Permintaan?</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 }}>
            Permintaan ini akan ditolak dan tidak bisa dikembalikan.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTolakConfirm(null)}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { if (tolakConfirm) updateStatus(tolakConfirm, 'cancelled'); setTolakConfirm(null) }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#DC2626' }}
            >
              <Text style={{ fontWeight: '700', color: 'white' }}>Tolak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Terima confirm modal */}
    <Modal visible={!!terimaConfirm} transparent animationType="fade" onRequestClose={() => setTerimaConfirm(null)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 8 }}>Terima Permintaan?</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 }}>
            Kamu akan menerima permintaan donasi ini.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTerimaConfirm(null)}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { if (terimaConfirm) updateStatus(terimaConfirm, 'reserved'); setTerimaConfirm(null) }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#059669' }}
            >
              <Text style={{ fontWeight: '700', color: 'white' }}>Terima</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  )
}
