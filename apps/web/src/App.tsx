import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Dashboard } from "@/pages/Dashboard"
import { Transactions } from "@/pages/Transactions"
import { Placeholder } from "@/pages/Placeholder"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { Landing } from "@/pages/Landing"
import { AuthContextProvider } from "@/AuthContextProvider"

export function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Landing />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route
              path="/analytics"
              element={<Placeholder title="Analytics" />}
            />
            <Route path="/budgets" element={<Placeholder title="Budgets" />} />
            <Route
              path="/settings"
              element={<Placeholder title="Settings" />}
            />
            <Route path="*" element={<Placeholder title="Page not found" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  )
}
