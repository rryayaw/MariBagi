import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native'
import { ClipboardList } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
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

  const handleHubungi = async (donorId: string, orgId: string) => {
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
                onSudahTerima={() => setSudahTerimaConfirm(r.id)}
                onHubungi={() => handleHubungi(r.donor_id, r.org_id)}
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
