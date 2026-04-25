import { View, Text, TouchableOpacity } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

export const Divider = () => <View className="h-px bg-neutral-200 mx-4" />

export const MenuItem = ({ icon, label, onPress }: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} className="flex-row items-center px-4 py-4 gap-4">
    <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
      {icon}
    </View>
    <Text className="flex-1 text-sm font-semibold text-text-dark">{label}</Text>
    <ChevronRight size={16} color={Colors.textLight} />
  </TouchableOpacity>
)
