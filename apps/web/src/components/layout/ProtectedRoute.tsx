import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../../AuthContextProvider"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext)

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
