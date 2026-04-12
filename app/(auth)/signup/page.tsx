"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/hooks/use-theme"
import { Footer } from "@/components/footer"
import { DaiegoLogo } from "@/components/daiego-logo"
import { GoogleAuthButton } from "@/components/google-auth-button"

export default function SignupPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const inputClass =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setOauthError(null)
    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage(
      "Revisá tu correo para confirmar la cuenta (si tenés confirmación activada en Supabase). Podés intentar iniciar sesión."
    )
    router.refresh()
  }

  const isSuccessMessage = Boolean(message?.includes("Revisá"))

  const displayAlert = oauthError ?? (message && !isSuccessMessage ? message : null)
  const displayStatus = isSuccessMessage ? message : null

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-70"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl dark:bg-amber-400/10" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-950"
          aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
          tabIndex={0}
        >
          {theme === "light" ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>

        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-xl sm:p-10"
        >
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-3" role="group" aria-label="DAIEGO Wallet">
              <DaiegoLogo
                width={56}
                height={56}
                priority
                className="h-12 w-12 shrink-0 object-contain"
              />
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Crear cuenta
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Google crea tu cuenta al instante; el correo es opcional.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <GoogleAuthButton
              variant="signup"
              disabled={loading}
              onError={(msg) => {
                setOauthError(msg)
                setMessage(null)
              }}
            />
            <div className="flex items-center gap-3" role="separator" aria-label="O registrarse con correo">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                o correo
              </span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                disabled={loading}
                className={inputClass}
                aria-label="Dirección de correo electrónico"
                aria-invalid={Boolean(displayAlert)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className={inputClass}
                aria-label="Contraseña"
                aria-invalid={Boolean(displayAlert)}
              />
              <div className="mt-2 flex items-center">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-zinc-300 accent-emerald-600 transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2 disabled:opacity-50 dark:border-zinc-600 dark:accent-emerald-500 dark:focus:ring-emerald-500/30 dark:focus:ring-offset-zinc-900"
                  aria-label="Mostrar contraseña"
                />
                <label htmlFor="show-password" className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Mostrar contraseña
                </label>
              </div>
            </div>

            {displayAlert ? (
              <div
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
              >
                {displayAlert}
              </div>
            ) : null}

            {displayStatus ? (
              <div
                role="status"
                className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                {displayStatus}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 font-medium text-white transition-all duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus:ring-offset-zinc-900"
              aria-busy={loading}
              aria-label="Registrarme"
            >
              {loading ? "Creando…" : "Registrarme"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              Iniciar sesión
            </Link>
          </p>
        </motion.main>
      </div>
      <Footer />
    </div>
  )
}
