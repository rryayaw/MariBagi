import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { WifiOff, RefreshCw } from 'lucide-react-native'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/colors'

export default function NoInternetScreen() {
  const { refreshProfile, loading, isOffline, user, isOnboarded } = useAuth()
  const router = useRouter()

  const handleRetry = async () => {
    await refreshProfile()
    if (!isOffline) {
      if (!user) router.replace('/(auth)')
      else if (!isOnboarded) router.replace('/onboarding')
      else router.replace('/(tabs)/home')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <WifiOff size={44} color="#EF4444" />
      </View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textDark, textAlign: 'center', marginBottom: 10 }}>
        Tidak Ada Koneksi
      </Text>
      <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
        Periksa koneksi internet kamu dan coba lagi.
      </Text>

      <TouchableOpacity
        onPress={handleRetry}
        disabled={loading}
        activeOpacity={0.8}
        style={{
          marginTop: 36,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: Colors.primary,
          paddingVertical: 15,
          paddingHorizontal: 32,
          borderRadius: 16,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <>
              <RefreshCw size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Coba Lagi</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  )
}
