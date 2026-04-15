"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PieChart,
  Tags,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DaiegoLogo } from "@/components/daiego-logo"
import { ThemeToggle } from "@/components/theme-toggle"

const nav = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ListOrdered },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/budgets", label: "Presupuestos", icon: PieChart },
  { href: "/credit-cards", label: "Tarjetas", icon: CreditCard },
] as const

interface AppShellProps {
  children: React.ReactNode
  email: string | null
}

export const AppShell = ({ children, email }: AppShellProps) => {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const navFocus =
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            href="/dashboard"
            className={`flex shrink-0 items-center rounded-xl py-0.5 ${navFocus}`}
            aria-label="DAIEGO Wallet — ir al resumen"
          >
            <DaiegoLogo
              className="size-7 shrink-0 rounded-md object-contain ring-1 ring-zinc-200/80 ring-offset-0 dark:ring-white/15 sm:size-8"
              priority
              sizes="(max-width: 640px) 28px, 32px"
            />
          </Link>
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Principal"
          >
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${navFocus} ${
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50"
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden max-w-[160px] truncate text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
              {email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className={`inline-flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 md:w-auto md:gap-2 md:px-3 ${navFocus}`}
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-5" aria-hidden />
              <span className="hidden text-sm font-medium md:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <nav
        className="sticky bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden"
        aria-label="Móvil"
      >
        <ul className="flex items-stretch justify-around">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${
                    active
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
