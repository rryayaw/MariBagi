import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { MessageCircle } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/EmptyState'

type Conversation = {
  id: string
  donor_id: string
  org_id: string
  last_message_at: string | null
  created_at: string
  donor: { full_name: string; prof_pic: string } | null
  org: { full_name: string; prof_pic: string } | null
}

export default function ChatScreen() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isDonor = role === 'donor'
  const accentColor = isDonor ? Colors.primary : Colors.orange

  const fetchConversations = useCallback(async () => {
    if (!user) return
    const col = isDonor ? 'donor_id' : 'org_id'
    const { data } = await supabase
      .from('conversations')
      .select('*, donor:donor_id(full_name, prof_pic), org:org_id(full_name, prof_pic)')
      .eq(col, user.id)
      .order('last_message_at', { ascending: false })
    setConversations((data ?? []) as unknown as Conversation[])
  }, [user, isDonor])

  useEffect(() => {
    setLoading(true)
    fetchConversations().finally(() => setLoading(false))

    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchConversations])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchConversations()
    setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textDark, marginBottom: 4 }}>Chat</Text>
        <Text style={{ fontSize: 14, color: Colors.textMuted }}>
          Percakapan dengan {isDonor ? 'organisasi' : 'donatur'}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accentColor} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={52} color={Colors.textLight} />}
              message={`Belum ada percakapan.\nMulai dari halaman Status.`}
            />
          }
          renderItem={({ item: c }) => {
            const other = isDonor ? c.org : c.donor
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/chat-detail', params: { id: c.id } })}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: 'white', borderRadius: 20, padding: 14, marginBottom: 10,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 26, overflow: 'hidden', flexShrink: 0 }}>
                  {other?.prof_pic ? (
                    <Image source={{ uri: other.prof_pic }} style={{ width: 52, height: 52 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 52, height: 52, backgroundColor: isDonor ? Colors.orgBg : Colors.donorBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 22 }}>{isDonor ? '🏢' : '👤'}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: Colors.textDark }} numberOfLines={1}>
                    {other?.full_name ?? '—'}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    {c.last_message_at ? formatDate(c.last_message_at) : 'Belum ada pesan'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}
