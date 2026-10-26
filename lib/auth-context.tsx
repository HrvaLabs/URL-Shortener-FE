"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, REQUEST_FAILED, authApi, userApi } from "./api-client"
import type { SignedIn, TwoStepMethod, UserDto } from "./types"

export type LoginResult =
  | { status: "signed-in" }
  | { status: "two-step"; pendingToken: string; methods: TwoStepMethod[] }

interface AuthContextType {
  user: UserDto | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>
  completeSignIn: (signedIn: SignedIn) => void
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
    void Promise.resolve().then(refreshUser)
  }, [refreshUser])

  const completeSignIn = useCallback((signedIn: SignedIn) => {
    queryClient.clear()
    localStorage.setItem("auth-token", signedIn.token)
    setUser(signedIn.user)
  }, [queryClient])

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean): Promise<LoginResult> => {
    const response = await authApi.login({ email, password, rememberMe })
    if (response.twoStepRequired && response.pendingToken) {
      return { status: "two-step", pendingToken: response.pendingToken, methods: response.methods ?? [] }
    }
    if (!response.token || !response.user) throw new Error(REQUEST_FAILED)
    completeSignIn({ token: response.token, user: response.user })
    return { status: "signed-in" }
  }, [completeSignIn])

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
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, completeSignIn, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
