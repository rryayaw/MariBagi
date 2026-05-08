import { View, Text } from 'react-native'
import { Colors } from '@/constants/colors'

type Props = {
  icon?: React.ReactNode
  message: string
}

export function EmptyState({ icon, message }: Props) {
  return (
    <View style={{ paddingVertical: 80, alignItems: 'center' }}>
      {icon}
      <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: icon ? 16 : 0 }}>
        {message}
      </Text>
    </View>
  )
}
