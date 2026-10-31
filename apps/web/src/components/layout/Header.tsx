import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Bell,
  Coins,
  LogOut,
  Menu,
  Mail,
  Moon,
  Pencil,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  CurrencySymbols,
  CurrencyValues,
  type Currency,
} from "@finance-tracker/shared/constants/transactions"

import { getProfilePictureUrl } from "@/api/config"
import { ApiError } from "@/api/api-error"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/hooks/use-auth"
import { TransactionModal } from "../transactions/TransactionModal"

type NavLinkProps = Array<{ path: string; name: string }>
const SHORTCUT_TOOLTIP_DELAY = 3000

export function Header({ navLinks }: { navLinks: NavLinkProps }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, updateCurrency, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditingCurrency, setIsEditingCurrency] = React.useState(false)
  const [currencyDraft, setCurrencyDraft] = React.useState<Currency | null>(
    null
  )
  const [currencyError, setCurrencyError] = React.useState<string | null>(null)
  const [isUpdatingCurrency, setIsUpdatingCurrency] = React.useState(false)
  const displayName = user?.name?.trim() || "Unnamed user"

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  function startCurrencyEdit() {
    setCurrencyDraft(user?.currency ?? null)
    setCurrencyError(null)
    setIsEditingCurrency(true)
  }

  function closeCurrencyEdit() {
    setIsEditingCurrency(false)
    setCurrencyError(null)
  }

  React.useEffect(() => {
    if (!isEditingCurrency) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCurrencyEdit()
      }
    }

    document.addEventListener("keydown", handleEscape, true)
    return () => document.removeEventListener("keydown", handleEscape, true)
  }, [isEditingCurrency])

  async function handleCurrencyChange(value: string | null) {
    if (!value) {
      return
    }

    const nextCurrency = value as Currency
    setCurrencyDraft(nextCurrency)
    setCurrencyError(null)
    setIsUpdatingCurrency(true)

    try {
      await updateCurrency(nextCurrency)
      setIsEditingCurrency(false)
    } catch (error: unknown) {
      setCurrencyError(
        error instanceof ApiError ? error.message : "Unable to update currency"
      )
    } finally {
      setIsUpdatingCurrency(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-margin">
        {/* Brand & Global Links Cluster */}
        <div className="flex items-center gap-4 md:gap-10">
          {/* Logo / Title */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 text-base font-bold tracking-tight whitespace-nowrap text-foreground sm:gap-2 sm:headline-md"
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
        <div className="flex items-center gap-2">
          {/* Trailing Icon Actions */}
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 rounded-lg border-border bg-card text-muted-foreground transition-colors hover:bg-muted sm:inline-flex"
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
          <ShortcutTooltip shortcut="N">
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 label-md font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          </ShortcutTooltip>

          {/* Mobile Navigation Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open navigation menu"
              title="Open navigation menu"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <Menu className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path

                return (
                  <DropdownMenuItem
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={cn(
                      "py-1.5 text-sm font-normal",
                      isActive &&
                        "bg-accent font-semibold text-accent-foreground"
                    )}
                  >
                    {link.name}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Avatar */}
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) {
                closeCurrencyEdit()
              }
            }}
          >
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
                  <span className="shrink-0">Currency</span>
                  {isEditingCurrency ? (
                    <Select
                      value={currencyDraft ?? undefined}
                      onValueChange={(value) => {
                        void handleCurrencyChange(value)
                      }}
                      disabled={isUpdatingCurrency}
                    >
                      <SelectTrigger
                        size="sm"
                        aria-invalid={currencyError ? true : undefined}
                        className="min-w-20 flex-1"
                      >
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {CurrencyValues.map((availableCurrency) => (
                          <SelectItem
                            key={availableCurrency}
                            value={availableCurrency}
                          >
                            {availableCurrency} (
                            {CurrencySymbols[availableCurrency]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">
                      {user?.currency ?? "Unavailable"}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Edit currency"
                    title="Edit currency"
                    onClick={startCurrencyEdit}
                    className="text-muted-foreground"
                  >
                    <Pencil />
                  </Button>
                </div>
                {currencyError && isEditingCurrency && (
                  <p
                    className="mt-1 ml-6 text-xs text-destructive"
                    role="alert"
                  >
                    {currencyError}
                  </p>
                )}
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

function ShortcutTooltip({
  shortcut,
  children,
}: {
  shortcut: string
  children: React.ReactNode
}) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTooltipTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  function startTooltipTimer() {
    timeoutRef.current = setTimeout(
      () => setIsVisible(true),
      SHORTCUT_TOOLTIP_DELAY
    )
  }

  React.useEffect(() => clearTooltipTimer, [])

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={startTooltipTimer}
      onMouseLeave={clearTooltipTimer}
    >
      {children}
      {isVisible && (
        <span
          role="tooltip"
          className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
        >
          Shortcut: {shortcut}
        </span>
      )}
    </span>
  )
}
