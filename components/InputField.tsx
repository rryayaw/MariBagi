import { View, Text, TextInput } from 'react-native'
import { Colors } from '@/constants/colors'

export const InputField = ({
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
