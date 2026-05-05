import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { ConfirmModal } from '@/components/ConfirmModal'

type MyPost = {
  id: string
  title: string
  status: 'available' | 'reserved' | 'completed' | 'cancelled'
  created_at: string
  pickup_method: 'pickup' | 'dropoff'
  photo_url: string | null
  category: { name: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Tersedia',
  reserved: 'Dipesan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_BG: Record<string, string> = {
  available: '#D1FAE5',
  reserved: '#FEF3C7',
  completed: '#EDE9FE',
  cancelled: '#F3F4F6',
}

const STATUS_COLOR: Record<string, string> = {
  available: '#059669',
  reserved: '#D97706',
  completed: '#7C3AED',
  cancelled: '#9CA3AF',
}

export function MyDonationsTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<MyPost[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('donations')
        .select('id, title, status, created_at, pickup_method, photo_url, category:category_id(name)')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false })
      setPosts((data ?? []) as unknown as MyPost[])
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('donations').update({ status: 'cancelled' }).eq('id', id)
    if (error) { Alert.alert('Gagal', error.message); return }
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}>
        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              Kamu belum membuat donasi apapun.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {posts.map(post => (
              <TouchableOpacity
                key={post.id}
                activeOpacity={post.status === 'available' ? 0.8 : 1}
                onPress={() => post.status === 'available' && router.push({ pathname: '/(edit)/edit-donation-post', params: { id: post.id } })}
                style={{
                  width: '47%',
                  backgroundColor: 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {post.photo_url ? (
                  <Image source={{ uri: post.photo_url }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: 120, backgroundColor: Colors.donorBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 36 }}>🎁</Text>
                  </View>
                )}
                <View style={{ padding: 10 }}>
                  <Text style={{ fontWeight: '700', color: Colors.textDark, fontSize: 13, marginBottom: 4 }} numberOfLines={1}>
                    {post.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 8 }} numberOfLines={1}>
                    {post.category?.name} · {post.pickup_method === 'pickup' ? 'Jemput' : 'Antar'}
                  </Text>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: STATUS_BG[post.status], paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, marginBottom: post.status === 'available' ? 8 : 0 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: STATUS_COLOR[post.status] }}>
                      {STATUS_LABEL[post.status]}
                    </Text>
                  </View>
                  {post.status === 'available' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setDeleteConfirm(post.id)}
                      style={{ paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#FEE2E2' }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 12, color: '#DC2626' }}>Hapus</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!deleteConfirm}
        title="Hapus Donasi?"
        message="Post donasi ini akan dihapus dan tidak bisa dikembalikan."
        confirmLabel="Hapus"
        confirmColor="#DC2626"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) deletePost(deleteConfirm); setDeleteConfirm(null) }}
      />
    </>
  )
}
