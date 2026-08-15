"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Footer } from "@/components/footer"
import { DaiegoLogo } from "@/components/daiego-logo"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { TextLink } from "@/components/ui/text"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

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
            <Field>
              <Label>Correo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@ejemplo.com"
                disabled={loading}
                aria-label="Dirección de correo electrónico"
                invalid={Boolean(displayAlert)}
              />
            </Field>

            <Field>
              <Label>Contraseña</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                aria-label="Contraseña"
                invalid={Boolean(displayAlert)}
              />
              <CheckboxField className="mt-3">
                <Checkbox
                  color="emerald"
                  checked={showPassword}
                  onChange={setShowPassword}
                  disabled={loading}
                  name="show-password"
                />
                <Label>Mostrar contraseña</Label>
              </CheckboxField>
            </Field>

            {displayAlert ? <ErrorMessage>{displayAlert}</ErrorMessage> : null}

            {displayStatus ? (
              <div
                role="status"
                className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                {displayStatus}
              </div>
            ) : null}

            <Button
              type="submit"
              color="emerald"
              disabled={loading}
              className="w-full"
              aria-busy={loading}
              aria-label="Registrarme"
            >
              {loading ? "Creando…" : "Registrarme"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            ¿Ya tenés cuenta?{" "}
            <TextLink href="/login">Iniciar sesión</TextLink>
          </p>
        </motion.main>
      </div>
      <Footer />
    </div>
  )
}
