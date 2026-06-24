"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Building2,
  Users,
  CreditCard,
  ScrollText,
  Settings,
  LayoutDashboard,
  Megaphone,
} from "lucide-react"
import { useAuth, isPlatformStaff } from "@/lib/auth-context"
import { AdminShell, type NavSection } from "@/components/admin-shell"
import { PanelShellSkeleton } from "@/components/skeletons"
import DashboardSection from "@/components/sections/dashboard-section"
import OrganizationsSection from "@/components/sections/organizations-section"
import UsersSection from "@/components/sections/users-section"
import BillingSection from "@/components/sections/billing-section"
import LogsSection from "@/components/sections/logs-section"
import ConfigSection from "@/components/sections/config-section"
import AnnouncementsSection from "@/components/sections/announcements-section"

const SECTIONS: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Обзор", subtitle: "Аналитика платформы и недавняя активность" },
  organizations: { title: "Organizations", subtitle: "Tenants — create, block, set limits" },
  users: { title: "Platform users", subtitle: "Owners and admins across organizations" },
  billing: { title: "Billing", subtitle: "Subscriptions, payments, trials" },
  logs: { title: "Logs & audit", subtitle: "Activity trail and error logs" },
  config: { title: "Configuration", subtitle: "Default limits and feature flags" },
  announcements: {
    title: "Announcements",
    subtitle: "News and maintenance notices to organizations",
  },
}

const NAV: NavSection[] = [
  {
    items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Tenants",
    items: [
      { id: "organizations", label: "Organizations", icon: Building2 },
      { id: "users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "announcements", label: "Announcements", icon: Megaphone },
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "logs", label: "Logs", icon: ScrollText },
      { id: "config", label: "Configuration", icon: Settings },
    ],
  },
]

const VALID = Object.keys(SECTIONS)

export default function PanelPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const segment = Array.isArray(params.section) ? params.section[0] : "dashboard"
  const active = VALID.includes(segment) ? segment : "dashboard"
  const meta = SECTIONS[active]

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
    else if (!loading && user && !isPlatformStaff(user.role)) {
      logout()
      router.replace("/login")
    }
  }, [loading, user, router, logout])

  if (loading || !user) {
    return <PanelShellSkeleton />
  }

  return (
    <AdminShell
      title={meta.title}
      subtitle={meta.subtitle}
      sections={NAV}
      active={active}
      onSelect={() => {}}
      user={{ name: user.name, email: user.email }}
      onLogout={() => {
        logout()
        router.replace("/login")
      }}
    >
      {active === "dashboard" && <DashboardSection />}
      {active === "organizations" && <OrganizationsSection />}
      {active === "users" && <UsersSection />}
      {active === "billing" && <BillingSection />}
      {active === "logs" && <LogsSection />}
      {active === "config" && <ConfigSection />}
      {active === "announcements" && <AnnouncementsSection />}
    </AdminShell>
  )
}
