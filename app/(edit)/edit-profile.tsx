import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Crypto from 'expo-crypto'
import { ArrowLeft, Camera, User, MapPin } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

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

  useEffect(() => {
    fetchProfile()
  }, [])

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
    if (status !== 'granted') return Alert.alert('Permission needed')

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
      const newFileName = Crypto.randomUUID()
      const filePath = `${user?.id}/${newFileName}.${ext}`

      const response = await fetch(uri)
      const blob = await response.blob()

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setProfPic(`${data.publicUrl}?t=${Date.now()}`)
    } catch (e) {
      Alert.alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!fullName) return setError('Nama tidak boleh kosong.')
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
      <View className="px-5 pt-14 pb-10">

        {/* Header */}
        <View className="flex-row items-center gap-3 mb-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
          >
            <ArrowLeft size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-text-dark">Edit Profil</Text>
        </View>

        {/* Avatar */}
        <TouchableOpacity onPress={handlePickImage} className="self-center mb-8" activeOpacity={0.8}>
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            overflow: 'hidden', backgroundColor: Colors.donorBg,
            alignItems: 'center', justifyContent: 'center'
          }}>
            {uploading ? (
              <ActivityIndicator color={accentColor} />
            ) : profPic ? (
              <Image source={{ uri: profPic }} style={{ width: 100, height: 100 }} resizeMode="cover" />
            ) : (
              <Camera size={32} color={accentColor} />
            )}
          </View>
          <View
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <Camera size={14} color="white" />
          </View>
        </TouchableOpacity>

        {/* Full name */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">
          {isDonor ? 'NAMA LENGKAP' : 'NAMA ORGANISASI'}
        </Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-4 shadow-sm">
          <User size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            value={fullName}
            onChangeText={setFullName}
            placeholder={isDonor ? 'Nama lengkap' : 'Nama organisasi'}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        {/* Address */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">ALAMAT</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-8 shadow-sm">
          <MapPin size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            value={address}
            onChangeText={setAddress}
            placeholder="Alamat lengkap"
            placeholderTextColor={Colors.textLight}
            multiline
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
          className="rounded-2xl py-4 items-center mb-3"
          style={{ backgroundColor: accentColor }}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Simpan Perubahan</Text>
          }
        </TouchableOpacity>

        {error && (
          <Text className="text-red-500 text-xs text-center">{error}</Text>
        )}

      </View>
    </ScrollView>
  )
}