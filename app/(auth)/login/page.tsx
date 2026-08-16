import type { Metadata } from "next"
import { LoginPageContent } from "./login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Iniciá sesión en Wally.",
}

export default function LoginPage() {
  return <LoginPageContent />
}
