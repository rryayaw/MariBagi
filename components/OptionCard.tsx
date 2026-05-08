import { View, Text, TouchableOpacity } from 'react-native'
import { CheckCircle } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

type Props = {
  label: string
  desc: string
  emoji: string
  active: boolean
  onPress: () => void
  accentColor: string
  activeBg?: string
}

export function OptionCard({ label, desc, emoji, active, onPress, accentColor, activeBg }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
        borderWidth: 2, borderColor: active ? accentColor : 'transparent',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
        {active && <CheckCircle size={16} color={accentColor} fill={accentColor} />}
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textDark }}>{label}</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{desc}</Text>
      {activeBg && (
        <View style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: active ? activeBg : '#F3F4F6' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: active ? accentColor : Colors.textLight }}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
