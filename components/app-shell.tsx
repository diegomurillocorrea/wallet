"use client"

import {
  ArrowRightStartOnRectangleIcon,
  ChartPieIcon,
  CreditCardIcon,
  HomeIcon,
  QueueListIcon,
  TagIcon,
} from "@heroicons/react/20/solid"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DaiegoLogo } from "@/components/daiego-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "@/components/ui/dropdown"
import {
  Navbar,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
} from "@/components/ui/navbar"
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "@/components/ui/sidebar"
import { StackedLayout } from "@/components/ui/stacked-layout"

const nav = [
  { href: "/dashboard", label: "Resumen", icon: HomeIcon },
  { href: "/transactions", label: "Movimientos", icon: QueueListIcon },
  { href: "/categories", label: "Categorías", icon: TagIcon },
  { href: "/budgets", label: "Presupuestos", icon: ChartPieIcon },
  { href: "/credit-cards", label: "Tarjetas", icon: CreditCardIcon },
] as const

interface AppShellProps {
  children: React.ReactNode
  email: string | null
}

const isCurrentPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

export const AppShell = ({ children, email }: AppShellProps) => {
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const brand = (
    <NavbarItem href="/dashboard" aria-label="DAIEGO Wallet — ir al resumen">
      <DaiegoLogo
        className="size-7 shrink-0 rounded-md object-contain ring-1 ring-zinc-200/80 dark:ring-white/15 sm:size-8"
        priority
        sizes="(max-width: 640px) 28px, 32px"
      />
      <NavbarLabel>Wallet</NavbarLabel>
    </NavbarItem>
  )

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection>
            {brand}
          </NavbarSection>
          <NavbarSection className="max-lg:hidden">
            {nav.map(({ href, label, icon: Icon }) => (
              <NavbarItem
                key={href}
                href={href}
                current={isCurrentPath(pathname, href)}
              >
                <Icon />
                <NavbarLabel>{label}</NavbarLabel>
              </NavbarItem>
            ))}
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <ThemeToggle />
            <Dropdown>
              <DropdownButton as={NavbarItem} aria-label="Cuenta">
                <NavbarLabel className="max-sm:hidden">
                  {email ?? "Cuenta"}
                </NavbarLabel>
              </DropdownButton>
              <DropdownMenu anchor="bottom end">
                <DropdownItem onClick={handleSignOut}>
                  <ArrowRightStartOnRectangleIcon />
                  Salir
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarSection>
              <SidebarItem href="/dashboard" aria-label="DAIEGO Wallet — ir al resumen">
                <DaiegoLogo
                  className="size-7 shrink-0 rounded-md object-contain ring-1 ring-zinc-200/80 dark:ring-white/15"
                  sizes="28px"
                />
                <SidebarLabel>Wallet</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {nav.map(({ href, label, icon: Icon }) => (
                <SidebarItem
                  key={href}
                  href={href}
                  current={isCurrentPath(pathname, href)}
                >
                  <Icon />
                  <SidebarLabel>{label}</SidebarLabel>
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter>
            <SidebarSection>
              <SidebarItem onClick={handleSignOut}>
                <ArrowRightStartOnRectangleIcon />
                <SidebarLabel>Salir</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </StackedLayout>
  )
}
