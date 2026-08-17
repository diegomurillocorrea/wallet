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
        className="glass-overlay fixed inset-0 transition data-closed:opacity-0 data-enter:duration-250 data-enter:ease-glass data-leave:duration-150 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 w-full max-w-80 p-3 transition duration-250 ease-glass data-closed:-translate-x-full data-closed:opacity-0"
      >
        <div className="glass-floating flex h-full flex-col overflow-hidden rounded-tile text-sand">
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
    <div className="relative isolate flex min-h-svh w-full flex-col pt-3">
      <MobileSidebar open={showSidebar} close={handleCloseNav}>
        {sidebar}
      </MobileSidebar>

      {/* Isla flotante: el contenido pasa por debajo y se ve difuminado a través del vidrio */}
      <header className="sticky top-3 z-30 px-3">
        <div className="glass-bar flex items-center rounded-tile px-2 text-sand sm:px-3">
          <div className="py-2 lg:hidden">
            <NavbarItem onClick={handleOpenNav} aria-label="Abrir navegación">
              <OpenMenuIcon />
            </NavbarItem>
          </div>
          <div className="min-w-0 flex-1">{navbar}</div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-3 py-3">
        <div className="flex w-full flex-1 flex-col">{children}</div>
      </main>
      <Footer />
    </div>
  )
}
