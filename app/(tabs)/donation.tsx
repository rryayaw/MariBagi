import { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Alert
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Crypto from 'expo-crypto'
import { Camera, FileText, Type, CheckCircle } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { useRouter } from 'expo-router'
import { InputField } from '@/components/InputField'

type PickupMethod = 'pickup' | 'dropoff'

export default function PostDonationScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { categories } = useCategories()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>('pickup')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Izin diperlukan', 'Izinkan akses ke galeri foto.')

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    })

    if (!result.canceled) await uploadImage(result.assets[0].uri)
  }

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true)
      const ext = uri.startsWith('blob:') ? 'jpg' : (uri.split('.').pop() ?? 'jpg')
      const filePath = `${user?.id}/${Crypto.randomUUID()}.${ext}`
      const blob = await (await fetch(uri)).blob()

      const { error } = await supabase.storage.from('donations').upload(filePath, blob, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('donations').getPublicUrl(filePath)
      setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`)
    } catch {
      Alert.alert('Gagal mengunggah foto.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) return setError('Judul tidak boleh kosong.')
    if (!categoryId) return setError('Pilih kategori donasi.')
    if (!photoUrl) return setError('Tambahkan foto barang donasi.')

    setError(null)
    setSaving(true)

    const { error } = await supabase.from('donations').insert({
      donor_id: user?.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      photo_url: photoUrl,
      pickup_method: pickupMethod,
      status: 'available',
    })

    setSaving(false)
    if (error) return setError(error.message)

    // buat reset form
    setTitle('')
    setDescription('')
    setCategoryId(null)
    setPhotoUrl(null)
    setPickupMethod('pickup')

    Alert.alert('Berhasil!', 'Donasi kamu telah dipublikasikan.', [
      { text: 'OK', onPress: () => router.push('/(tabs)/home') }
    ])
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>

      {/* header */}
      <View className="pt-14 pb-6 px-5" style={{ backgroundColor: Colors.primary }}>
        <Text className="text-lg font-extrabold text-white">Buat Donasi</Text>
        <Text className="text-xs text-white/70 mt-1">Bagikan barang layak pakaimu</Text>
      </View>

      <View className="px-5 pt-6">

        {/*photo upload */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">FOTO BARANG</Text>
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.8}
          className="bg-white rounded-2xl overflow-hidden mb-5 shadow-sm"
          style={{ height: 180 }}
        >
          {uploading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center gap-2">
              <View className="w-14 h-14 rounded-full bg-donor-bg items-center justify-center">
                <Camera size={24} color={Colors.primary} />
              </View>
              <Text className="text-sm font-semibold text-text-muted">Ketuk untuk tambah foto</Text>
              <Text className="text-xs text-text-light">Foto yang jelas membantu orang memilih</Text>
            </View>
          )}
        </TouchableOpacity>

        {/*title */}
        <InputField
          label="JUDUL DONASI"
          icon={<Type size={18} color={Colors.textLight} />}
          value={title}
          onChangeText={setTitle}
          placeholder="cth. Pakaian anak layak pakai"
        />

        {/* description */}
        <InputField
          label="DESKRIPSI"
          icon={<FileText size={18} color={Colors.textLight} />}
          value={description}
          onChangeText={setDescription}
          placeholder="Kondisi barang, ukuran, jumlah, dll."
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
                    backgroundColor: active ? Colors.primary : 'white',
                    borderWidth: 1,
                    borderColor: active ? Colors.primary : '#E5E7EB',
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

        {/* Pickup */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">METODE PENGAMBILAN</Text>
        <View className="flex-row gap-3 mb-8">
          {([
            { value: 'pickup', label: 'Jemput', desc: 'Orangg datang ke lokasimu', emoji: '🚗' },
            { value: 'dropoff', label: 'Antar', desc: 'Kamu antar ke orang', emoji: '📦' },
          ] as { value: PickupMethod; label: string; desc: string; emoji: string }[]).map(opt => {
            const active = pickupMethod === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPickupMethod(opt.value)}
                activeOpacity={0.8}
                className="flex-1 bg-white rounded-2xl p-4 shadow-sm"
                style={{
                  borderWidth: 2,
                  borderColor: active ? Colors.primary : 'transparent',
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xl">{opt.emoji}</Text>
                  {active && <CheckCircle size={16} color={Colors.primary} fill={Colors.primary} />}
                </View>
                <Text className="text-sm font-bold text-text-dark">{opt.label}</Text>
                <Text className="text-xs text-text-muted mt-0.5">{opt.desc}</Text>

                {/* badge preview */}
                <View
                  className="mt-3 self-start px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: active ? Colors.donorBg : '#F3F4F6' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? Colors.primary : Colors.textLight }}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
        {error && <Text className="text-red-500 text-xs text-center mb-4">{error}</Text>}

        {/* submit */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={saving}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: Colors.primary }}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Publikasikan Donasi</Text>
          }
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}