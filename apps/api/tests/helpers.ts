import type { Response, Test } from "supertest"

interface ApiClient {
  post(url: string): Test
}

export function refreshCookie(response: Response) {
  const setCookie = response.headers["set-cookie"]
  const cookies = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie]
      : []
  const cookie = cookies.find((value) => value.startsWith("refreshToken="))

  if (!cookie) {
    throw new Error("Expected refreshToken cookie")
  }

  return cookie.split(";")[0]
}

export async function registerUser(
  request: ApiClient,
  overrides: Partial<{
    username: string
    email: string
    password: string
    confirmPassword: string
  }> = {}
) {
  const credentials = {
    username: "alice-user",
    email: "alice@example.com",
    password: "correct-horse-battery",
    confirmPassword: "correct-horse-battery",
    ...overrides,
  }
  const response = await request.post("/api/auth/register").send(credentials)

  return {
    credentials,
    response,
    accessToken: response.body.data?.accessToken as string,
    cookie: refreshCookie(response),
  }
}

export async function createTransaction(
  request: ApiClient,
  accessToken: string,
  overrides: Partial<{
    amount: number
    type: "credit" | "debit"
    date: string
  }> = {}
) {
  const transaction = {
    amount: 100,
    type: "credit" as const,
    date: "2026-10-15T12:00:00.000Z",
    ...overrides,
  }

  return request
    .post("/api/transaction")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(transaction)
}
