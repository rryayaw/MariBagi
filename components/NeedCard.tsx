import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants/colors'
import { Need } from '@/types'

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  const isUrgent = urgency === 'urgent'
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: isUrgent ? '#FEE2E2' : '#F0FDF4' }}
    >
      <Text
        className="text-xs font-semibold"
        style={{ color: isUrgent ? '#DC2626' : '#16A34A' }}
      >
        {isUrgent ? 'Mendesak' : 'Normal'}
      </Text>
    </View>
  )
}

export const NeedCard = ({ item }: { item: Need }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
    style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}
  >
    {item.org.prof_pic ? (
      <Image
        source={{ uri: item.org.prof_pic }}
        style={{ width: 90, height: 110 }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{ width: 90, height: 110, backgroundColor: Colors.donorBg }}
        className="items-center justify-center"
      >
        <Text className="text-2xl">🏢</Text>
      </View>
    )}
    <View className="flex-1 p-3 justify-between">
      <View className="flex-row items-center justify-between mb-1">
        <UrgencyBadge urgency={item.urgency} />
      </View>
      <Text className="text-base font-bold text-text-dark" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-xs text-text-muted font-medium mb-1" numberOfLines={1}>
        {item.org.full_name}
      </Text>
      <Text className="text-xs text-text-muted leading-snug" numberOfLines={2}>
        {item.description}
      </Text>
      <Text className="text-xs mt-1 font-medium" style={{ color: Colors.primary }}>
        {item.category.name}
      </Text>
    </View>
  </TouchableOpacity>
)
