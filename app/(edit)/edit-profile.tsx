// app/edit-profile.tsx

import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Crypto from 'expo-crypto'
import { ArrowLeft, Camera, User, MapPin } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

const InputField = ({
  label, icon, value, onChangeText, placeholder, multiline = false
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChangeText: (t: string) => void
  placeholder: string
  multiline?: boolean
}) => (
  <View className="mb-5">
    <Text className="text-xs font-bold text-text-light tracking-widest mb-2">{label}</Text>
    <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 shadow-sm">
      {icon}
      <TextInput
        className="flex-1 py-4 text-sm text-text-dark"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        multiline={multiline}
      />
    </View>
  </View>
)

export default function EditProfileScreen() {
  const { user, role } = useAuth()
  const router = useRouter()

  const isDonor = role === 'donor'
  const accentColor = isDonor ? Colors.primary : Colors.orange
  const table = isDonor ? 'donors' : 'orgs'

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [profPic, setProfPic] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from(table)
      .select('full_name, address, prof_pic')
      .eq('id', user?.id)
      .single()

    if (data) {
      setFullName(data.full_name ?? '')
      setAddress(data.address ?? '')
      setProfPic(data.prof_pic ?? null)
    }
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Izin diperlukan', 'Izinkan akses ke galeri foto kamu.')

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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

      const { error } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setProfPic(`${data.publicUrl}?t=${Date.now()}`)
    } catch {
      Alert.alert('Gagal mengunggah foto.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!fullName.trim()) return setError('Nama tidak boleh kosong.')
    if (!address.trim()) return setError('Alamat tidak boleh kosong.')
    setError(null)
    setSaving(true)
    const { error } = await supabase
      .from(table)
      .update({ full_name: fullName, address, prof_pic: profPic })
      .eq('id', user?.id)
    setSaving(false)
    if (error) return setError(error.message)
    router.back()
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>

      {/* Header band */}
      <View className="pt-14 pb-24 px-5" style={{ backgroundColor: accentColor }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-white">Edit Profil</Text>
        </View>
      </View>

      {/* Avatar — overlaps header */}
      <View className="items-center -mt-16 mb-8">
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative">
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            overflow: 'hidden', borderWidth: 4, borderColor: Colors.bg,
            backgroundColor: Colors.donorBg,
            alignItems: 'center', justifyContent: 'center'
          }}>
            {uploading
              ? <ActivityIndicator color={accentColor} />
              : profPic
                ? <Image source={{ uri: profPic }} style={{ width: 100, height: 100 }} resizeMode="cover" />
                : <Camera size={32} color={accentColor} />
            }
          </View>
          <View
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: accentColor, borderWidth: 2, borderColor: Colors.bg }}
          >
            <Camera size={14} color="white" />
          </View>
        </TouchableOpacity>
        <Text className="text-xs text-text-muted mt-2">Ketuk untuk ganti foto</Text>
      </View>

      {/* Form */}
      <View className="px-5">
        <InputField
          label={isDonor ? 'NAMA LENGKAP' : 'NAMA ORGANISASI'}
          icon={<User size={18} color={Colors.textLight} />}
          value={fullName}
          onChangeText={setFullName}
          placeholder={isDonor ? 'Nama lengkap' : 'Nama organisasi'}
        />
        <InputField
          label="ALAMAT"
          icon={<MapPin size={18} color={Colors.textLight} />}
          value={address}
          onChangeText={setAddress}
          placeholder="Alamat lengkap"
          multiline
        />

        {error && <Text className="text-red-500 text-xs text-center mb-4">{error}</Text>}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: accentColor }}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Simpan Perubahan</Text>
          }
        </TouchableOpacity>
      </View>

    </ScrollView>
  )
}