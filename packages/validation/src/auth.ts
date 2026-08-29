import z from "zod"

const registerSchema = z.object({
    email: z.email(),
    username: z.string().min(4),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
})

export { registerSchema, loginSchema }