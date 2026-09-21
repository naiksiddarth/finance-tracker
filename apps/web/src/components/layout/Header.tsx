import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Wallet,
  CalendarDays,
  ChevronDown,
  Bell,
  Moon,
  Plus,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { TransactionModal } from "../transactions/TransactionModal"

type NavLinkProps = Array<{ path: string; name: string }>

export function Header({ navLinks }: { navLinks: NavLinkProps }) {
  const location = useLocation()
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-margin">
        {/* Brand & Global Links Cluster */}
        <div className="flex items-center gap-8">
          {/* Logo / Title */}
          <Link
            to="/"
            className="flex items-center gap-2 headline-md font-bold tracking-tight text-foreground"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            Finance Tracker
          </Link>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "pt-3.5 pb-3 label-md transition-colors hover:text-foreground",
                    isActive
                      ? "border-b-2 border-primary font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Trailing Controls Cluster */}
        <div className="flex items-center gap-3">
          {/* Month Picker dropdown */}
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 items-center gap-1.5 rounded-lg border-border bg-card px-3 label-md text-foreground transition-colors hover:bg-muted sm:flex"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>October 2024</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Trailing Icon Actions */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
          >
            <Moon className="h-4 w-4" />
            <span className="sr-only">Theme mode</span>
          </Button>

          {/* Primary Action Button */}
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 label-md font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </Button>

          {/* User Profile Avatar */}
          <Avatar className="ml-1 h-8 w-8 cursor-pointer border border-border">
            <AvatarFallback className="bg-secondary label-md font-semibold text-foreground">
              AX
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
      />
    </header>
  )
}
