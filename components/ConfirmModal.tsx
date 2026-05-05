import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { Colors } from '@/constants/colors'

type Props = {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  confirmColor: string
  cancelLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({ visible, title, message, confirmLabel, confirmColor, cancelLabel = 'Batal', onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F3F4F6' }}
            >
              <Text style={{ fontWeight: '700', color: Colors.textMuted }}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: confirmColor }}
            >
              <Text style={{ fontWeight: '700', color: 'white' }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
