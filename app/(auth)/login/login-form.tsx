"use client"

import { Suspense, useState } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Footer } from "@/components/footer"
import { DaiegoLogo } from "@/components/daiego-logo"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isRecovery = searchParams.get("type") === "recovery"
  const urlError = searchParams.get("error")
  const displayError = error ?? (urlError ? safeDecodeURIComponent(urlError) : null)
  const nextParam = searchParams.get("next")
  const oauthNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    const next = searchParams.get("next")
    const redirectTo =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
    router.refresh()
    router.push(redirectTo)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-70"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-forest/25 blur-3xl dark:bg-butter/20" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-butter/80 blur-3xl dark:bg-forest/40" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-forest/15 blur-3xl dark:bg-butter/10" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
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
                Wallet
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Entrá con Google o con tu correo y contraseña
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <GoogleAuthButton
              nextPath={oauthNext}
              disabled={isLoading}
              onError={(message) => setError(message)}
            />
            <div className="flex items-center gap-3" role="separator" aria-label="O continuar con correo">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                o correo
              </span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <Field>
              <Label>Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                required
                disabled={isLoading}
                aria-label="Dirección de correo electrónico"
                invalid={Boolean(displayError)}
              />
            </Field>

            <Field>
              <Label>Contraseña</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRecovery ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                aria-label="Contraseña"
                invalid={Boolean(displayError)}
              />
              <CheckboxField className="mt-3">
                <Checkbox
                  color="emerald"
                  checked={showPassword}
                  onChange={setShowPassword}
                  disabled={isLoading}
                  name="show-password"
                />
                <Label>Mostrar contraseña</Label>
              </CheckboxField>
            </Field>

            {displayError ? <ErrorMessage>{displayError}</ErrorMessage> : null}

            {message ? (
              <div
                role="status"
                className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                {message}
              </div>
            ) : null}

            <Button
              type="submit"
              color="emerald"
              disabled={isLoading}
              className="w-full"
              aria-busy={isLoading}
              aria-label="Iniciar sesión"
            >
              {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
            </Button>
          </form>
        </motion.main>
      </div>
      <Footer />
    </div>
  )
}

export function LoginFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <main className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-3" role="group" aria-label="DAIEGO Wallet">
              <DaiegoLogo width={56} height={56} className="h-12 w-12 shrink-0 object-contain" />
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Wallet</h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando…</p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

export function LoginPageContent() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
