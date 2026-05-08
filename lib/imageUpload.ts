import * as Crypto from 'expo-crypto'
import { supabase } from '@/lib/supabase'

export async function uploadImage(uri: string, bucket: string, userId: string): Promise<string | null> {
  try {
    const ext = uri.startsWith('blob:') ? 'jpg' : (uri.split('.').pop() ?? 'jpg')
    const filePath = `${userId}/${Crypto.randomUUID()}.${ext}`
    const blob = await (await fetch(uri)).blob()
    const { error } = await supabase.storage.from(bucket).upload(filePath, blob, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return `${data.publicUrl}?t=${Date.now()}`
  } catch {
    return null
  }
}
