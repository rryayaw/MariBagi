import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants/colors'

type Category = { id: string; name: string }

export const CategoryFilter = ({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[]
  selected: string | undefined
  onSelect: (id: string | undefined) => void
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={() => onSelect(undefined)}
        activeOpacity={0.8}
        className="px-4 py-2 rounded-full"
        style={{
          backgroundColor: !selected ? Colors.primary : 'white',
          borderWidth: 1,
          borderColor: !selected ? Colors.primary : '#E5E7EB',
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: !selected ? 'white' : Colors.textMuted }}
        >
          Semua
        </Text>
      </TouchableOpacity>

      {categories.map(cat => {
        const active = selected === cat.id
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.8}
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: active ? Colors.primary : 'white',
              borderWidth: 1,
              borderColor: active ? Colors.primary : '#E5E7EB',
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: active ? 'white' : Colors.textMuted }}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  </ScrollView>
)
