"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Crear cuenta
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Registrate para guardar tus movimientos en la nube.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        {message ? (
          <p
            className={`text-sm ${message.includes("Revisá") ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            role="alert"
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
        >
          {loading ? "Creando…" : "Registrarme"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
