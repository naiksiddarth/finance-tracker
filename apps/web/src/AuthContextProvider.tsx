import { createContext, useEffect, useState, type ReactNode } from "react"

import { apiRequest, setAccessToken, refreshAccessToken } from "@/api/client"
import { ApiError } from "@/api/api-error"

interface User {
  _id: string
  username: string
  email: string
}

interface AuthContextValues {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

interface LoginCredentials {
  email?: string
  username?: string
  password: string
}

interface LoginResponse {
  accessToken: string
  user: User
}

export const AuthContext = createContext<AuthContextValues | null>(null)

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function checkAuth() {
    try {
      const data = await refreshAccessToken()
      setUser(data.user)
    } catch {
      setAccessToken(null)
      setUser(null)
    } finally {
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void checkAuth()
    })
  }, [])

  async function login(credentials: LoginCredentials) {
    setIsLoading(true)

    try {
      const res: LoginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
      setUser(res.user)
      setAccessToken(res.accessToken)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err
      }

      setAccessToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  //update later for loggout user
  async function logout() {
    setUser(null)
    setAccessToken(null)
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, logout }}
    >
      {isInitialized && children}
    </AuthContext.Provider>
  )
}
