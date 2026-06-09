import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native'
import { ThumbsUp } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

type Props = {
  visible: boolean
  title: string
  message: string
  buttonLabel?: string
  accentColor?: string
  haloColor?: string
  onClose: () => void
}

export function SuccessModal({
  visible,
  title,
  message,
  buttonLabel = 'Selesai',
  accentColor = Colors.primary,
  haloColor = Colors.donorBg,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      scale.setValue(0)
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Animated.View
          style={{
            backgroundColor: 'white',
            borderRadius: 28,
            padding: 28,
            width: '100%',
            alignItems: 'center',
            transform: [{ scale }],
          }}
        >
          {/* Thumbs-up with soft halo */}
          <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: haloColor, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }}>
              <ThumbsUp size={38} color="white" fill="white" />
            </View>
          </View>

          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.textDark, marginBottom: 8, textAlign: 'center' }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, lineHeight: 21, textAlign: 'center', marginBottom: 24 }}>
            {message}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={{ alignSelf: 'stretch', paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: accentColor }}
          >
            <Text style={{ fontWeight: '700', color: 'white', fontSize: 15 }}>{buttonLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}
