'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { AuthState, SignUpFormData, SignInFormData } from '@/types/auth'

export function useAuth(): AuthState & {
  signUp: (data: SignUpFormData) => Promise<void>
  signIn: (data: SignInFormData) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
} {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get initial session
    const getInitialSession = async () => {
      const supabase = getSupabase()
      if (!supabase.auth) return
      
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const supabase = getSupabase()
    if (!supabase.auth) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          setError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (data: SignUpFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabase()
      if (!supabase.auth) throw new Error('Authentication not available')

      // 1. Criar a empresa e obter o ID
      const { data: companyData, error: companyError } = await supabase.rpc(
        'create_company_and_get_id',
        { company_name: data.companyName } // Assumindo que o nome da empresa virá do formulário
      )

      if (companyError) throw companyError;
      if (!companyData) throw new Error('Failed to create company.');
      
      const companyId = companyData;

      // 2. Criar o usuário, passando o company_id nos metadados
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            company_id: companyId, // O gatilho no Supabase usará isso
          }
        }
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: SignInFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabase()
      if (!supabase.auth) throw new Error('Authentication not available')

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = getSupabase()
      if (!supabase.auth) throw new Error('Authentication not available')
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabase()
      if (!supabase.auth) throw new Error('Authentication not available')

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (password: string) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabase()
      if (!supabase.auth) throw new Error('Authentication not available')

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  }
}