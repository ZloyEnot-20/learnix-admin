"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

interface AdminShellProps {
  title: string
  subtitle?: string
  sections: NavSection[]
  active: string
  onSelect: (id: string) => void
  user: { name: string; email: string }
  onLogout: () => void
  children: ReactNode
}

export function AdminShell({
  title,
  subtitle,
  sections,
  active,
  onSelect,
  user,
  onLogout,
  children,
}: AdminShellProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const Nav = ({ inSheet = false }: { inSheet?: boolean }) => (
    <nav className="flex h-full flex-col">
      <div className={cn("px-5 py-5", inSheet && "px-4")}>
        <p className="text-lg font-bold tracking-tight text-slate-900">Learnix Platform</p>
        <p className="text-xs text-slate-500">Multi-tenant admin</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section, idx) => (
          <div key={idx} className={cn("space-y-1", idx > 0 && "mt-5")}>
            {section.label && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(`/panel/${item.id}`)
                    onSelect(item.id)
                    if (inSheet) setMobileOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 p-4">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-0" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Nav />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <Nav inSheet />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
