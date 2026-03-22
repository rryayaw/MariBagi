import { View, Text, TouchableOpacity, Pressable, Image, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Heart, Building2, ArrowRight } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

export default function RoleSelectScreen() {
  const router = useRouter()

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-8 pt-10 pb-10">

        {/* Logo */}
        <View className="flex-row items-center gap-3 mb-10">
          <Image source={require('@/assets/maribagi-icon.png')} style={{ width: 40, height: 40 }} />
          <Text className="text-lg font-bold text-text-dark">MariBagi</Text>
        </View>

        {/* Headline */}
        <Text className="text-3xl font-bold text-text-dark leading-tight mb-3">
          Berbagi lebih mudah,{'\n'}dampak lebih nyata.
        </Text>
        <Text className="text-base text-text-muted leading-relaxed mb-10">
          Hubungkan donasi barang non-perishable kamu dengan organisasi yang membutuhkan di sekitar kamu.
        </Text>

        {/* Role label */}
        <Text className="text-xs font-bold text-text-light tracking-widest mb-4">
          SAYA BERGABUNG SEBAGAI
        </Text>

        {/* Donor card */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/register?role=donor')}
          className="bg-white rounded-2xl p-5 flex-row items-center gap-4 mb-3 shadow-sm"
        >
          <View className="w-12 h-12 rounded-xl bg-donor-bg items-center justify-center">
            <Heart size={22} color={Colors.primary} fill={Colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-dark mb-1">Donatur</Text>
            <Text className="text-sm text-text-muted leading-snug">
              Punya barang layak pakai?{'\n'}Donasikan ke organisasi terdekat.
            </Text>
          </View>
          <ArrowRight size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* Org card */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/register?role=organization')}
          className="bg-white rounded-2xl p-5 flex-row items-center gap-4 mb-10 shadow-sm"
        >
          <View className="w-12 h-12 rounded-xl bg-org-bg items-center justify-center">
            <Building2 size={22} color={Colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-dark mb-1">Organisasi</Text>
            <Text className="text-sm text-text-muted leading-snug">
              Panti asuhan, yayasan, atau komunitas yang membutuhkan bantuan.
            </Text>
          </View>
          <ArrowRight size={18} color={Colors.orange} />
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text className="text-center text-sm text-text-muted">
            Sudah punya akun?{' '}
            <Text className="text-primary-dark font-bold">Login</Text>
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="flex-1 justify-end mt-6">
          <Text className="text-center text-xs text-text-light leading-relaxed">
            Dengan bergabung, kamu menyetujui{' '}
            <Text className="text-primary-dark font-semibold">Syarat & Ketentuan</Text>
            {' '}dan{' '}
            <Text className="text-primary-dark font-semibold">Kebijakan Privasi</Text>
            {' '}kami.
          </Text>
        </View>

      </View>
    </ScrollView>
  )
}