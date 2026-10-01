import request from "supertest"
import { describe, expect, it } from "vitest"
import jwt from "jsonwebtoken"

import { app } from "../src/server.ts"
import { User } from "@finance-tracker/db/user"
import { registerUser } from "./helpers.ts"

describe("authentication API", () => {
  it("registers a user, hashes the password, stores a refresh token, and omits secrets", async () => {
    const result = await registerUser(request(app))

    expect(result.response.status).toBe(201)
    expect(result.response.body).toMatchObject({
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: {
        accessToken: expect.any(String),
        userWithoutPassword: {
          username: result.credentials.username,
          email: result.credentials.email,
          currency: "USD",
        },
      },
    })
    expect(result.response.body.data.userWithoutPassword).not.toHaveProperty(
      "password"
    )
    expect(result.response.body.data.userWithoutPassword).not.toHaveProperty(
      "refreshToken"
    )

    const user = await User.findOne({ email: result.credentials.email }).lean()
    expect(user).not.toBeNull()
    expect(user?.password).not.toBe(result.credentials.password)
    expect(user?.password).toMatch(/^\$2[aby]?\$/)
    expect(user?.refreshToken).toBe(result.cookie.split("=")[1])
  })

  it("rejects duplicate email addresses with a stable conflict response", async () => {
    await registerUser(request(app))

    const response = await request(app).post("/api/auth/register").send({
      username: "different-user",
      email: "alice@example.com",
      password: "correct-horse-battery",
      confirmPassword: "correct-horse-battery",
    })

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      statusCode: 409,
      success: false,
      code: "DUPLICATE_EMAIL",
      message: "Email is already registered",
      data: null,
    })
  })

  it("reports register validation failures with field paths and stable codes", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "abc",
      email: "not-an-email",
      password: "short",
      confirmPassword: "different",
    })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      statusCode: 400,
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
    })
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["username"],
          code: "USERNAME_TOO_SHORT",
        }),
        expect.objectContaining({ path: ["email"], code: "INVALID_EMAIL" }),
        expect.objectContaining({
          path: ["password"],
          code: "PASSWORD_TOO_SHORT",
        }),
        expect.objectContaining({
          path: ["confirmPassword"],
          code: "PASSWORD_CONFIRMATION_MISMATCH",
        }),
      ])
    )
  })

  it("logs in by email and username and returns fresh credentials", async () => {
    const registered = await registerUser(request(app))

    const emailLogin = await request(app).post("/api/auth/login").send({
      email: registered.credentials.email,
      password: registered.credentials.password,
    })
    const usernameLogin = await request(app).post("/api/auth/login").send({
      username: registered.credentials.username,
      password: registered.credentials.password,
    })

    expect(emailLogin.status).toBe(200)
    expect(emailLogin.body).toMatchObject({
      statusCode: 200,
      success: true,
      data: {
        accessToken: expect.any(String),
        userWithoutPassword: {
          email: registered.credentials.email,
          username: registered.credentials.username,
        },
      },
    })
    expect(emailLogin.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("HttpOnly")])
    )
    expect(usernameLogin.status).toBe(200)
    expect(usernameLogin.body.data.userWithoutPassword).not.toHaveProperty(
      "password"
    )
  })

  it("rejects an unknown account and an incorrect password", async () => {
    await registerUser(request(app))

    const unknown = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "correct-horse-battery",
    })
    const incorrect = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "wrong-password",
    })

    expect(unknown.status).toBe(404)
    expect(unknown.body).toMatchObject({
      statusCode: 404,
      success: false,
      code: "NOT_FOUND",
    })
    expect(incorrect.status).toBe(401)
    expect(incorrect.body).toMatchObject({
      statusCode: 401,
      success: false,
      code: "INVALID_PASSWORD",
    })
  })

  it("refreshes an access token only with the issued refresh cookie", async () => {
    const registered = await registerUser(request(app))

    const refreshed = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", registered.cookie)

    expect(refreshed.status).toBe(200)
    expect(refreshed.body).toMatchObject({
      statusCode: 200,
      success: true,
      message: "Access Token Refreshed",
      data: {
        accessToken: expect.any(String),
        user: {
          _id: registered.response.body.data.userWithoutPassword._id,
          email: registered.credentials.email,
        },
      },
    })
    expect(refreshed.body.data.user).not.toHaveProperty("password")
    expect(refreshed.body.data.user).not.toHaveProperty("refreshToken")

    const missingCookie = await request(app).post("/api/auth/refresh")
    expect(missingCookie.status).toBe(401)
    expect(missingCookie.body).toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    })
  })

  it("rejects missing, malformed, and tampered access tokens", async () => {
    const missing = await request(app).get("/api/transaction")
    const malformed = await request(app)
      .get("/api/transaction")
      .set("Authorization", "Basic not-a-bearer-token")
    const tampered = await request(app)
      .get("/api/transaction")
      .set("Authorization", "Bearer not.a.jwt")

    for (const response of [missing, malformed, tampered]) {
      expect(response.status).toBe(401)
      expect(response.body).toMatchObject({
        statusCode: 401,
        success: false,
        code: "UNAUTHORIZED",
      })
    }
  })

  it("rejects refresh tokens signed with the wrong secret and access tokens in request bodies", async () => {
    const user = await registerUser(request(app))
    const wrongRefresh = jwt.sign(
      { _id: user.response.body.data.userWithoutPassword._id },
      "wrong-secret",
      { expiresIn: "7d" }
    )

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${wrongRefresh}`)
    const bodyToken = await request(app)
      .get("/api/transaction")
      .send({ accessToken: user.accessToken })

    expect(refresh.status).toBe(401)
    expect(refresh.body).toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    })
    expect(bodyToken.status).toBe(401)
    expect(bodyToken.body).toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    })
  })
})
