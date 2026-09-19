import { Outlet } from "react-router-dom"

import { Header } from "@/components/layout/Header"

export function AppLayout() {
  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Transactions", path: "/transactions" },
    { name: "Analytics", path: "/analytics" },
    { name: "Budgets", path: "/budgets" },
    { name: "Settings", path: "/settings" },
  ]

  return (
    <div className="bg-surface flex min-h-screen flex-col body-md text-foreground antialiased selection:bg-secondary">
      <Header navLinks={navLinks} />

      {/* MAIN WORKSPACE CANVAS */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-margin py-6">
        <Outlet />
      </main>
    </div>
  )
}
