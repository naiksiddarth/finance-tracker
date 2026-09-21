import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@workspace/ui/lib/utils"
import { ERROR_CODES } from "@finance-tracker/shared/constants/errorCodes"
import { ApiError } from "@/api/api-error"

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
import { AuthContext } from "../../AuthContextProvider"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const auth = useContext(AuthContext)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!auth) return

    setError(null)
    setIsSubmitting(true)
    try {
      await auth.login(email, password)
      navigate("/")
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err)
      } else {
        setError(
          new ApiError(500, ERROR_CODES.UNKNOWN_ERROR, "Unable to log in")
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
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
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
                    if (error?.code === ERROR_CODES.NOT_FOUND) {
                      setError(null)
                    }
                  }}
                  aria-invalid={error?.code === ERROR_CODES.NOT_FOUND}
                />
                {error?.code === ERROR_CODES.NOT_FOUND && (
                  <FieldError>Email does not exist</FieldError>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error?.code === ERROR_CODES.INVALID_PASSWORD) {
                      setError(null)
                    }
                  }}
                  aria-invalid={error?.code === ERROR_CODES.INVALID_PASSWORD}
                />

                {error?.code === ERROR_CODES.INVALID_PASSWORD && (
                  <FieldError>Invalid password</FieldError>
                )}
              </Field>
              {error &&
                error.code !== ERROR_CODES.NOT_FOUND &&
                error.code !== ERROR_CODES.INVALID_PASSWORD && (
                  <FieldError>{error.message}</FieldError>
                )}
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/register">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
