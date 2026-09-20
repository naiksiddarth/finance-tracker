import { createContext, useEffect, useState, type ReactNode } from "react"

import {
  apiRequest,
  setAccessToken,
  refreshAccessToken,
  AppError,
} from "@/api/client"

interface User {
  _id: string
  username: string
  email: string
}

interface AuthContextValues {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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
    } catch (err) {
      setAccessToken(null)
      setUser(null)
    } finally {
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function login(email: string, password: string) {
    setIsLoading(true)

    try {
      const res: LoginResponse = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      })
      setUser(res.user)
      setAccessToken(res.accessToken)
    } catch (err: any) {
      if (err instanceof AppError) {
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
