import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Send } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  is_read: boolean
  created_at: string
}

type Conversation = {
  id: string
  donor_id: string
  org_id: string
  donor: { full_name: string; prof_pic: string } | null
  org: { full_name: string; prof_pic: string } | null
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user, role } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  const isDonor = role === 'donor'
  const accentColor = isDonor ? Colors.primary : Colors.orange

  const fetchAll = useCallback(async () => {
    if (!id || !user) return
    const [{ data: conv }, { data: msgs }] = await Promise.all([
      supabase
        .from('conversations')
        .select('*, donor:donor_id(full_name, prof_pic), org:org_id(full_name, prof_pic)')
        .eq('id', id)
        .single(),
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true }),
    ])
    if (conv) setConversation(conv as unknown as Conversation)
    if (msgs) setMessages(msgs as Message[])

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', id)
      .neq('sender_id', user.id)
      .eq('is_read', false)
  }, [id, user])

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message])
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll, id])

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending || !user) return
    setSending(true)
    setText('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      text: trimmed,
    })
    if (error) setText(trimmed)
    setSending(false)
  }

  const otherParty = conversation ? (isDonor ? conversation.org : conversation.donor) : null

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}>
          {otherParty?.prof_pic ? (
            <Image source={{ uri: otherParty.prof_pic }} style={{ width: 40, height: 40 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 40, height: 40, backgroundColor: isDonor ? Colors.orgBg : Colors.donorBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>{isDonor ? '🏢' : '👤'}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontWeight: '700', fontSize: 16, color: Colors.textDark, flex: 1 }} numberOfLines={1}>
          {otherParty?.full_name ?? '...'}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{
            padding: 16, gap: 8, flexGrow: 1,
            justifyContent: messages.length === 0 ? 'center' : 'flex-start',
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              Belum ada pesan. Mulai percakapan!
            </Text>
          }
          renderItem={({ item: m }) => {
            const isMine = m.sender_id === user?.id
            return (
              <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                <View style={{
                  maxWidth: '75%',
                  backgroundColor: isMine ? accentColor : 'white',
                  borderRadius: 18,
                  borderBottomRightRadius: isMine ? 4 : 18,
                  borderBottomLeftRadius: isMine ? 18 : 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
                }}>
                  <Text style={{ color: isMine ? 'white' : Colors.textDark, fontSize: 14, lineHeight: 20 }}>
                    {m.text}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: Colors.textLight, marginTop: 3, marginHorizontal: 4 }}>
                  {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )
          }}
        />
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: 'white',
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
      }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ketik pesan..."
          placeholderTextColor={Colors.textLight}
          multiline
          style={{
            flex: 1, backgroundColor: Colors.bg, borderRadius: 22,
            paddingHorizontal: 16, paddingVertical: 10,
            fontSize: 14, color: Colors.textDark, maxHeight: 120,
          }}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: text.trim() ? accentColor : '#E5E7EB',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {sending
            ? <ActivityIndicator size="small" color={text.trim() ? 'white' : Colors.textLight} />
            : <Send size={18} color={text.trim() ? 'white' : '#9CA3AF'} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
