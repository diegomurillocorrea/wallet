import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { createClient } from "@/lib/supabase/server"
import { ensureDefaultCategories } from "@/app/(app)/actions/wallet-actions"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await ensureDefaultCategories()
  return <AppShell email={user.email ?? null}>{children}</AppShell>
}
