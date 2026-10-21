"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, authApi, userApi } from "./api-client"
import type { UserDto } from "./types"

interface AuthContextType {
  user: UserDto | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string, rememberMe?: boolean, code?: string) => Promise<{ twoFactorRequired: boolean }>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<UserDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const userData = await userApi.getMe()
      setUser(userData)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        localStorage.removeItem("auth-token")
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean, code?: string) => {
    const res = await authApi.login({ email, password, rememberMe, code })
    if (res.twoFactorRequired) {
      return { twoFactorRequired: true }
    }
    queryClient.clear()
    localStorage.setItem("auth-token", res.token!)
    setUser(res.user!)
    return { twoFactorRequired: false }
  }, [queryClient])

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register({ email, password })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth-token")
    queryClient.clear()
    setUser(null)
  }, [queryClient])

  const isAdmin = user?.authorities?.some((a) => a.name === "ROLE_ADMIN") ?? false

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
