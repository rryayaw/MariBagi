import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import {
  ArrowLeft, Bell, MessageCircle, Package,
  CheckCircle, XCircle, Truck, Gift,
} from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { getRelativeTime } from '@/lib/utils'

type Notification = {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  reference_id: string | null
  created_at: string
}

const ICON_MAP: Record<string, { Icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string }> = {
  message:          { Icon: MessageCircle, color: Colors.primary,  bg: Colors.donorBg },
  request_in:       { Icon: Package,       color: '#F59E0B',       bg: '#FEF3C7' },
  request_accepted: { Icon: CheckCircle,   color: '#10B981',       bg: '#D1FAE5' },
  request_rejected: { Icon: XCircle,       color: '#EF4444',       bg: '#FEE2E2' },
  shipped:          { Icon: Truck,         color: Colors.primary,  bg: Colors.donorBg },
  received:         { Icon: Gift,          color: '#10B981',       bg: '#D1FAE5' },
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const accentColor = role === 'donor' ? Colors.primary : Colors.orange

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setNotifications((data ?? []) as Notification[])
  }, [user])

  useEffect(() => {
    setLoading(true)
    fetchNotifications().finally(() => setLoading(false))

    const channel = supabase
      .channel(`notifs:${user?.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        ({ new: n }) => setNotifications(prev => [n as Notification, ...prev])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  const handlePress = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.type === 'message' && n.reference_id) {
      router.push({ pathname: '/chat-detail', params: { id: n.reference_id } })
    } else if (n.type !== 'general') {
      router.push('/(tabs)/status')
    }
  }

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontWeight: '700', fontSize: 16, color: Colors.textDark }}>Notifikasi</Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: accentColor }}>Tandai dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Bell size={48} color={Colors.textLight} />
              <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 16, textAlign: 'center' }}>
                Belum ada notifikasi.
              </Text>
            </View>
          }
          renderItem={({ item: n }) => {
            const meta = ICON_MAP[n.type] ?? { Icon: Bell, color: Colors.textMuted, bg: '#F3F4F6' }
            const { Icon } = meta
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePress(n)}
                style={{
                  flexDirection: 'row', gap: 12, padding: 14,
                  backgroundColor: n.is_read ? 'white' : '#F0F9FF',
                  borderRadius: 16,
                  borderLeftWidth: n.is_read ? 0 : 3,
                  borderLeftColor: accentColor,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontWeight: n.is_read ? '600' : '700', fontSize: 14, color: Colors.textDark }}>
                    {n.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.textMuted, lineHeight: 18 }} numberOfLines={2}>
                    {n.body}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.textLight, marginTop: 2 }}>
                    {getRelativeTime(n.created_at)}
                  </Text>
                </View>
                {!n.is_read && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor, marginTop: 4, flexShrink: 0 }} />
                )}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}
