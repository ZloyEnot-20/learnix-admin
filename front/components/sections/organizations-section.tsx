"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { claimsApi, orgsApi, type Organization, type OwnerClaim, type OwnerClaimInfo } from "@/lib/api"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { OrgDetailSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/skeletons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Ban,
  Building2,
  CheckCircle2,
  Copy,
  EllipsisVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"

type OrgStats = {
  total: number
  active: number
  blocked: number
  free: number
  pro: number
  trialing: number
}

const emptyForm = {
  name: "",
  subdomain: "",
  plan: "free" as "free" | "pro",
  trialDays: "14",
  maxStudents: "",
  maxTeachers: "",
  ownerName: "",
  ownerLogin: "",
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

function usagePercent(current: number, max: number) {
  if (max <= 0) return 0
  return Math.min(100, Math.round((current / max) * 100))
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = usagePercent(current, max)
  const atLimit = current >= max
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={atLimit ? "font-medium text-red-600" : "text-slate-700"}>
          {current} / {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function OrganizationsSection() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [stats, setStats] = useState<OrgStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all")
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all")

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [ownerClaim, setOwnerClaim] = useState<OwnerClaimInfo | null>(null)
  const [ownerClaimMode, setOwnerClaimMode] = useState<"create" | "reset">("create")

  const [detailOrg, setDetailOrg] = useState<Organization | null>(null)
  const [detailClaims, setDetailClaims] = useState<OwnerClaim[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [resettingOwner, setResettingOwner] = useState(false)

  const [editOrg, setEditOrg] = useState<Organization | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    maxStudents: "",
    maxTeachers: "",
    notes: "",
  })

  const [pendingDelete, setPendingDelete] = useState<Organization | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { status?: string; plan?: string } = {}
      if (statusFilter !== "all") params.status = statusFilter
      if (planFilter !== "all") params.plan = planFilter
      const [list, s] = await Promise.all([orgsApi.list(params), orgsApi.stats()])
      setOrgs(list)
      setStats(s)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load organizations")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, planFilter])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orgs
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.subdomain.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    )
  }, [orgs, search])

  function resetCreate() {
    setForm(emptyForm)
    setOwnerClaim(null)
    setError(null)
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const body: Parameters<typeof orgsApi.create>[0] = {
        name: form.name.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        plan: form.plan,
      }
      const trialDays = Number(form.trialDays)
      if (!Number.isNaN(trialDays) && trialDays >= 0) body.trialDays = trialDays
      if (form.maxStudents && form.maxTeachers) {
        body.limits = {
          maxStudents: Number(form.maxStudents),
          maxTeachers: Number(form.maxTeachers),
        }
      }
      if (form.ownerLogin.trim() && form.ownerName.trim()) {
        body.ownerLogin = form.ownerLogin.trim().toLowerCase()
        body.ownerName = form.ownerName.trim()
      } else if (form.ownerLogin.trim() || form.ownerName.trim()) {
        setError("Owner name and login are both required")
        return
      }

      const result = await orgsApi.create(body)
      if (result.ownerClaim) {
        setOwnerClaimMode("create")
        setOwnerClaim(result.ownerClaim)
      } else {
        setCreateOpen(false)
        resetCreate()
      }
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create organization")
    } finally {
      setSubmitting(false)
    }
  }

  async function openDetail(org: Organization) {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const [detail, claims] = await Promise.all([orgsApi.get(org.id), claimsApi.list({ orgId: org.id })])
      setDetailOrg(detail)
      setDetailClaims(claims)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load organization")
      setDetailOrg(org)
    } finally {
      setDetailLoading(false)
    }
  }

  async function resetOwnerAccess(orgId: string) {
    setResettingOwner(true)
    setError(null)
    try {
      const claim = await orgsApi.resetOwnerAccess(orgId)
      setOwnerClaimMode("reset")
      setOwnerClaim(claim)
      setCreateOpen(true)
      const claims = await claimsApi.list({ orgId })
      setDetailClaims(claims)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset owner access")
    } finally {
      setResettingOwner(false)
    }
  }

  function openEdit(org: Organization) {
    setEditOrg(org)
    setEditForm({
      name: org.name,
      maxStudents: String(org.limits.maxStudents),
      maxTeachers: String(org.limits.maxTeachers),
      notes: org.notes ?? "",
    })
    setEditOpen(true)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editOrg) return
    setSubmitting(true)
    setError(null)
    try {
      await orgsApi.update(editOrg.id, {
        name: editForm.name.trim(),
        limits: {
          maxStudents: Number(editForm.maxStudents),
          maxTeachers: Number(editForm.maxTeachers),
        },
        notes: editForm.notes.trim() || null,
      })
      setEditOpen(false)
      setEditOrg(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update organization")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleBlock(org: Organization) {
    try {
      await orgsApi.update(org.id, { status: org.status === "active" ? "blocked" : "active" })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status")
    }
  }

  async function changePlan(org: Organization, plan: "free" | "pro") {
    if (org.plan === plan) return
    try {
      await orgsApi.update(org.id, { plan })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change plan")
    }
  }

  async function confirmRemove() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await orgsApi.delete(pendingDelete.id)
      setPendingDelete(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete organization")
    } finally {
      setDeleting(false)
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      {loading && !stats && <StatCardsSkeleton count={6} />}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Total", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Blocked", value: stats.blocked },
            { label: "Free plan", value: stats.free },
            { label: "Pro plan", value: stats.pro },
            { label: "Trialing", value: stats.trialing },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-4">
                <p className="text-xs uppercase text-slate-500">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by name or subdomain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open)
            if (!open) resetCreate()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            {ownerClaim ? (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {ownerClaimMode === "reset" ? "Owner access reset" : "Organization created"}
                  </DialogTitle>
                  <DialogDescription>
                    Give the owner this confirmation code. In the Telegram bot they tap{" "}
                    <b>Men tashkilotman</b> and enter the code to receive their login and password.
                    {ownerClaimMode === "reset"
                      ? " The tenant admin account for learnix-front has been recreated."
                      : null}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Owner login</p>
                      <p className="truncate font-mono text-sm font-semibold text-slate-900">{ownerClaim.login}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => copyText(ownerClaim.login)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Confirmation code
                      </p>
                      <p className="font-mono text-2xl font-bold tracking-[0.3em] text-slate-900">
                        {ownerClaim.code}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => copyText(ownerClaim.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  The owner opens the Learnix Telegram bot, sends /start, taps{" "}
                  <b>Men tashkilotman</b>, then enters this 6-digit code. Code expires{" "}
                  {formatDate(ownerClaim.expiresAt)}.
                </p>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setCreateOpen(false)
                      resetCreate()
                    }}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create organization</DialogTitle>
                  <DialogDescription>New tenant with optional owner account via Telegram</DialogDescription>
                </DialogHeader>
                <form onSubmit={createOrg} className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Subdomain</Label>
                    <Input
                      value={form.subdomain}
                      onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase() })}
                      placeholder="acme"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">{form.subdomain || "acme"}.learnix</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Plan</Label>
                      <Select
                        value={form.plan}
                        onValueChange={(v) => setForm({ ...form, plan: v as "free" | "pro" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Trial days</Label>
                      <Input
                        type="number"
                        min={0}
                        max={90}
                        value={form.trialDays}
                        onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Max students</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Default for plan"
                        value={form.maxStudents}
                        onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Max teachers</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Default for plan"
                        value={form.maxTeachers}
                        onChange={(e) => setForm({ ...form, maxTeachers: e.target.value })}
                      />
                    </div>
                  </div>
                  <hr className="border-slate-100" />
                  <p className="text-xs text-slate-500">
                    Owner credentials are delivered via Telegram bot after entering the confirmation code.
                  </p>
                  <div>
                    <Label>Owner name</Label>
                    <Input
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label>Owner login</Label>
                    <Input
                      value={form.ownerLogin}
                      onChange={(e) => setForm({ ...form, ownerLogin: e.target.value.toLowerCase() })}
                      placeholder="acme_admin"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating…" : "Create"}
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && !createOpen && !editOpen && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No organizations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-slate-500">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Subdomain</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Plan</th>
                    <th className="pb-2 pr-4">Trial ends</th>
                    <th className="pb-2 pr-4">Limits</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org) => (
                    <tr
                      key={org.id}
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                      onClick={() => openDetail(org)}
                    >
                      <td className="py-3 pr-4 font-medium">{org.name}</td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{org.subdomain}.learnix</td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={
                            org.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          {org.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <Select value={org.plan} onValueChange={(v) => changePlan(org, v as "free" | "pro")}>
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(org.trialEndsAt)}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {org.limits.maxStudents} students / {org.limits.maxTeachers} teachers
                      </td>
                      <td className="py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Actions">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(org)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleBlock(org)}>
                              {org.status === "active" ? (
                                <>
                                  <Ban className="h-4 w-4 text-amber-600" />
                                  Block organization
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  Unblock organization
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(org)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailOrg?.name ?? "Organization"}</DialogTitle>
            <DialogDescription>
              {detailOrg ? `${detailOrg.subdomain}.learnix · ${detailOrg.plan} plan` : "Organization details"}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <OrgDetailSkeleton />
          ) : detailOrg ? (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    detailOrg.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }
                >
                  {detailOrg.status}
                </Badge>
                <Badge className="border-slate-200 bg-slate-50 capitalize">{detailOrg.plan}</Badge>
                {detailOrg.subscription && (
                  <Badge className="border-sky-200 bg-sky-50 capitalize text-sky-700">
                    {detailOrg.subscription.status}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Subdomain</p>
                  <p className="font-mono">{detailOrg.subdomain}.learnix</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Organization ID</p>
                  <p className="truncate font-mono text-xs">{detailOrg.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Trial ends</p>
                  <p>{formatDate(detailOrg.trialEndsAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p>{formatDate(detailOrg.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-3 text-xs font-medium uppercase text-slate-500">Usage & limits</p>
                <div className="space-y-3">
                  <UsageBar
                    label="Students"
                    current={detailOrg.studentCount ?? 0}
                    max={detailOrg.limits.maxStudents}
                  />
                  <UsageBar
                    label="Teachers"
                    current={detailOrg.teacherCount ?? 0}
                    max={detailOrg.limits.maxTeachers}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center">
                  <div>
                    <p className="text-lg font-semibold">{detailOrg.adminCount ?? 0}</p>
                    <p className="text-xs text-slate-500">Admins</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{detailOrg.totalUsers ?? 0}</p>
                    <p className="text-xs text-slate-500">Tenant users</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{detailOrg.userCount ?? 0}</p>
                    <p className="text-xs text-slate-500">Platform owners</p>
                  </div>
                </div>
              </div>

              {detailOrg.subscription && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">Subscription / tariff</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Plan</p>
                      <p className="capitalize">{detailOrg.subscription.plan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="capitalize">{detailOrg.subscription.status.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Period start</p>
                      <p>{formatDate(detailOrg.subscription.currentPeriodStart)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Period end</p>
                      <p>{formatDate(detailOrg.subscription.currentPeriodEnd)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Max students</p>
                  <p className="font-medium">{detailOrg.limits.maxStudents}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Max teachers</p>
                  <p className="font-medium">{detailOrg.limits.maxTeachers}</p>
                </div>
              </div>

              {detailOrg.notes && (
                <div>
                  <p className="text-xs text-slate-500">Notes</p>
                  <p className="whitespace-pre-wrap text-slate-700">{detailOrg.notes}</p>
                </div>
              )}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">Owner cannot sign in to learnix-front?</p>
                <p className="mt-1 text-xs text-amber-800">
                  Reset access to recreate the tenant admin account and issue a new Telegram confirmation code.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={resettingOwner}
                  onClick={() => detailOrg && void resetOwnerAccess(detailOrg.id)}
                >
                  {resettingOwner ? "Resetting…" : "Reset owner access"}
                </Button>
              </div>
              {detailClaims.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">Owner credential codes</p>
                  <div className="space-y-2">
                    {detailClaims.slice(0, 5).map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <div>
                          <p className="font-mono text-sm">{claim.code}</p>
                          <p className="text-xs text-slate-500">
                            {claim.ownerLogin ?? claim.ownerName} · {claim.status}
                          </p>
                        </div>
                        {claim.status === "active" && (
                          <Button variant="outline" size="sm" onClick={() => copyText(claim.code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
            <DialogDescription>Update name, limits, and internal notes</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max students</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.maxStudents}
                  onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Max teachers</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.maxTeachers}
                  onChange={(e) => setEditForm({ ...editForm, maxTeachers: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Internal notes about this tenant…"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
        title="Delete this organization?"
        description={
          pendingDelete && (
            <>
              This will permanently delete{" "}
              <span className="font-semibold text-slate-900">{pendingDelete.name}</span>. All users
              and subscriptions for this tenant will be removed.
            </>
          )
        }
        onConfirm={confirmRemove}
        loading={deleting}
      />
    </div>
  )
}
