"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  RefreshCw,
  Search,
} from "lucide-react"
import {
  issueReportsApi,
  orgsApi,
  type IssueReportEntry,
  type Organization,
} from "@/lib/api"
import { TableSkeleton } from "@/components/skeletons"
import { cn } from "@/lib/utils"

const STATUS_META: Record<
  IssueReportEntry["status"],
  { label: string; cls: string }
> = {
  open: { label: "Open", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  resolved: { label: "Resolved", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  dismissed: { label: "Dismissed", cls: "border-slate-200 bg-slate-50 text-slate-700" },
}

const KIND_LABELS: Record<IssueReportEntry["exerciseKind"], string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  podcast: "Podcast",
  speaking: "Speaking",
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function contextLabel(report: IssueReportEntry): string {
  if (report.homeworkId) return "Homework"
  if (report.controlWorkId) return "Progress test"
  return "Assignment"
}

export default function IssueReportsSection() {
  const [items, setItems] = useState<IssueReportEntry[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [openCount, setOpenCount] = useState(0)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [status, setStatus] = useState("open")
  const [orgId, setOrgId] = useState("all")
  const [selected, setSelected] = useState<IssueReportEntry | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    orgsApi.list().then(setOrgs).catch(() => {})
  }, [])

  const load = useCallback(
    async (opts?: { pageOverride?: number }) => {
      const currentPage = opts?.pageOverride ?? page
      setError(null)
      try {
        const res = await issueReportsApi.list({
          page: currentPage,
          limit: 50,
          status: status !== "all" ? status : undefined,
          orgId: orgId !== "all" ? orgId : undefined,
          search: search || undefined,
        })
        setItems(res.items)
        setTotal(res.total)
        setPages(res.pages)
        setPage(res.page)
        setOpenCount(res.openCount)
      } catch {
        setError("Failed to load issue reports. Check your connection and try again.")
      }
    },
    [page, status, orgId, search],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    load().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [load])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const updateStatus = async (
    report: IssueReportEntry,
    nextStatus: IssueReportEntry["status"],
  ) => {
    setUpdating(true)
    setError(null)
    try {
      const updated = await issueReportsApi.update(report.id, nextStatus)
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSelected((prev) => (prev?.id === updated.id ? updated : prev))
      void load()
    } catch {
      setError("Could not update report.")
    } finally {
      setUpdating(false)
    }
  }

  const stats = useMemo(
    () => ({
      open: openCount,
      shown: items.length,
      total,
    }),
    [openCount, items.length, total],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{stats.open} open</Badge>
          <Badge variant="outline">{stats.total} total</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search student, exercise, message…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </div>
        <Select
          value={orgId}
          onValueChange={(v) => {
            setOrgId(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organizations</SelectItem>
            {orgs.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={applySearch}>
          Search
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Flag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No issue reports</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Students report problems from homework using the flag icon in the mobile app.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Exercise</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Context</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((report) => {
                  const meta = STATUS_META[report.status]
                  return (
                    <tr
                      key={report.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                      onClick={() => setSelected(report)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {report.orgName ?? report.orgId}
                      </td>
                      <td className="px-4 py-3 font-medium">{report.studentName}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{report.exerciseTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {KIND_LABELS[report.exerciseKind]} · {report.exerciseSlug}
                        </div>
                      </td>
                      <td className="max-w-[180px] px-4 py-3 text-muted-foreground">
                        {report.message ? (
                          <span className="line-clamp-2">{report.message}</span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {contextLabel(report)}
                        {report.questionIndex != null
                          ? ` · Q${report.questionIndex + 1}`
                          : ""}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={meta.cls}>
                          {meta.label}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Issue report</DialogTitle>
                <DialogDescription>
                  Reported {formatDate(selected.createdAt)} by {selected.studentName}
                  {selected.orgName ? ` · ${selected.orgName}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Organization
                  </p>
                  <p className="font-medium">{selected.orgName ?? selected.orgId}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Exercise</p>
                  <p className="font-medium">{selected.exerciseTitle}</p>
                  <p className="text-muted-foreground">
                    {KIND_LABELS[selected.exerciseKind]} · {selected.exerciseSlug}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Context</p>
                  <p>{contextLabel(selected)}</p>
                  {selected.homeworkId ? (
                    <p className="text-muted-foreground">Homework ID: {selected.homeworkId}</p>
                  ) : null}
                  {selected.controlWorkId ? (
                    <p className="text-muted-foreground">
                      Progress test ID: {selected.controlWorkId}
                      {selected.stepIndex != null ? ` · step ${selected.stepIndex + 1}` : ""}
                    </p>
                  ) : null}
                </div>

                {selected.questionIndex != null || selected.questionPrompt ? (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Question</p>
                    {selected.questionIndex != null ? (
                      <p>Question {selected.questionIndex + 1}</p>
                    ) : null}
                    {selected.questionPrompt ? (
                      <p className="mt-1 rounded-lg bg-muted/50 p-3 text-foreground">
                        {selected.questionPrompt}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {selected.message ? (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Student message
                    </p>
                    <p className="mt-1 rounded-lg bg-muted/50 p-3 text-foreground">
                      {selected.message}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
                  <Badge variant="outline" className={STATUS_META[selected.status].cls}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                  {selected.resolvedByName ? (
                    <p className="mt-1 text-muted-foreground">
                      {selected.status === "resolved" ? "Resolved" : "Dismissed"} by{" "}
                      {selected.resolvedByName}
                      {selected.resolvedAt ? ` · ${formatDate(selected.resolvedAt)}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {selected.status !== "resolved" ? (
                  <Button
                    size="sm"
                    disabled={updating}
                    onClick={() => updateStatus(selected, "resolved")}
                  >
                    Mark resolved
                  </Button>
                ) : null}
                {selected.status !== "dismissed" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={updating}
                    onClick={() => updateStatus(selected, "dismissed")}
                  >
                    Dismiss
                  </Button>
                ) : null}
                {selected.status !== "open" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updating}
                    onClick={() => updateStatus(selected, "open")}
                  >
                    Reopen
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
