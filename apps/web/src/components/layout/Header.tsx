import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Bell,
  Coins,
  LogOut,
  Mail,
  Moon,
  Plus,
  Sun,
  Wallet,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { getProfilePictureUrl } from "@/api/config"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/hooks/use-auth"
import { TransactionModal } from "../transactions/TransactionModal"

type NavLinkProps = Array<{ path: string; name: string }>

export function Header({ navLinks }: { navLinks: NavLinkProps }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const displayName = "Unnamed user"

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

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
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label={
              resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="h-8 w-8 rounded-lg border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
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
          <DropdownMenu>
            <DropdownMenuTrigger
              className="ml-1 rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open profile menu"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage
                  src={getProfilePictureUrl(user?.profilePicture)}
                  alt={`${displayName} profile picture`}
                />
                <AvatarFallback className="bg-secondary label-md font-semibold text-foreground">
                  {user?.username?.slice(0, 2).toUpperCase() ?? "AX"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage
                    src={getProfilePictureUrl(user?.profilePicture)}
                    alt={`${displayName} profile picture`}
                  />
                  <AvatarFallback className="bg-secondary text-sm font-semibold text-foreground">
                    {user?.username?.slice(0, 2).toUpperCase() ?? "AX"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.username
                      ? `@${user.username}`
                      : "Username unavailable"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 px-2 py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {user?.email ?? "Email unavailable"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5" />
                  <span>Currency: {user?.currency ?? "Unavailable"}</span>
                </div>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void handleLogout()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
