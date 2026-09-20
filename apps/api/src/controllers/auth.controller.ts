import type { CookieOptions } from "express"
import { User } from "@finance-tracker/db/user"
import { asyncHandler } from "../utils/async-handler.ts"
import { ApiResponse } from "../utils/api-response.ts"
import { ApiError } from "../utils/api-errors.ts"
import { DBERRORS } from "@finance-tracker/shared/constants/errorCodes"

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth/refresh",
}

const registerHandler = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body
  const user = await User.create({
    username,
    email,
    password,
  })

  // we dont have a better place to store this for now
  const refreshToken = await user.generateRefreshToken()
  const accessToken = user.generateAccessToken()

  const userObject = user.toObject()
  const {
    password: _password,
    refreshToken: _refreshToken,
    ...userWithoutPassword
  } = userObject // stripping password and refresh token

  res
    .status(201)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(
        201,
        { userWithoutPassword, accessToken },
        "User registered successfully"
      )
    )
})

const loginHandler = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  const user = await User.findOne(email ? { email } : { username })

  if (!user) {
    throw new ApiError(404, "", DBERRORS.NOT_FOUND)
  }
  const matchPassword = await user.comparePassword(password)

  if (!matchPassword) {
    throw new ApiError(401, "", DBERRORS.INVALID_PASSWORD)
  }

  const userObject = user.toObject()
  const {
    password: _password,
    refreshToken: _refreshToken,
    ...userWithoutPassword
  } = userObject // stripping password and refresh token

  const refreshToken = await user.generateRefreshToken()
  const accessToken = user.generateAccessToken()

  res
    .status(200)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(
        200,
        { userWithoutPassword, accessToken },
        "User logged in successfully"
      )
    )
})

const refreshHandler = asyncHandler(async (req, res) => {
  // get the refresh token from the cookie
  const liveUser = await User.findById(req.user?._id)
  const incomingRefreshToken = req.cookies?.refreshToken

  if (!liveUser) {
    throw new ApiError(404, DBERRORS.NOT_FOUND, "User not found")
  }

  if (incomingRefreshToken !== liveUser?.refreshToken) {
    throw new ApiError(401, DBERRORS.UNAUTHORIZED, "Refresh token is expired ")
  }

  const accessToken = liveUser?.generateAccessToken()
  const {
    refreshToken: _refreshToken,
    password: _password,
    ...userWithoutPassword
  } = liveUser
  res.json(
    new ApiResponse(
      200,
      { accessToken, user: userWithoutPassword },
      "Access Token Refreshed"
    )
  )
})

export { registerHandler, loginHandler, refreshHandler }
