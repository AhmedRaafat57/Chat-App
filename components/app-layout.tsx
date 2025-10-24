"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import type { ReactNode } from "react"

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarNav />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
