"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BookOpenCheck, Building2, RefreshCw, TrendingUp, Users } from "lucide-react"
import {
  analyticsApi,
  dashboardApi,
  orgsApi,
  type DashboardData,
  type Organization,
  type PlatformAnalyticsData,
} from "@/lib/api"
import { AnalyticsChartsSkeleton, AnalyticsDashboardSkeleton } from "@/components/skeletons"
import { AnalyticsAreaChart } from "@/components/platform-analytics-charts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const ALL_ORGS = "all"
const REFRESH_INTERVAL_MS = 30 * 60 * 1000

const DATE_PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
] as const

function formatNumber(value: number) {
  return value.toLocaleString("en-US")
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setUTCDate(from.getUTCDate() - 59)
  return { from: formatDateInput(from), to: formatDateInput(to) }
}

function presetRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setUTCDate(from.getUTCDate() - (days - 1))
  return { from: formatDateInput(from), to: formatDateInput(to) }
}

function isValidRange(from: string, to: string) {
  if (!from || !to) return false
  return from <= to
}

const KPI_CARDS = [
  {
    key: "homework" as const,
    label: "Completed homework",
    icon: BookOpenCheck,
    accent: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    key: "students" as const,
    label: "Unique students",
    icon: Users,
    accent: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
]

export default function DashboardSection() {
  const defaults = useMemo(() => defaultDateRange(), [])
  const [orgId, setOrgId] = useState(ALL_ORGS)
  const [dateFrom, setDateFrom] = useState(defaults.from)
  const [dateTo, setDateTo] = useState(defaults.to)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null)
  const [platform, setPlatform] = useState<DashboardData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const filtersRef = useRef({ orgId, dateFrom, dateTo })

  filtersRef.current = { orgId, dateFrom, dateTo }

  const loadAnalytics = useCallback(
    async (opts?: { showSkeleton?: boolean; markUpdated?: boolean }) => {
      const { orgId: currentOrg, dateFrom: from, dateTo: to } = filtersRef.current
      if (!isValidRange(from, to)) return

      if (opts?.showSkeleton) setAnalyticsLoading(true)
      try {
        const data = await analyticsApi.platform({
          from,
          to,
          orgId: currentOrg === ALL_ORGS ? null : currentOrg,
        })
        setAnalytics(data)
        if (opts?.markUpdated !== false) setLastUpdated(new Date())
      } catch (err) {
        console.error(err)
      } finally {
        if (opts?.showSkeleton) setAnalyticsLoading(false)
      }
    },
    [],
  )

  const loadPlatform = useCallback(async () => {
    try {
      const data = await dashboardApi.get()
      setPlatform(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const refreshAll = useCallback(
    async (opts?: { showSkeleton?: boolean }) => {
      setRefreshing(true)
      try {
        await Promise.all([
          loadAnalytics({ showSkeleton: opts?.showSkeleton, markUpdated: true }),
          loadPlatform(),
        ])
      } finally {
        setRefreshing(false)
      }
    },
    [loadAnalytics, loadPlatform],
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([orgsApi.list(), dashboardApi.get()])
      .then(([orgList, platformData]) => {
        if (cancelled) return
        setOrgs(orgList)
        setPlatform(platformData)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setInitialLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isValidRange(dateFrom, dateTo)) return
    loadAnalytics({ showSkeleton: true })
  }, [orgId, dateFrom, dateTo, loadAnalytics])

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshAll({ showSkeleton: false })
    }, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [refreshAll])

  const applyPreset = (days: number) => {
    const range = presetRange(days)
    setDateFrom(range.from)
    setDateTo(range.to)
  }

  if (initialLoading || !platform) {
    return <AnalyticsDashboardSkeleton />
  }

  const kpiValues = {
    homework: analytics?.totalHomeworkCompletions ?? 0,
    students: analytics?.uniqueStudents ?? 0,
  }

  const scopeLabel =
    orgId === ALL_ORGS
      ? "All organizations"
      : (analytics?.orgName ?? orgs.find((o) => o.id === orgId)?.name ?? "Selected organization")

  const platformStats = [
    { label: "Organizations", value: formatNumber(platform.organizations) },
    { label: "Org users", value: formatNumber(platform.orgUsers) },
    { label: "Active trials", value: formatNumber(platform.trialsActive) },
    { label: "Revenue", value: `$${platform.revenueTotal.toLocaleString("en-US")}` },
  ]

  const rangeInvalid = !isValidRange(dateFrom, dateTo)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Learning analytics</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Homework completions and student activity — {scopeLabel.toLowerCase()}
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-slate-400">
              Updated {lastUpdated.toLocaleString("en-US")} · auto-refresh every 30 min
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger className="h-9 w-[200px] sm:w-[240px]">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <SelectValue placeholder="Organization" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ORGS}>All organizations</SelectItem>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="date-from" className="text-xs text-slate-500">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-[140px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date-to" className="text-xs text-slate-500">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                min={dateFrom}
                max={formatDateInput(new Date())}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-[140px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={refreshing || rangeInvalid}
            onClick={() => refreshAll({ showSkeleton: true })}
            title="Refresh now"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {rangeInvalid && (
        <p className="text-sm text-red-600">Start date must be on or before end date.</p>
      )}

      {analyticsLoading || !analytics ? (
        <AnalyticsChartsSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {KPI_CARDS.map(({ key, label, icon: Icon, accent, bg, border }) => (
              <Card key={key} className={cn("overflow-hidden", border)}>
                <CardContent className="flex items-center gap-4 pt-5">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", bg)}>
                    <Icon className={cn("h-5 w-5", accent)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                    <p className={cn("mt-1 text-3xl font-semibold tabular-nums tracking-tight", accent)}>
                      {formatNumber(kpiValues[key])}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <CardTitle>Homework by day</CardTitle>
              </div>
              <CardDescription>
                Submitted and graded assignments · {analytics.from} — {analytics.to}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <AnalyticsAreaChart
                data={analytics.homeworkByDay}
                color="#2563eb"
                fillId="homework-fill"
                height={280}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active students by day</CardTitle>
                <CardDescription>Unique students with at least one activity record per day</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AnalyticsAreaChart
                  data={analytics.activeStudentsByDay}
                  color="#16a34a"
                  fillId="active-fill"
                  height={220}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>New students by day</CardTitle>
                <CardDescription>New student registrations (joinedAt)</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AnalyticsAreaChart
                  data={analytics.newStudentsByDay}
                  color="#d97706"
                  fillId="new-fill"
                  height={220}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Platform</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {platformStats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {platform.recentActivity.length === 0 && (
            <p className="text-sm text-slate-500">No activity yet.</p>
          )}
          {platform.recentActivity.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <span className="font-medium text-slate-900">{a.actorName}</span>
                <span className="text-slate-500">
                  {" "}
                  — {a.category}.{a.action}
                </span>
                {a.targetLabel && <span className="text-slate-600"> ({a.targetLabel})</span>}
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString("en-US")}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
