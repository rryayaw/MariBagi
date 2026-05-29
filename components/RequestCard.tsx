import { View, Text, TouchableOpacity, Image } from 'react-native'
import { Clock, Package, Truck, Star, CheckCircle, MessageCircle } from 'lucide-react-native'
import { Colors } from '@/constants/colors'
import { Request } from '@/types'
import { formatDate } from '@/lib/utils'
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_BG, REQUEST_STATUS_COLOR } from '@/lib/statusConstants'

const STEPS = [
  { label: 'Menunggu', Icon: Clock },
  { label: 'Disetujui', Icon: Package },
  { label: 'Pengiriman', Icon: Truck },
  { label: 'Selesai', Icon: Star },
]

function getStepIndex(status: string) {
  if (status === 'available') return 0
  if (status === 'reserved') return 1
  if (status === 'shipping') return 2
  if (status === 'completed') return 3
  return -1
}

function ProgressBar({ stepIndex, accentColor }: { stepIndex: number; accentColor: string }) {
  return (
    <View style={{ marginTop: 14, marginBottom: 2, marginHorizontal: -16 }}>
      <View style={{ flexDirection: 'row' }}>
        {STEPS.map((step, i) => {
          const filled = stepIndex >= 0 && i <= stepIndex
          const leftActive = stepIndex >= 0 && i <= stepIndex
          const rightActive = stepIndex >= 0 && i < stepIndex
          const { Icon } = step
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {i > 0 && (
                <View style={{ position: 'absolute', left: 0, right: '50%', top: 16, height: 2, backgroundColor: leftActive ? accentColor : '#E5E7EB' }} />
              )}
              {i < 3 && (
                <View style={{ position: 'absolute', left: '50%', right: 0, top: 16, height: 2, backgroundColor: rightActive ? accentColor : '#E5E7EB' }} />
              )}
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: filled ? accentColor : '#E5E7EB', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Icon size={14} color={filled ? 'white' : '#9CA3AF'} />
              </View>
              <Text style={{ fontSize: 8, marginTop: 4, color: filled ? accentColor : '#9CA3AF', fontWeight: filled ? '700' : '400' }}>
                {step.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

type Props = {
  r: Request
  isOrg: boolean
  accentColor: string
  onPress: () => void
  onTolak: () => void
  onTerima: () => void
  onCancel: () => void
  onSudahKirim: () => void
  onSudahTerima: () => void
  onHubungi: () => void
  onBeriNilai: () => void
  hasRated: boolean
}

export function RequestCard({ r, isOrg, accentColor, onPress, onTolak, onTerima, onCancel, onSudahKirim, onSudahTerima, onHubungi, onBeriNilai, hasRated }: Props) {
  const incoming = isOrg ? r.initiated === 'donor' : r.initiated === 'org'
  const cancelled = r.status === 'cancelled'
  const stepIndex = getStepIndex(r.status)

  const imageUri = isOrg ? r.donation?.photo_url : r.org?.prof_pic
  const fallbackEmoji = isOrg ? '🎁' : '🏢'
  const fallbackBg = isOrg ? Colors.donorBg : Colors.orgBg
  const mainTitle = isOrg ? r.donation?.title : r.need?.title
  const partyName = isOrg ? r.donor?.full_name : r.org?.full_name
  const subLabel = isOrg
    ? `Untuk: ${r.need?.title ?? '—'}`
    : `Donasimu: ${r.donation?.title ?? '—'}`

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={{
        backgroundColor: 'white', borderRadius: 20, marginBottom: 12, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        opacity: cancelled ? 0.65 : 1,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: 64, height: 64 }} resizeMode="cover" />
          ) : (
            <View style={{ width: 64, height: 64, backgroundColor: fallbackBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{fallbackEmoji}</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.textDark }} numberOfLines={1}>{mainTitle}</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted }} numberOfLines={1}>{partyName}</Text>
          <Text style={{ fontSize: 11, color: Colors.textLight }} numberOfLines={1}>{subLabel}</Text>
        </View>

        <View style={{ backgroundColor: REQUEST_STATUS_BG[r.status] ?? '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {r.status === 'available' && <Clock size={10} color={REQUEST_STATUS_COLOR[r.status]} />}
          {r.status === 'shipping' && <Truck size={10} color={REQUEST_STATUS_COLOR[r.status]} />}
          {(r.status === 'reserved' || r.status === 'completed') && <CheckCircle size={10} color={REQUEST_STATUS_COLOR[r.status]} />}
          <Text style={{ fontSize: 11, fontWeight: '700', color: REQUEST_STATUS_COLOR[r.status] ?? '#9CA3AF' }}>{REQUEST_STATUS_LABEL[r.status] ?? r.status}</Text>
        </View>
      </View>

      {!cancelled && <ProgressBar stepIndex={stepIndex} accentColor={accentColor} />}

      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginTop: cancelled ? 14 : 10, marginBottom: 12 }} />

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: Colors.textLight }}>{formatDate(r.created_at)}</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {r.status === 'available' && incoming && (
            <>
              <TouchableOpacity activeOpacity={0.8} onPress={onTolak} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEE2E2' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={onTerima} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#D1FAE5' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>Terima</Text>
              </TouchableOpacity>
            </>
          )}

          {r.status === 'available' && !incoming && (
            <TouchableOpacity activeOpacity={0.8} onPress={onCancel} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEE2E2' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Batalkan</Text>
            </TouchableOpacity>
          )}

          {(r.status === 'reserved' || r.status === 'shipping') && (
            <>
              {r.status === 'reserved' && !isOrg && (
                <TouchableOpacity activeOpacity={0.8} onPress={onSudahKirim} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.donorBg, borderWidth: 1, borderColor: Colors.primary }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>Sudah Dikirim</Text>
                </TouchableOpacity>
              )}
              {r.status === 'shipping' && isOrg && (
                <TouchableOpacity activeOpacity={0.8} onPress={onSudahTerima} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.orgBg, borderWidth: 1, borderColor: Colors.orange }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.orange }}>Sudah Terima</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={0.8} onPress={onHubungi} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MessageCircle size={12} color={Colors.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textMuted }}>Hubungi</Text>
              </TouchableOpacity>
            </>
          )}

          {r.status === 'completed' && (
            hasRated ? (
              <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} color="#9CA3AF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF' }}>Sudah Dinilai</Text>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={onBeriNilai} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FEF3C7', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>Beri Nilai</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
