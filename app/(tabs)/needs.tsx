import { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { FileText, Type, CheckCircle } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { useRouter } from 'expo-router'
import { InputField } from '@/components/InputField'
import { MyNeedsTab } from '@/components/MyNeedsTab'

type Urgency = 'normal' | 'urgent'
type ActiveTab = 'create' | 'my'

export default function PostNeedScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { categories } = useCategories()

  const [activeTab, setActiveTab] = useState<ActiveTab>('create')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) return setError('Judul tidak boleh kosong.')
    if (!categoryId) return setError('Pilih kategori kebutuhan.')

    setError(null)
    setSaving(true)

    const { error } = await supabase.from('needs').insert({
      org_id: user?.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      urgency,
      status: 'open',
    })

    setSaving(false)
    if (error) return setError(error.message)

    setTitle('')
    setDescription('')
    setCategoryId(null)
    setUrgency('normal')

    Alert.alert('Berhasil!', 'Kebutuhan kamu telah dipublikasikan.', [
      { text: 'OK', onPress: () => router.push('/(tabs)/home') }
    ])
  }

  return (
    <View className="flex-1 bg-bg">

      {/* Header + tab switcher */}
      <View className="pt-14 pb-4 px-5" style={{ backgroundColor: Colors.orange }}>
        <Text className="text-lg font-extrabold text-white">
          {activeTab === 'create' ? 'Buat Kebutuhan' : 'Kebutuhanmu'}
        </Text>
        <Text className="text-xs text-white/70 mt-1 mb-4">
          {activeTab === 'create' ? 'Beritahu donatur apa yang kamu butuhkan' : 'Kelola kebutuhan yang kamu buat'}
        </Text>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 3 }}>
          {(['create', 'my'] as ActiveTab[]).map(t => (
            <TouchableOpacity
              key={t}
              activeOpacity={0.8}
              onPress={() => setActiveTab(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: activeTab === t ? 'white' : 'transparent' }}
            >
              <Text style={{ fontWeight: '700', fontSize: 13, color: activeTab === t ? Colors.orange : 'white' }}>
                {t === 'create' ? 'Buat' : 'Kebutuhanmu'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'my' && <MyNeedsTab />}

      {activeTab === 'create' && (
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-5 pt-6">

        <InputField
          label="JUDUL KEBUTUHAN"
          icon={<Type size={18} color={Colors.textLight} />}
          value={title}
          onChangeText={setTitle}
          placeholder="cth. Buku pelajaran SD kelas 1-3"
        />

        <InputField
          label="DESKRIPSI"
          icon={<FileText size={18} color={Colors.textLight} />}
          value={description}
          onChangeText={setDescription}
          placeholder="Jumlah yang dibutuhkan, kondisi yang diterima, dll."
          multiline
        />

        {/* category */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">KATEGORI</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-2">
            {categories.map(cat => {
              const active = categoryId === cat.id
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  activeOpacity={0.8}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: active ? Colors.orange : 'white',
                    borderWidth: 1,
                    borderColor: active ? Colors.orange : '#E5E7EB',
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: active ? 'white' : Colors.textMuted }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* urgency */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">TINGKAT URGENSI</Text>
        <View className="flex-row gap-3 mb-8">
          {([
            { value: 'normal', label: 'Normal', desc: 'Dibutuhkan tapi tidak mendesak', emoji: '📋' },
            { value: 'urgent', label: 'Mendesak', desc: 'Dibutuhkan segera', emoji: '🚨' },
          ] as { value: Urgency; label: string; desc: string; emoji: string }[]).map(opt => {
            const active = urgency === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setUrgency(opt.value)}
                activeOpacity={0.8}
                className="flex-1 bg-white rounded-2xl p-4 shadow-sm"
                style={{
                  borderWidth: 2,
                  borderColor: active ? Colors.orange : 'transparent',
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xl">{opt.emoji}</Text>
                  {active && <CheckCircle size={16} color={Colors.orange} fill={Colors.orange} />}
                </View>
                <Text className="text-sm font-bold text-text-dark">{opt.label}</Text>
                <Text className="text-xs text-text-muted mt-0.5">{opt.desc}</Text>
                <View
                  className="mt-3 self-start px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: active ? Colors.orgBg : '#F3F4F6' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? Colors.orange : Colors.textLight }}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {error && <Text className="text-red-500 text-xs text-center mb-4">{error}</Text>}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={saving}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: Colors.orange }}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Publikasikan Kebutuhan</Text>
          }
        </TouchableOpacity>

      </View>
      </ScrollView>
      )}

    </View>
  )
}
