import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Menu,
  ReceiptText,
  Tags,
  WalletCards,
  X,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { Link, Navigate } from "react-router-dom"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { useAuth } from "@/hooks/use-auth"

const sampleTransactions = [
  {
    label: "Monthly salary",
    category: "Income",
    amount: "+ $3,710",
    positive: true,
  },
  {
    label: "Rent payment",
    category: "Housing",
    amount: "- $1,450",
    positive: false,
  },
  {
    label: "Grocery run",
    category: "Groceries",
    amount: "- $124.50",
    positive: false,
  },
]

const features = [
  {
    icon: ReceiptText,
    title: "Transaction management",
    description:
      "Record income and expenses in one place, with the details that help you remember them.",
  },
  {
    icon: Tags,
    title: "Useful categories",
    description:
      "Group transactions so it is easier to see where your everyday spending goes.",
  },
  {
    icon: BarChart3,
    title: "Clear monthly views",
    description:
      "Review summaries and simple charts for a more grounded view of monthly cash flow.",
  },
]

function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-semibold tracking-tight"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <WalletCards className="size-4" />
      </span>
      <span>Finance Tracker</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        className="absolute -inset-4 rounded-[2rem] bg-primary/5 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-2xl shadow-primary/10">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive/70" />
            <span className="size-2 rounded-full bg-yellow-500/70" />
            <span className="size-2 rounded-full bg-success/70" />
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Personal workspace · Sample data
          </span>
          <div className="size-6 rounded-full bg-primary/10" />
        </div>
        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.05fr_1.7fr]">
          <div>
            <p className="text-sm text-muted-foreground">October overview</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              $3,574.80
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Net cash flow · sample workspace
            </p>
            <div className="mt-6 flex h-28 items-end gap-2 rounded-xl border border-border bg-muted/25 px-4 py-4">
              {[42, 68, 51, 82, 61, 76, 58, 88, 70, 94, 65, 78].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-sm bg-primary/20 transition-colors duration-300 hover:bg-primary/60"
                    style={{ height: `${height}%` }}
                  />
                )
              )}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
              <span>Income</span>
              <span>Expenses</span>
              <span>Cash flow</span>
            </div>
          </div>
          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Recent transactions</p>
                <p className="text-xs text-muted-foreground">
                  A quick look at your activity
                </p>
              </div>
              <ReceiptText className="size-4 text-muted-foreground" />
            </div>
            <div className="divide-y divide-border">
              {sampleTransactions.map((transaction) => (
                <div
                  key={transaction.label}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {transaction.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.category}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-xs ${transaction.positive ? "text-success" : "text-foreground"}`}
                  >
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
              Sample data for illustration
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  const { isAuthenticated, isLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav
            className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
            aria-label="Main navigation"
          >
            <a
              className="transition-colors hover:text-foreground"
              href="#features"
            >
              Features
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="#about"
            >
              About
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href="https://github.com/naiksiddarth/finance-tracker"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              to="/login"
            >
              Log in
            </Link>
            <Link className={buttonVariants({ size: "sm" })} to="/register">
              Get started <ArrowRight />
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <nav
            className="border-t border-border px-5 py-4 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-4 text-sm">
              <a href="#features" onClick={() => setMenuOpen(false)}>
                Features
              </a>
              <a href="#about" onClick={() => setMenuOpen(false)}>
                About
              </a>
              <a
                href="https://github.com/naiksiddarth/finance-tracker"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <div className="flex gap-2 pt-2">
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  to="/login"
                >
                  Log in
                </Link>
                <Link className={buttonVariants({ size: "sm" })} to="/register">
                  Get started
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-20 pb-20 text-center sm:pt-28 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              <CircleDollarSign className="size-3.5 text-success" />A simple
              tool for everyday finances
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Keep track of where your money goes.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A simple personal finance tracker to record transactions, organize
              expenses, and get a clearer picture of your monthly spending.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "lg" })} to="/register">
                Get started <ArrowRight />
              </Link>
              <a
                className={buttonVariants({ variant: "outline", size: "lg" })}
                href="#features"
              >
                Explore features
              </a>
            </div>
          </div>
          <div className="mt-16 sm:mt-20">
            <DashboardPreview />
          </div>
        </section>

        <section id="features" className="border-y border-border bg-muted/25">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
            <div className="max-w-xl">
              <SectionLabel>What’s inside</SectionLabel>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                The essentials, without the noise.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                A focused workspace for recording what happened and spotting
                useful patterns over time.
              </p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="bg-background p-6 transition-colors hover:bg-muted/40 sm:p-8"
                >
                  <div className="mb-8 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28"
        >
          <div>
            <SectionLabel>About the project</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight">
              Made for a practical problem.
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-xl leading-8 tracking-tight text-foreground/90">
              Built as a personal project to explore full-stack development
              while solving a practical problem: keeping track of everyday
              finances.
            </p>
            <p className="mt-5 leading-7 text-muted-foreground">
              Finance Tracker is independently built software, designed to keep
              the basics of personal finance in one calm, understandable place.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground"
              href="https://github.com/naiksiddarth/finance-tracker"
              target="_blank"
              rel="noreferrer"
            >
              View the project on GitHub <ArrowRight className="size-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Logo />
          <div className="flex items-center gap-5">
            <a className="hover:text-foreground" href="#about">
              About
            </a>
            <a
              className="hover:text-foreground"
              href="https://github.com/naiksiddarth/finance-tracker"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <span>© {new Date().getFullYear()} Finance Tracker</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
