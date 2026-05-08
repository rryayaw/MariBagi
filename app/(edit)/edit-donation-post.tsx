import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ArrowLeft, Camera, Type, FileText } from 'lucide-react-native'
import { uploadImage } from '@/lib/imageUpload'
import { OptionCard } from '@/components/OptionCard'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { InputField } from '@/components/InputField'
import { ConfirmModal } from '@/components/ConfirmModal'

type PickupMethod = 'pickup' | 'dropoff'

export default function EditDonationPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { categories } = useCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>('pickup')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [original, setOriginal] = useState({ title: '', description: '', categoryId: null as string | null, pickupMethod: 'pickup' as PickupMethod, photoUrl: null as string | null })
  const hasChanges = title !== original.title || description !== original.description || categoryId !== original.categoryId || pickupMethod !== original.pickupMethod || photoUrl !== original.photoUrl

  const [saveConfirm, setSaveConfirm] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)

  useEffect(() => { fetchPost() }, [id])

  const fetchPost = async () => {
    const { data } = await supabase
      .from('donations')
      .select('title, description, photo_url, pickup_method, category_id')
      .eq('id', id)
      .single()
    if (data) {
      const t = data.title ?? ''
      const d = data.description ?? ''
      const p = data.photo_url ?? null
      const m = data.pickup_method ?? 'pickup'
      const c = data.category_id ?? null
      setTitle(t)
      setDescription(d)
      setPhotoUrl(p)
      setPickupMethod(m)
      setCategoryId(c)
      setOriginal({ title: t, description: d, photoUrl: p, pickupMethod: m, categoryId: c })
    }
    setLoading(false)
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Izin diperlukan', 'Izinkan akses ke galeri foto.')
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 })
    if (result.canceled || !user) return
    setUploading(true)
    const url = await uploadImage(result.assets[0].uri, 'donations', user.id)
    setUploading(false)
    if (url) setPhotoUrl(url)
    else Alert.alert('Gagal mengunggah foto.')
  }

  const handleSave = async () => {
    if (!title.trim()) return setError('Judul tidak boleh kosong.')
    if (!categoryId) return setError('Pilih kategori donasi.')
    setError(null)
    setSaving(true)
    const { error } = await supabase
      .from('donations')
      .update({ title: title.trim(), description: description.trim(), photo_url: photoUrl, pickup_method: pickupMethod, category_id: categoryId })
      .eq('id', id)
    setSaving(false)
    if (error) return setError(error.message)
    router.back()
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header band */}
        <View style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, backgroundColor: Colors.primary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setDiscardConfirm(true)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={18} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', color: 'white' }}>Edit Donasi</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>

          {/* Photo */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 8 }}>FOTO BARANG</Text>
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', height: 180, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
          >
            {uploading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : photoUrl ? (
              <Image source={{ uri: photoUrl }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.donorBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={24} color={Colors.primary} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textMuted }}>Ketuk untuk ganti foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <InputField
            label="JUDUL DONASI"
            icon={<Type size={18} color={Colors.textLight} />}
            value={title}
            onChangeText={setTitle}
            placeholder="cth. Pakaian anak layak pakai"
          />

          <InputField
            label="DESKRIPSI"
            icon={<FileText size={18} color={Colors.textLight} />}
            value={description}
            onChangeText={setDescription}
            placeholder="Kondisi barang, ukuran, jumlah, dll."
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
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: active ? Colors.primary : 'white', borderWidth: 1, borderColor: active ? Colors.primary : '#E5E7EB' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? 'white' : Colors.textMuted }}>{cat.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          {/* Pickup method */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 8 }}>METODE PENGAMBILAN</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            {([
              { value: 'pickup', label: 'Jemput', desc: 'Orang datang ke lokasimu', emoji: '🚗' },
              { value: 'dropoff', label: 'Antar', desc: 'Kamu antar ke orang', emoji: '📦' },
            ] as { value: PickupMethod; label: string; desc: string; emoji: string }[]).map(opt => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                desc={opt.desc}
                emoji={opt.emoji}
                active={pickupMethod === opt.value}
                onPress={() => setPickupMethod(opt.value)}
                accentColor={Colors.primary}
              />
            ))}
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
              style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: hasChanges ? Colors.primary : '#D1D5DB' }}
            >
              {saving ? <ActivityIndicator color="white" /> : <Text style={{ fontWeight: '700', color: 'white' }}>Simpan</Text>}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <ConfirmModal
        visible={saveConfirm}
        title="Simpan Perubahan?"
        message="Perubahan pada donasi ini akan disimpan."
        confirmLabel="Simpan"
        confirmColor={Colors.primary}
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
