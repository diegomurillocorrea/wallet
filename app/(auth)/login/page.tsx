import { Suspense } from "react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          aria-hidden
        />
      }
    >
      <LoginForm />
    </Suspense>
  )
}
