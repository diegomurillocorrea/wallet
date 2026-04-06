"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get("error")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(
    authError ? "No se pudo completar el inicio de sesión." : null
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Iniciar sesión
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Entrá a tu billetera personal DAIEGO Wallet.
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        {message ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿No tenés cuenta?{" "}
        <Link
          href="/signup"
          className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
