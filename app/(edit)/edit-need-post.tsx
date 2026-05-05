import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Type, FileText, CheckCircle } from 'lucide-react-native'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { InputField } from '@/components/InputField'
import { ConfirmModal } from '@/components/ConfirmModal'

type Urgency = 'normal' | 'urgent'

export default function EditNeedPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { categories } = useCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [original, setOriginal] = useState({ title: '', description: '', categoryId: null as string | null, urgency: 'normal' as Urgency })
  const hasChanges = title !== original.title || description !== original.description || categoryId !== original.categoryId || urgency !== original.urgency

  const [saveConfirm, setSaveConfirm] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)

  useEffect(() => { fetchNeed() }, [id])

  const fetchNeed = async () => {
    const { data } = await supabase
      .from('needs')
      .select('title, description, urgency, category_id')
      .eq('id', id)
      .single()
    if (data) {
      const t = data.title ?? ''
      const d = data.description ?? ''
      const u = data.urgency ?? 'normal'
      const c = data.category_id ?? null
      setTitle(t)
      setDescription(d)
      setUrgency(u)
      setCategoryId(c)
      setOriginal({ title: t, description: d, urgency: u, categoryId: c })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!title.trim()) return setError('Judul tidak boleh kosong.')
    if (!categoryId) return setError('Pilih kategori kebutuhan.')
    setError(null)
    setSaving(true)
    const { error } = await supabase
      .from('needs')
      .update({ title: title.trim(), description: description.trim(), urgency, category_id: categoryId })
      .eq('id', id)
    setSaving(false)
    if (error) return setError(error.message)
    router.back()
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    )
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header band */}
        <View style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, backgroundColor: Colors.orange }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setDiscardConfirm(true)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={18} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', color: 'white' }}>Edit Kebutuhan</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>

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

          {/* Category */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 8 }}>KATEGORI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map(cat => {
                const active = categoryId === cat.id
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    activeOpacity={0.8}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: active ? Colors.orange : 'white', borderWidth: 1, borderColor: active ? Colors.orange : '#E5E7EB' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? 'white' : Colors.textMuted }}>{cat.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          {/* Urgency */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 8 }}>TINGKAT URGENSI</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
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
                  style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: active ? Colors.orange : 'transparent', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                    {active && <CheckCircle size={16} color={Colors.orange} fill={Colors.orange} />}
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textDark }}>{opt.label}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{opt.desc}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {error && <Text style={{ color: '#DC2626', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDiscardConfirm(true)}
              style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSaveConfirm(true)}
              disabled={saving || !hasChanges}
              style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: hasChanges ? Colors.orange : '#D1D5DB' }}
            >
              {saving ? <ActivityIndicator color="white" /> : <Text style={{ fontWeight: '700', color: 'white' }}>Simpan</Text>}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <ConfirmModal
        visible={saveConfirm}
        title="Simpan Perubahan?"
        message="Perubahan pada kebutuhan ini akan disimpan."
        confirmLabel="Simpan"
        confirmColor={Colors.orange}
        onCancel={() => setSaveConfirm(false)}
        onConfirm={() => { setSaveConfirm(false); handleSave() }}
      />
      <ConfirmModal
        visible={discardConfirm}
        title="Batalkan Perubahan?"
        message="Perubahan yang belum disimpan akan hilang."
        confirmLabel="Batalkan"
        cancelLabel="Tidak"
        confirmColor="#DC2626"
        onCancel={() => setDiscardConfirm(false)}
        onConfirm={() => { setDiscardConfirm(false); router.back() }}
      />
    </>
  )
}
