'use client'

import * as Headless from '@headlessui/react'
import React, { useState } from 'react'
import { Footer } from '@/components/footer'
import { NavbarItem } from './navbar'

function OpenMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2.75 6h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5Zm0 6.5h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5Z" />
    </svg>
  )
}

function CloseMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}

function MobileSidebar({ open, close, children }: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/70 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 w-full max-w-80 p-3 transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-sand text-ink [--wally-counter:var(--color-sand)]">
          <div className="-mb-3 px-4 pt-3">
            <Headless.CloseButton as={NavbarItem} aria-label="Cerrar navegación">
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  )
}

export function StackedLayout({
  navbar,
  sidebar,
  children,
}: React.PropsWithChildren<{ navbar: React.ReactNode; sidebar: React.ReactNode }>) {
  const [showSidebar, setShowSidebar] = useState(false)

  const handleOpenNav = () => {
    setShowSidebar(true)
  }

  const handleCloseNav = () => {
    setShowSidebar(false)
  }

  return (
    <div className="relative isolate flex min-h-svh w-full flex-col bg-ink">
      <MobileSidebar open={showSidebar} close={handleCloseNav}>
        {sidebar}
      </MobileSidebar>

      <header className="px-3 pt-3">
        <div className="flex items-center rounded-[1.75rem] bg-forest px-2 text-sand [--wally-counter:var(--color-forest)] sm:px-3">
          <div className="py-2 lg:hidden">
            <NavbarItem onClick={handleOpenNav} aria-label="Abrir navegación">
              <OpenMenuIcon />
            </NavbarItem>
          </div>
          <div className="min-w-0 flex-1">{navbar}</div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-3 py-3">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">{children}</div>
      </main>
      <Footer />
    </div>
  )
}
