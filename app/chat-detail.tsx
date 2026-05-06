import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, ActivityIndicator,
  Alert, Modal, Pressable, ActionSheetIOS,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft, Send, Paperclip, Camera, ImageIcon,
  FileText, Check, CheckCheck, Play, X, Pencil,
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  text: string | null
  message_type: 'text' | 'image' | 'video' | 'file'
  media_url: string | null
  media_name: string | null
  media_size: number | null
  is_read: boolean
  is_deleted: boolean
  edited_at: string | null
  created_at: string
}

type Conversation = {
  id: string
  donor_id: string
  org_id: string
  donor: { full_name: string; prof_pic: string } | null
  org: { full_name: string; prof_pic: string } | null
}

type MediaPayload = {
  text: null
  message_type: 'image' | 'video' | 'file'
  media_url: string
  media_name: string | null
  media_size: number | null
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
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
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAttach, setShowAttach] = useState(false)
  const [lightboxUri, setLightboxUri] = useState<string | null>(null)
  const [isOtherTyping, setIsOtherTyping] = useState(false)

  const listRef = useRef<FlatList>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)

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
        ({ new: msg }) => {
          setMessages(prev => [...prev, msg as Message])
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
          if ((msg as Message).sender_id !== user?.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        ({ new: msg }) => {
          setMessages(prev => prev.map(m => m.id === (msg as Message).id ? msg as Message : m))
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user?.id) {
          setIsOtherTyping(true)
          clearTimeout(typingTimeoutRef.current!)
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(typingTimeoutRef.current!)
    }
  }, [fetchAll, id])

  const handleTextChange = (val: string) => {
    setText(val)
    const now = Date.now()
    if (channelRef.current && val.length > 0 && now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user?.id } })
    }
  }

  const uploadMedia = async (uri: string, folder: string): Promise<string | null> => {
    try {
      const ext = uri.split('.').pop()?.split('?')[0] ?? 'bin'
      const path = `${id}/${folder}/${Date.now()}.${ext}`
      const res = await fetch(uri)
      const blob = await res.blob()
      const { error } = await supabase.storage.from('chat-media').upload(path, blob, { contentType: blob.type })
      if (error) throw error
      return supabase.storage.from('chat-media').getPublicUrl(path).data.publicUrl
    } catch (e) {
      Alert.alert('Upload gagal', String(e))
      return null
    }
  }

  const sendText = async () => {
    const trimmed = text.trim()
    if (!trimmed || !user) return

    if (editingId) {
      const { error } = await supabase.from('messages')
        .update({ text: trimmed, edited_at: new Date().toISOString() })
        .eq('id', editingId)
      if (error) Alert.alert('Gagal edit', error.message)
      setEditingId(null)
      setText('')
      return
    }

    setSending(true)
    setText('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      text: trimmed,
      message_type: 'text',
    })
    if (error) { setText(trimmed); Alert.alert('Gagal kirim', error.message) }
    setSending(false)
  }

  const sendMedia = async (payload: MediaPayload) => {
    if (!user) return
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      ...payload,
    })
    if (error) Alert.alert('Gagal kirim', error.message)
  }

  const deleteMessage = async (msgId: string) => {
    const { error } = await supabase.from('messages').update({ is_deleted: true }).eq('id', msgId)
    if (error) Alert.alert('Gagal hapus', error.message)
  }

  const startEdit = (m: Message) => {
    setEditingId(m.id)
    setText(m.text ?? '')
  }

  const handleLongPress = (m: Message) => {
    if (m.sender_id !== user?.id || m.is_deleted) return
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Batal', 'Edit', 'Hapus'], cancelButtonIndex: 0, destructiveButtonIndex: 2 },
        i => {
          if (i === 1) startEdit(m)
          if (i === 2) deleteMessage(m.id)
        }
      )
    } else {
      Alert.alert('Pesan', undefined, [
        { text: 'Edit', onPress: () => startEdit(m) },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteMessage(m.id) },
        { text: 'Batal', style: 'cancel' },
      ])
    }
  }

  const pickMedia = async (useCamera: boolean) => {
    setShowAttach(false)
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setUploading(true)
    const url = await uploadMedia(asset.uri, 'media')
    setUploading(false)
    if (!url) return
    await sendMedia({ text: null, message_type: asset.type === 'video' ? 'video' : 'image', media_url: url, media_name: null, media_size: null })
  }

  const pickFile = async () => {
    setShowAttach(false)
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setUploading(true)
    const url = await uploadMedia(asset.uri, 'files')
    setUploading(false)
    if (!url) return
    await sendMedia({ text: null, message_type: 'file', media_url: url, media_name: asset.name, media_size: asset.size ?? null })
  }

  const otherParty = conversation ? (isDonor ? conversation.org : conversation.donor) : null

  const renderMessage = ({ item: m }: { item: Message }) => {
    const isMine = m.sender_id === user?.id
    const bubbleBg = m.is_deleted ? '#F3F4F6' : isMine ? accentColor : 'white'

    return (
      <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => handleLongPress(m)}
          delayLongPress={350}
          style={{
            maxWidth: '75%', backgroundColor: bubbleBg,
            borderRadius: 18,
            borderBottomRightRadius: isMine ? 4 : 18,
            borderBottomLeftRadius: isMine ? 18 : 4,
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
          }}
        >
          {m.is_deleted ? (
            <Text style={{ color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', paddingHorizontal: 14, paddingVertical: 10 }}>
              Pesan dihapus
            </Text>
          ) : m.message_type === 'image' ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setLightboxUri(m.media_url)}>
              <Image source={{ uri: m.media_url! }} style={{ width: 220, height: 160 }} resizeMode="cover" />
            </TouchableOpacity>
          ) : m.message_type === 'video' ? (
            <View style={{ width: 220, height: 160, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Play size={40} color="white" fill="white" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Ketuk untuk putar</Text>
            </View>
          ) : m.message_type === 'file' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 }}>
              <FileText size={28} color={isMine ? 'white' : accentColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: isMine ? 'white' : Colors.textDark, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                  {m.media_name}
                </Text>
                {m.media_size != null && (
                  <Text style={{ color: isMine ? 'rgba(255,255,255,0.65)' : Colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    {formatFileSize(m.media_size)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: isMine ? 'white' : Colors.textDark, fontSize: 14, lineHeight: 20 }}>
                {m.text}
              </Text>
              {m.edited_at && (
                <Text style={{ color: isMine ? 'rgba(255,255,255,0.55)' : Colors.textLight, fontSize: 10, marginTop: 2 }}>
                  diedit
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, marginHorizontal: 4 }}>
          <Text style={{ fontSize: 10, color: Colors.textLight }}>
            {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMine && !m.is_deleted && (
            m.is_read
              ? <CheckCheck size={12} color={accentColor} />
              : <Check size={12} color={Colors.textLight} />
          )}
        </View>
      </View>
    )
  }

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
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: Colors.textDark }} numberOfLines={1}>
            {otherParty?.full_name ?? '...'}
          </Text>
          {isOtherTyping && (
            <Text style={{ fontSize: 11, color: accentColor, marginTop: 1 }}>sedang mengetik...</Text>
          )}
        </View>
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
          renderItem={renderMessage}
        />
      )}

      {/* Edit banner */}
      {editingId && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 16, paddingVertical: 8,
          backgroundColor: '#EFF6FF', borderTopWidth: 1, borderTopColor: '#DBEAFE',
        }}>
          <Pencil size={14} color={Colors.primary} />
          <Text style={{ flex: 1, fontSize: 12, color: Colors.primary }}>Mode edit</Text>
          <TouchableOpacity onPress={() => { setEditingId(null); setText('') }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        paddingHorizontal: 12, paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6',
      }}>
        {!editingId && (
          <TouchableOpacity
            onPress={() => setShowAttach(true)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}
          >
            {uploading
              ? <ActivityIndicator size="small" color={accentColor} />
              : <Paperclip size={18} color={Colors.textMuted} />
            }
          </TouchableOpacity>
        )}
        <TextInput
          value={text}
          onChangeText={handleTextChange}
          placeholder={editingId ? 'Edit pesan...' : 'Ketik pesan...'}
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
          onPress={sendText}
          disabled={!text.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: text.trim() ? accentColor : '#E5E7EB',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {sending
            ? <ActivityIndicator size="small" color="white" />
            : <Send size={18} color={text.trim() ? 'white' : '#9CA3AF'} />
          }
        </TouchableOpacity>
      </View>

      {/* Attachment picker */}
      <Modal visible={showAttach} transparent animationType="fade" onRequestClose={() => setShowAttach(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setShowAttach(false)}>
          <Pressable style={{
            backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, gap: 12,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 4 }}>Lampirkan</Text>
            {([
              { Icon: Camera, label: 'Kamera', onPress: () => pickMedia(true) },
              { Icon: ImageIcon, label: 'Foto / Video', onPress: () => pickMedia(false) },
              { Icon: FileText, label: 'File / Dokumen', onPress: pickFile },
            ] as const).map(({ Icon, label, onPress }) => (
              <TouchableOpacity
                key={label} onPress={onPress} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, backgroundColor: Colors.bg }}
              >
                <Icon size={22} color={accentColor} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textDark }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image lightbox */}
      <Modal visible={!!lightboxUri} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <TouchableOpacity
            onPress={() => setLightboxUri(null)}
            style={{ position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 }}
          >
            <X size={28} color="white" />
          </TouchableOpacity>
          {lightboxUri && (
            <Image source={{ uri: lightboxUri }} style={{ flex: 1 }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}
