import { Tabs } from 'expo-router'
import { Home, Plus, MessageCircle, ClipboardList, User } from 'lucide-react-native'
import { Colors } from '@/constants/colors'
import { useAuth } from '@/context/AuthContext'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { usePendingRequests } from '@/hooks/usePendingRequests'

const BADGE_STYLE = { backgroundColor: '#EF4444' }

function badge(n: number) {
  return n > 0 ? (n > 99 ? '99+' : n) : undefined
}

export default function TabLayout() {
  const { role } = useAuth()
  const isDonor = role === 'donor'
  const unreadMessages = useUnreadMessages()
  const pendingRequests = usePendingRequests()

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
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
          tabBarBadge: badge(unreadMessages),
          tabBarBadgeStyle: BADGE_STYLE,
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
          tabBarBadge: badge(pendingRequests),
          tabBarBadgeStyle: BADGE_STYLE,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  )
}