import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { apiRequest } from "@/api/client"
import { ApiError } from "@/api/api-error"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"

interface ValidationIssue {
  path: Array<string | number>
  message: string
}

function getRegisterFieldError(error: ApiError | null, field: string) {
  if (!error) return null

  if (Array.isArray(error.data)) {
    const issue = (error.data as ValidationIssue[]).find(
      (item) => item.path[0] === field
    )

    if (issue) return issue.message
  }

  if (
    field === "email" &&
    (error.code === ERROR_CODES.DUPLICATE_EMAIL ||
      error.code === ERROR_CODES.INVALID_EMAIL)
  ) {
    return error.message
  }

  if (
    field === "username" &&
    (error.code === ERROR_CODES.DUPLICATE_USERNAME ||
      error.code === ERROR_CODES.USERNAME_TOO_SHORT)
  ) {
    return error.message
  }

  if (field === "password" && error.code === ERROR_CODES.PASSWORD_TOO_SHORT) {
    return error.message
  }

  if (
    field === "confirmPassword" &&
    error.code === ERROR_CODES.PASSWORD_CONFIRMATION_MISMATCH
  ) {
    return error.message
  }

  return null
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const navigate = useNavigate()

  const usernameError = getRegisterFieldError(error, "username")
  const emailError = getRegisterFieldError(error, "email")
  const passwordError = getRegisterFieldError(error, "password")
  const confirmPasswordError = getRegisterFieldError(error, "confirmPassword")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    if (password !== confirmPassword) {
      setError(
        new ApiError(
          400,
          ERROR_CODES.PASSWORD_CONFIRMATION_MISMATCH,
          "Passwords do not match"
        )
      )
      setIsSubmitting(false)
      return
    }
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password, confirmPassword }),
      })
      // On success, redirect to login so they can log in
      navigate("/login")
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err)
      } else {
        setError(
          new ApiError(500, ERROR_CODES.UNKNOWN_ERROR, "Registration failed")
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={cn("flex w-full max-w-sm flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (usernameError) setError(null)
                  }}
                  aria-invalid={Boolean(usernameError)}
                />
                {usernameError && <FieldError>{usernameError}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setError(null)
                  }}
                  aria-invalid={Boolean(emailError)}
                />
                {emailError && <FieldError>{emailError}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setError(null)
                  }}
                  aria-invalid={Boolean(passwordError)}
                />
                {passwordError && <FieldError>{passwordError}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmPasswordError) setError(null)
                  }}
                  aria-invalid={Boolean(confirmPasswordError)}
                />
                {confirmPasswordError && (
                  <FieldError>{confirmPasswordError}</FieldError>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Sign Up"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <a href="/login">Login</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
