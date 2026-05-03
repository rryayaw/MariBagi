import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants/colors'
import { Donation } from '@/types'

const PickupBadge = ({ method }: { method: string }) => (
  <View
    className="px-2 py-0.5 rounded-full"
    style={{ backgroundColor: method === 'pickup' ? '#EFF6FF' : '#F0FDF4' }}
  >
    <Text
      className="text-xs font-semibold"
      style={{ color: method === 'pickup' ? '#2563EB' : '#16A34A' }}
    >
      {method === 'pickup' ? 'Jemput' : 'Antar'}
    </Text>
  </View>
)

export const DonationCard = ({ item, onPress }: { item: Donation; onPress?: () => void }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
    style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}
  >
    {item.photo_url ? (
      <Image
        source={{ uri: item.photo_url }}
        style={{ width: 90, alignSelf: 'stretch' }}
        resizeMode="cover"
      />
    ) : (
      <View
        style={{ width: 90, backgroundColor: Colors.donorBg }}
        className="items-center justify-center"
      >
        <Text className="text-2xl">🎁</Text>
      </View>
    )}
    <View className="flex-1 p-3 justify-between">
      <View className="flex-row items-center justify-between mb-1">
        <PickupBadge method={item.pickup_method} />
      </View>
      <Text className="text-base font-bold text-text-dark" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="text-xs text-text-muted font-medium mb-1" numberOfLines={1}>
        {item.donor.full_name}
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
