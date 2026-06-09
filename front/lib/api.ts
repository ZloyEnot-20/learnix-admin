import { api } from "./api-client"

export type PlatformRole = "super_admin" | "platform_admin" | "owner" | "org_admin"

export interface PlatformUser {
  id: string
  email: string
  login?: string | null
  name: string
  role: PlatformRole
  orgId: string | null
  orgName?: string | null
  isActive: boolean
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  subdomain: string
  status: "active" | "blocked"
  plan: "free" | "pro"
  limits: { maxStudents: number; maxTeachers: number }
  trialEndsAt: string | null
  notes: string | null
  createdAt: string
  updatedAt?: string
  userCount?: number
  subscription?: Subscription | null
}

export interface OwnerClaimInfo {
  login: string
  code: string
  expiresAt: string
}

export interface CreateOrganizationResult extends Organization {
  ownerClaim?: OwnerClaimInfo | null
}

export interface OwnerClaim {
  id: string
  ownerId: string
  ownerLogin: string | null
  ownerName: string | null
  orgId: string
  orgName: string | null
  code: string
  expiresAt: string
  usedAt: string | null
  status: "active" | "used" | "expired"
  createdAt: string
}

export interface Subscription {
  id: string
  orgId: string
  orgName?: string | null
  orgSubdomain?: string | null
  plan: "free" | "pro"
  status: "trialing" | "active" | "past_due" | "canceled"
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}

export interface PlatformPayment {
  id: string
  orgId: string
  orgName?: string | null
  amount: number
  currency: string
  status: "pending" | "paid" | "failed" | "refunded"
  periodLabel: string
  paidAt: string | null
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  action: string
  category: string
  actorName: string
  actorRole: string | null
  targetLabel: string | null
  orgId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

export interface ErrorLogEntry {
  id: string
  level: "error" | "warn" | "info"
  message: string
  orgId: string | null
  source: string | null
  createdAt: string
}

export interface PlatformConfig {
  defaultLimits: {
    free: { maxStudents: number; maxTeachers: number }
    pro: { maxStudents: number; maxTeachers: number }
  }
  trialDays: number
  featureFlags: Record<string, boolean>
}

export interface DashboardData {
  organizations: number
  orgUsers: number
  trialsActive: number
  revenueTotal: number
  recentActivity: Array<{
    id: string
    category: string
    action: string
    actorName: string
    targetLabel: string | null
    createdAt: string
  }>
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: PlatformUser }>("/auth/login", {
      email,
      password,
    }),
  me: () => api.get<PlatformUser>("/auth/me"),
}

export const dashboardApi = {
  get: () => api.get<DashboardData>("/dashboard"),
}

export const orgsApi = {
  list: (params?: { status?: string; plan?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return api.get<Organization[]>(`/organizations${q ? `?${q}` : ""}`)
  },
  stats: () =>
    api.get<{ total: number; active: number; blocked: number; free: number; pro: number; trialing: number }>(
      "/organizations/stats",
    ),
  get: (id: string) => api.get<Organization>(`/organizations/${id}`),
  create: (body: {
    name: string
    subdomain: string
    plan?: "free" | "pro"
    trialDays?: number
    limits?: { maxStudents: number; maxTeachers: number }
    ownerName?: string
    ownerLogin?: string
  }) => api.post<CreateOrganizationResult>("/organizations", body),
  update: (
    id: string,
    body: Partial<Organization> & { limits?: { maxStudents: number; maxTeachers: number } },
  ) => api.patch<Organization>(`/organizations/${id}`, body),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/organizations/${id}`),
  resetOwnerAccess: (id: string) =>
    api.post<OwnerClaimInfo>(`/organizations/${id}/reset-owner-access`),
}

export const claimsApi = {
  list: (params?: { orgId?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return api.get<OwnerClaim[]>(`/claims${q ? `?${q}` : ""}`)
  },
}

export const usersApi = {
  list: (params?: { orgId?: string; role?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return api.get<PlatformUser[]>(`/users${q ? `?${q}` : ""}`)
  },
  create: (body: {
    email: string
    name: string
    password: string
    role: PlatformRole
    orgId?: string | null
  }) => api.post<PlatformUser>("/users", body),
  update: (id: string, body: Partial<PlatformUser & { password?: string }>) =>
    api.patch<PlatformUser>(`/users/${id}`, body),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/users/${id}`),
}

export const billingApi = {
  summary: () =>
    api.get<{ activeSubs: number; trialing: number; pastDue: number; revenueTotal: number }>(
      "/billing/summary",
    ),
  subscriptions: () => api.get<Subscription[]>("/billing/subscriptions"),
  updateSubscription: (id: string, body: Partial<Subscription>) =>
    api.patch<Subscription>(`/billing/subscriptions/${id}`, body),
  payments: () => api.get<PlatformPayment[]>("/billing/payments"),
  createPayment: (body: {
    orgId: string
    amount: number
    periodLabel: string
    status?: PlatformPayment["status"]
  }) => api.post<PlatformPayment>("/billing/payments", body),
}

export const auditApi = {
  list: (params?: { page?: number; category?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).map(([k, v]) => [k, String(v)])),
    ).toString()
    return api.get<{ items: AuditLogEntry[]; total: number; page: number; pages: number }>(
      `/audit${q ? `?${q}` : ""}`,
    )
  },
  errors: (params?: { page?: number; level?: string }) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).map(([k, v]) => [k, String(v)])),
    ).toString()
    return api.get<{ items: ErrorLogEntry[]; total: number; page: number; pages: number }>(
      `/audit/errors${q ? `?${q}` : ""}`,
    )
  },
}

export const configApi = {
  get: () => api.get<PlatformConfig>("/config"),
  update: (body: Partial<PlatformConfig>) => api.patch<PlatformConfig>("/config", body),
}

export interface PlatformAnnouncement {
  id: string
  title: string
  message: string
  type: "news" | "maintenance"
  severity: "info" | "warning" | "critical"
  targetOrgIds: string[] | null
  targetOrgNames?: string[] | null
  audience: "all" | "selected"
  startsAt: string
  endsAt: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt?: string
}

export const announcementsApi = {
  list: (params?: { type?: string; isActive?: boolean }) => {
    const qs = new URLSearchParams()
    if (params?.type) qs.set("type", params.type)
    if (params?.isActive != null) qs.set("isActive", String(params.isActive))
    const q = qs.toString()
    return api.get<PlatformAnnouncement[]>(`/announcements${q ? `?${q}` : ""}`)
  },
  create: (body: {
    title: string
    message: string
    type?: PlatformAnnouncement["type"]
    severity?: PlatformAnnouncement["severity"]
    targetOrgIds?: string[] | null
    startsAt?: string
    endsAt?: string | null
    isActive?: boolean
  }) => api.post<PlatformAnnouncement>("/announcements", body),
  update: (id: string, body: Partial<PlatformAnnouncement>) =>
    api.patch<PlatformAnnouncement>(`/announcements/${id}`, body),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/announcements/${id}`),
}
