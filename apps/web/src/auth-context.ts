import { createContext } from "react"
import type { Currency } from "@finance-tracker/shared/constants/transactions"

export interface User {
  _id: string
  username: string
  email: string
  currency: Currency
}

export interface LoginCredentials {
  email?: string
  username?: string
  password: string
}

export interface AuthContextValues {
  user: User | null
  currency: Currency
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValues | null>(null)
