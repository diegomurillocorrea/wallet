"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
            <h1 className="font-display text-4xl uppercase tracking-tight text-ink">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm uppercase tracking-wide text-ink/70">
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
              <span className="h-px flex-1 bg-ink/12" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink/70">
                o correo
              </span>
              <span className="h-px flex-1 bg-ink/12" />
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

            {displayStatus ? <Notice tone="success">{displayStatus}</Notice> : null}

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

          <p className="mt-6 text-center text-sm text-ink/70">
            ¿Ya tenés cuenta?{" "}
            <TextLink href="/login">Iniciar sesión</TextLink>
          </p>
          </main>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
