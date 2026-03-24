// app/index.tsx

import { Redirect } from 'expo-router'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { signOut } from '@/lib/auth'

export default function Index() {
  return(
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ flexGrow: 1 }}>
      <View>
        <Text>Loading...</Text>
        <Pressable onPress={() => signOut()} >
          <Text>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}