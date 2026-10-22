import z from "zod"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
const registerSchema = z
  .object({
    email: z.email({ message: ERROR_CODES.INVALID_EMAIL }),
    name: z.string().min(3, { message: ERROR_CODES.NAME_TOO_SHORT }),
    username: z.string().min(4, { message: ERROR_CODES.USERNAME_TOO_SHORT }),
    password: z.string().min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
    confirmPassword: z
      .string()
      .min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ERROR_CODES.PASSWORD_CONFIRMATION_MISMATCH,
    path: ["confirmPassword"],
  })

const loginSchema = z
  .object({
    identifier: z.string().min(1, { message: ERROR_CODES.EMAIL_OR_USERNAME_REQUIRED }),
    password: z.string().min(6, { message: ERROR_CODES.PASSWORD_TOO_SHORT }),
  })

export { registerSchema, loginSchema }
