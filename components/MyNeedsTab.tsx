import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { ClipboardList } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { ConfirmModal } from '@/components/ConfirmModal'
import { EmptyState } from '@/components/EmptyState'
import { NEED_STATUS_LABEL, NEED_STATUS_BG, NEED_STATUS_COLOR } from '@/lib/statusConstants'

type MyNeed = {
  id: string
  title: string
  status: 'open' | 'partially_fulfilled' | 'fulfilled' | 'closed'
  urgency: 'normal' | 'urgent'
  created_at: string
  category: { name: string } | null
}

export function MyNeedsTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [needs, setNeeds] = useState<MyNeed[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchNeeds() }, [])

  const fetchNeeds = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('needs')
        .select('id, title, status, urgency, created_at, category:category_id(name)')
        .eq('org_id', user.id)
        .order('created_at', { ascending: false })
      setNeeds((data ?? []) as unknown as MyNeed[])
    } finally {
      setLoading(false)
    }
  }

  const deleteNeed = async (id: string) => {
    const { error } = await supabase.from('needs').update({ status: 'closed' }).eq('id', id)
    if (error) { Alert.alert('Gagal', error.message); return }
    setNeeds(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}>
        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.orange} />
          </View>
        ) : needs.length === 0 ? (
          <EmptyState icon={<ClipboardList size={48} color={Colors.textLight} />} message="Kamu belum membuat kebutuhan apapun." />
        ) : (
          needs.map(need => (
            <TouchableOpacity
              key={need.id}
              activeOpacity={(need.status === 'open' || need.status === 'partially_fulfilled') ? 0.8 : 1}
              onPress={() => (need.status === 'open' || need.status === 'partially_fulfilled') && router.push({ pathname: '/(edit)/edit-need-post', params: { id: need.id } })}
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', color: Colors.textDark, fontSize: 14, flex: 1, marginRight: 12 }} numberOfLines={2}>
                  {need.title}
                </Text>
                <View style={{ backgroundColor: NEED_STATUS_BG[need.status], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: NEED_STATUS_COLOR[need.status] }}>
                    {NEED_STATUS_LABEL[need.status]}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>
                {need.category?.name} · {need.urgency === 'urgent' ? '🚨 Mendesak' : '📋 Normal'}
              </Text>
              {(need.status === 'open' || need.status === 'partially_fulfilled') && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeleteConfirm(need.id)}
                  style={{ backgroundColor: '#FEE2E2', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#DC2626' }}>Hapus Post</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!deleteConfirm}
        title="Hapus Kebutuhan?"
        message="Post kebutuhan ini akan dihapus dan tidak bisa dikembalikan."
        confirmLabel="Hapus"
        confirmColor="#DC2626"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) deleteNeed(deleteConfirm); setDeleteConfirm(null) }}
      />
    </>
  )
}
