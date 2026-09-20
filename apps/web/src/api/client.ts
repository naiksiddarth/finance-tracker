import { API_BASE_URL } from "@/api/config"
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
        throw new Error("Failed to refresh access token")
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
    console.log(`${API_BASE_URL}${path}`)
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
      throw new Error("Authentication required")
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}
