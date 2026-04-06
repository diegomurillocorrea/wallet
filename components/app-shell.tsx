"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PieChart,
  Tags,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"

const nav = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ListOrdered },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/budgets", label: "Presupuestos", icon: PieChart },
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

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-400"
          >
            DAIEGO Wallet
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
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                    active
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
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
            <span className="hidden max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400 sm:inline">
              {email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:w-auto md:gap-2 md:px-3"
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
        className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
        aria-label="Móvil"
      >
        <ul className="flex items-stretch justify-around">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-600 ${
                    active
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
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
