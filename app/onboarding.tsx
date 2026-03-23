// app/onboarding.tsx

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { User, MapPin, Camera, Navigation } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

export default function OnboardingScreen() {
  const { user, role } = useAuth()
  const isDonor = role === 'donor'
  const accentColor = isDonor ? Colors.primary : Colors.orange

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow access to your photo library.')

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri)
    }
  }

  // Upload image to Storage
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true)

      // Expo web returns blob URIs, extract proper extension
      const ext = uri.startsWith('blob:') ? 'jpg' : uri.split('.').pop() ?? 'jpg'
      const fileName = `${user?.id}.${ext}`
      const filePath = `profiles/${fileName}`

      const formData = new FormData()
      formData.append('file', {
      uri,
      name: fileName,
      type: `image/${ext}`,
      } as any)

      const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, formData, { upsert: true, contentType: `image/${ext}` })

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setProfilePic(`${data.publicUrl}?t=${Date.now()}`)
    } catch (e) {
      console.log('upload error:', e)
      Alert.alert('Upload failed', 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  // Get current location
  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow access to your location.')

    const location = await Location.getCurrentPositionAsync({})
    setLatitude(location.coords.latitude)
    setLongitude(location.coords.longitude)

    const geocode = await Location.reverseGeocodeAsync(location.coords)
    if (geocode.length > 0) {
      const g = geocode[0]
      setAddress(`${g.street ?? ''}, ${g.district ?? ''}, ${g.city ?? ''}`.trim())
    }
  }

  const handleSubmit = async () => {
    if (!fullName || !address || !profilePic) {
      return setError('Mohon lengkapi semua kolom.')
    }

    setError(null)
    setLoading(true)

    const table = isDonor ? 'donors' : 'orgs'
    const { error } = await supabase.from(table).insert({
      id: user?.id,
      full_name: fullName,
      prof_pic: profilePic,
      address,
      latitude,
      longitude,
    })

    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-6 pt-10 pb-10">

        {/* Logo */}
        <View className="flex-row items-center gap-3 mb-10">
          <Image source={require('@/assets/maribagi-icon.png')} style={{ width: 40, height: 40 }} />
          <Text className="text-lg font-bold text-text-dark">MariBagi</Text>
        </View>

        {/* Header */}
        <Text className="text-3xl font-extrabold text-text-dark mb-2">Lengkapi profil</Text>
        <Text className="text-3xl font-extrabold mb-2" style={{ color: accentColor }}>
          {isDonor ? 'Donatur' : 'Organisasi'}
        </Text>
        <Text className="text-sm text-text-muted mb-8">
          Informasi ini akan ditampilkan kepada {isDonor ? 'organisasi' : 'donatur'} di sekitar kamu.
        </Text>

        {/* Profile picture */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-3">FOTO PROFIL</Text>
        <TouchableOpacity onPress={handlePickImage} className="self-start mb-8" activeOpacity={0.8}>
          <View
            style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: isDonor ? Colors.donorBg : Colors.orgBg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            }}
          >
            {uploading ? (
              <ActivityIndicator color={accentColor} />
            ) : profilePic ? (
              <Image
                source={{ uri: profilePic }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                resizeMode="cover"
              />
            ) : (
              <Camera size={32} color={accentColor} />
            )}
          </View>
          <View
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <Camera size={12} color="white" />
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
            placeholder={isDonor ? 'John Doe' : 'Yayasan Peduli'}
            placeholderTextColor={Colors.textLight}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Address */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-2">ALAMAT</Text>
        <View className="bg-white rounded-2xl px-4 flex-row items-center gap-3 mb-2 shadow-sm">
          <MapPin size={18} color={Colors.textLight} />
          <TextInput
            className="flex-1 py-4 text-sm text-text-dark"
            placeholder="Jl. Contoh No. 1, Jakarta"
            placeholderTextColor={Colors.textLight}
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        {/* Get location button */}
        <TouchableOpacity
          onPress={handleGetLocation}
          className="flex-row items-center gap-2 mb-8 self-start"
          activeOpacity={0.7}
        >
          <Navigation size={14} color={accentColor} />
          <Text className="text-xs font-semibold" style={{ color: accentColor }}>
            {latitude ? `Lokasi tersimpan (${latitude.toFixed(4)}, ${longitude?.toFixed(4)})` : 'Gunakan lokasi saat ini'}
          </Text>
        </TouchableOpacity>

        {/* Submit button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={loading}
          className="rounded-2xl py-4 items-center mb-3"
          style={{ backgroundColor: accentColor }}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-bold text-base">Mulai Sekarang</Text>
          }
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <Text className="text-red-500 text-xs text-center">{error}</Text>
        )}

      </View>
    </ScrollView>
  )
}