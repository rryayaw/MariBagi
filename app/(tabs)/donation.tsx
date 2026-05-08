import { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Alert
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, FileText, Type } from 'lucide-react-native'
import { uploadImage } from '@/lib/imageUpload'
import { OptionCard } from '@/components/OptionCard'
import { useAuth } from '@/context/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { useRouter } from 'expo-router'
import { InputField } from '@/components/InputField'
import { MyDonationsTab } from '@/components/MyDonationsTab'

type PickupMethod = 'pickup' | 'dropoff'
type ActiveTab = 'create' | 'my'

export default function PostDonationScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { categories } = useCategories()

  const [activeTab, setActiveTab] = useState<ActiveTab>('create')

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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 })
    if (result.canceled || !user) return
    setUploading(true)
    const url = await uploadImage(result.assets[0].uri, 'donations', user.id)
    setUploading(false)
    if (url) setPhotoUrl(url)
    else Alert.alert('Gagal mengunggah foto.')
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
    <View className="flex-1 bg-bg">

      {/* Header + tab switcher */}
      <View className="pt-14 pb-4 px-5" style={{ backgroundColor: Colors.primary }}>
        <Text className="text-lg font-extrabold text-white">
          {activeTab === 'create' ? 'Buat Donasi' : 'Donasimu'}
        </Text>
        <Text className="text-xs text-white/70 mt-1 mb-4">
          {activeTab === 'create' ? 'Bagikan barang layak pakaimu' : 'Kelola donasi yang kamu buat'}
        </Text>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 3 }}>
          {(['create', 'my'] as ActiveTab[]).map(t => (
            <TouchableOpacity
              key={t}
              activeOpacity={0.8}
              onPress={() => setActiveTab(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: activeTab === t ? 'white' : 'transparent' }}
            >
              <Text style={{ fontWeight: '700', fontSize: 13, color: activeTab === t ? Colors.primary : 'white' }}>
                {t === 'create' ? 'Buat' : 'Donasimu'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'my' && <MyDonationsTab />}

      {activeTab === 'create' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="px-5 pt-6">

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
                      style={{ backgroundColor: active ? Colors.primary : 'white', borderWidth: 1, borderColor: active ? Colors.primary : '#E5E7EB' }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: active ? 'white' : Colors.textMuted }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>

            <Text className="text-xs font-bold text-text-light tracking-widest mb-2">METODE PENGAMBILAN</Text>
            <View className="flex-row gap-3 mb-8">
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
                  activeBg={Colors.donorBg}
                />
              ))}
            </View>

            {error && <Text className="text-red-500 text-xs text-center mb-4">{error}</Text>}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={saving}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: Colors.primary }}
            >
              {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Publikasikan Donasi</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

    </View>
  )
}
