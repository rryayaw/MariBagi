import { Tabs } from 'expo-router'
import { Home, Plus, MessageCircle, ClipboardList, User } from 'lucide-react-native'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/context/AuthContext'

export default function TabLayout() {
  const { role } = useAuth()
  const isDonor = role === 'donor'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.08,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: isDonor ? Colors.primary : Colors.orange,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="home_working" options={{ href: null }} />
      <Tabs.Screen
        name="donation"
        options={{
          title: 'Donasi',
          href: isDonor ? undefined : null,
          tabBarIcon: ({ color }) => <Plus size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="needs"
        options={{
          title: 'Kebutuhan',
          href: isDonor ? null : undefined,
          tabBarIcon: ({ color }) => <Plus size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} /> }} />
      <Tabs.Screen name="status" options={{ title: 'Status', tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  )
}