"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ApiError, REQUEST_FAILED, authApi, isRestartError, onAdminTwoStepRequired, onSessionEnded, retryDelay, shouldRetry, userApi } from "./api-client"
import { SESSION_ENDED_TOAST_ID, showSessionEndedOnce } from "./session-ended-toast"
import { ADMIN_TWO_STEP_SETTINGS, ADMIN_TWO_STEP_TOAST_ID } from "./admin-two-step"
import type { SignedIn, TwoStepMethod, UserDto } from "./types"

export const REAUTH_TOAST_ID = "passkeys-reauth"

showSessionEndedOnce()

export type LoginResult =
  | { status: "signed-in" }
  | { status: "two-step"; pendingToken: string; methods: TwoStepMethod[] }

interface AuthContextType {
  user: UserDto | null
  isLoading: boolean
  isAdmin: boolean
  adminNeedsTwoStep: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>
  completeSignIn: (signedIn: SignedIn) => void
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  logoutTo: (destination: string) => void
  logoutDestination: string | null
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

async function fetchMeThroughRestart(token: string): Promise<UserDto | null> {
  for (let failureCount = 0; ; failureCount++) {
    try {
      return await userApi.getMe()
    } catch (err) {
      if (!isRestartError(err) || !shouldRetry(failureCount, err as Error)) throw err
      await pause(retryDelay(failureCount))
      if (localStorage.getItem("auth-token") !== token) return null
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [user, setUser] = useState<UserDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logoutDestination, setLogoutDestination] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("auth-token")
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const userData = await fetchMeThroughRestart(token)
      if (localStorage.getItem("auth-token") !== token) return
      if (userData) setUser(userData)
    } catch (err) {
      if (localStorage.getItem("auth-token") !== token) return
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        localStorage.removeItem("auth-token")
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the token lives in localStorage, which only exists after mount
    refreshUser()
  }, [refreshUser])

  const completeSignIn = useCallback((signedIn: SignedIn) => {
    queryClient.clear()
    localStorage.setItem("auth-token", signedIn.token)
    setLogoutDestination(null)
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

  const endSession = useCallback((destination: string | null) => {
    toast.dismiss(REAUTH_TOAST_ID)
    localStorage.removeItem("auth-token")
    queryClient.clear()
    setLogoutDestination(destination)
    setUser(null)
  }, [queryClient])

  const logout = useCallback(() => endSession(null), [endSession])

  useEffect(() => {
    onSessionEnded((message) => {
      endSession(null)
      toast.error(message, { id: SESSION_ENDED_TOAST_ID })
    })
    return () => onSessionEnded(null)
  }, [endSession])

  useEffect(() => {
    onAdminTwoStepRequired((message) => {
      if (!window.location.pathname.startsWith("/admin")) return
      toast.info(message, { id: ADMIN_TWO_STEP_TOAST_ID })
      void refreshUser()
      router.replace(ADMIN_TWO_STEP_SETTINGS)
    })
    return () => onAdminTwoStepRequired(null)
  }, [refreshUser, router])

  const logoutTo = useCallback((destination: string) => endSession(destination), [endSession])

  const isAdmin = user?.authorities?.some((a) => a.name === "ROLE_ADMIN") ?? false
  const adminNeedsTwoStep = isAdmin && user?.twoStepEnabled !== true

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, adminNeedsTwoStep, login, completeSignIn, register, logout, logoutTo, logoutDestination, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
