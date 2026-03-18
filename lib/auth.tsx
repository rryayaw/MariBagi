import { supabase } from "./supabase";

export const signUp = async ({email, password, role, phone}: {email: string, password: string, role: string, phone: string}) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { role, phone }
        }
    })
    return { data, error }
}

export const signIn = async ({ email, password }: { email: string, password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}