import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { Dashboard } from "@/pages/Dashboard"
import { Placeholder } from "@/pages/Placeholder"
import { AuthContextProvider } from "@/AuthContextProvider"

export function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
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
