import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Dashboard } from "@/pages/Dashboard"
import { Placeholder } from "@/pages/Placeholder"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { AuthContextProvider } from "@/AuthContextProvider"

export function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/transactions"
              element={<Placeholder title="Transactions" />}
            />
            <Route
              path="/analytics"
              element={<Placeholder title="Analytics" />}
            />
            <Route path="/budgets" element={<Placeholder title="Budgets" />} />
            <Route
              path="/settings"
              element={<Placeholder title="Settings" />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  )
}
