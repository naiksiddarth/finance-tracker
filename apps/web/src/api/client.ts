import { API_BASE_URL } from "@/api/config"
import { ApiError } from "@/api/api-error"
import {
  ERROR_CODES,
  type ErrorCode,
} from "@finance-tracker/shared/constants/errorCodes"

export { ApiError as AppError }

interface User {
  _id: string
  username: string
  email: string
}

let accessToken: string | null = null
let refreshPromise: Promise<{
  accessToken: string
  user: User
}> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export async function refreshAccessToken(): Promise<{
  accessToken: string
  user: User
}> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError(
          response.status,
          ERROR_CODES.UNAUTHORIZED,
          "Failed to refresh access token",
          null
        )
      }

      const data = await response.json()

      setAccessToken(data.accessToken)

      return data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  async function makeRequest() {
    const headers = new Headers(options.headers)

    headers.set("Content-Type", "application/json")

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })
  }

  let response = await makeRequest()

  // Access token expired
  if (response.status === 401 && !path.includes("/auth/")) {
    try {
      await refreshAccessToken()
      response = await makeRequest()
    } catch {
      setAccessToken(null)
      throw new ApiError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication required",
        null
      )
    }
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as {
      code?: ErrorCode
      message?: string
      data?: unknown
    } | null

    throw new ApiError(
      response.status,
      errorData?.code ?? ERROR_CODES.UNKNOWN_ERROR,
      errorData?.message ?? `HTTP error ${response.status}`,
      errorData?.data ?? null
    )
  }

  return response.json()
}
