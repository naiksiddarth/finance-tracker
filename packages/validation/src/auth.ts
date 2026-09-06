import z from "zod"

const registerSchema = z
  .object({
    email: z.email(),
    username: z.string().min(4),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
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
