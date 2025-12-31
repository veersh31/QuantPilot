'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { UserProfile, TradingMode } from '@/lib/types/user'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  profile: UserProfile | null
  supabaseUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  currentMode: TradingMode
  hasCompletedOnboarding: boolean
  setProfile: (profile: UserProfile) => void
  setCurrentMode: (mode: TradingMode) => void
  completeOnboarding: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useLocalStorage<UserProfile | null>('quantpilot-profile', null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>('quantpilot-onboarding', false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMode, setCurrentMode] = useState<TradingMode>('paper')

  useEffect(() => {
    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setSupabaseUser(user)

      // If user is authenticated with Supabase, create profile automatically and skip onboarding
      if (user && !profile) {
        const newProfile: UserProfile = {
          id: user.id,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          tradingMode: 'paper',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            defaultMode: 'paper',
            theme: 'system',
            notifications: true
          }
        }
        setProfile(newProfile)
        setHasCompletedOnboarding(true)
      }

      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setSupabaseUser(user)

      // Auto-create profile for new Supabase users
      if (user && !profile) {
        const newProfile: UserProfile = {
          id: user.id,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          tradingMode: 'paper',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            defaultMode: 'paper',
            theme: 'system',
            notifications: true
          }
        }
        setProfile(newProfile)
        setHasCompletedOnboarding(true)
      }

      // Clear profile when user logs out
      if (!user) {
        setProfile(null)
        setHasCompletedOnboarding(false)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    // Initialize mode from profile
    if (profile) {
      setCurrentMode(profile.tradingMode)
    }
  }, [profile])

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true)
  }

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    setProfile(null)
    setHasCompletedOnboarding(false)
    setCurrentMode('paper')
    setSupabaseUser(null)
  }

  const handleSetCurrentMode = (mode: TradingMode) => {
    setCurrentMode(mode)
    if (profile) {
      setProfile({
        ...profile,
        tradingMode: mode,
        preferences: {
          ...profile.preferences,
          defaultMode: mode
        }
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        profile,
        supabaseUser,
        isAuthenticated: !!supabaseUser || (!!profile && hasCompletedOnboarding),
        isLoading,
        currentMode,
        hasCompletedOnboarding: !!supabaseUser || hasCompletedOnboarding,
        setProfile,
        setCurrentMode: handleSetCurrentMode,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
