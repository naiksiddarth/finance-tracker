import z from "zod"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
const registerSchema = z
  .object({
    email: z.email({ message: ERROR_CODES.INVALID_EMAIL }),
    username: z.string().min(4, { message: ERROR_CODES.USERNAME_TOO_SHORT }),
    password: z.string().min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_CODES.PASSWORD_CONFIRMATION_MISMATCH,
    path: ["confirmPassword"],
  })

const loginSchema = z
  .object({
    email: z.email().optional(),
    username: z.string().optional(),
    password: z.string().min(6),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username must be present",
    path: ["email"],
  })

export { registerSchema, loginSchema }
