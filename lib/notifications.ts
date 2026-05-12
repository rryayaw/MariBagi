import { supabase } from '@/lib/supabase'

export async function notify(
  userId: string,
  title: string,
  body: string,
  type: string,
  referenceId?: string
) {
  await supabase.rpc('insert_notification', {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_type: type,
    p_reference_id: referenceId ?? null,
  })
}
