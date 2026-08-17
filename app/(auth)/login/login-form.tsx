"use client"

import { Suspense, useState } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Footer } from "@/components/footer"
import { WallyMark } from "@/components/wally-mark"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxField } from "@/components/ui/checkbox"
import { ErrorMessage, Field, Label } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"
import { Notice } from "@/components/ui/notice"
import { TextLink } from "@/components/ui/text"

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
    <div className="relative flex min-h-screen flex-col">
      <div className="relative z-10 flex flex-1 flex-col justify-center p-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto grid w-full gap-3 lg:grid-cols-12 lg:min-h-[34rem]"
        >
          <div className="light glass-tile-sand relative min-h-[14rem] overflow-hidden rounded-tile text-ink sm:rounded-tile-lg lg:col-span-5">
            <WallyMark className="absolute top-6 left-6 size-12" variant="forest" priority />
            <p className="sr-only">Wally</p>
            <p
              aria-hidden
              className="absolute bottom-6 left-6 font-display text-7xl uppercase leading-none tracking-tight [writing-mode:vertical-rl] rotate-180"
            >
              Wally
            </p>
          </div>
          <main className="bento-panel lg:col-span-7">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-3" role="group" aria-label="Wally">
              <h1 className="font-display text-4xl uppercase tracking-tight text-ink">
                Wally
              </h1>
            </div>
            <p className="text-sm uppercase tracking-wide text-ink/70">
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
              <span className="h-px flex-1 bg-ink/12" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink/70">
                o correo
              </span>
              <span className="h-px flex-1 bg-ink/12" />
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

            {message ? <Notice tone="success">{message}</Notice> : null}

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
          <p className="mt-6 text-center text-sm text-ink/70">
            ¿No tenés cuenta?{" "}
            <TextLink href="/signup">Crear cuenta</TextLink>
          </p>
          </main>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

export function LoginFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center p-3">
        <main className="bento-panel mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-display text-4xl uppercase tracking-tight text-ink">Wally</h1>
            <p className="mt-2 text-sm uppercase tracking-wide text-ink/70">Cargando…</p>
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
