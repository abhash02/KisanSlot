import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, TokenResponse, FarmerRegisterPayload, LoginPayload } from '../types/auth'
import { apiRequest, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  role: 'FARMER' | 'ADMIN' | null
  isAuthenticated: boolean
  isLoading: boolean
  language: 'hi' | 'en'
  setLanguage: (lang: 'hi' | 'en') => void
  registerFarmer: (payload: FarmerRegisterPayload) => Promise<User>
  login: (payload: LoginPayload) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [language, setLanguage] = useState<'hi' | 'en'>('hi')

  // Load current user profile from backend on initial mount if token exists
  useEffect(() => {
    let isMounted = true
    const initAuth = async () => {
      const stored = getStoredToken()
      if (!stored) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const profile = await apiRequest<User>('/auth/me')
        if (isMounted) {
          setUser(profile)
          setToken(stored)
          if (profile.preferred_language === 'hi' || profile.preferred_language === 'en') {
            setLanguage(profile.preferred_language)
          }
        }
      } catch (err) {
        console.warn('Session expired or invalid, clearing stored session', err)
        clearStoredToken()
        if (isMounted) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initAuth()
    return () => {
      isMounted = false
    }
  }, [])

  const registerFarmer = useCallback(async (payload: FarmerRegisterPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const resp = await apiRequest<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setStoredToken(resp.access_token)
      setToken(resp.access_token)
      setUser(resp.user)
      return resp.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true)
    try {
      const resp = await apiRequest<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setStoredToken(resp.access_token)
      setToken(resp.access_token)
      setUser(resp.user)
      return resp.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (token) {
        await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {
          // Ignore network or token invalidation error during logout
        })
      }
    } finally {
      clearStoredToken()
      setUser(null)
      setToken(null)
    }
  }, [token])

  const value: AuthContextType = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user && !!token,
    isLoading,
    language,
    setLanguage,
    registerFarmer,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
