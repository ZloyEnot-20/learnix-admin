import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-7 w-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="pb-2 pr-4 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-slate-100">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="py-3 pr-4">
                  <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-20")} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TableCardSkeleton({
  rows = 6,
  columns = 5,
  titleWidth = "w-48",
}: {
  rows?: number
  columns?: number
  titleWidth?: string
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className={cn("h-5", titleWidth)} />
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={rows} columns={columns} />
      </CardContent>
    </Card>
  )
}

export function ActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-24 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton count={4} className="lg:grid-cols-4 xl:grid-cols-4" />
      <ActivityListSkeleton />
    </div>
  )
}

function ChartBlockSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-56" />
      </CardHeader>
      <CardContent className="pt-2">
        <Skeleton className={cn("w-full rounded-lg", tall ? "h-[280px]" : "h-[220px]")} />
      </CardContent>
    </Card>
  )
}

export function AnalyticsChartsSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 pt-5">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChartBlockSkeleton tall />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartBlockSkeleton />
        <ChartBlockSkeleton />
      </div>
    </>
  )
}

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <AnalyticsChartsSkeleton />

      <StatCardsSkeleton count={4} className="lg:grid-cols-4 xl:grid-cols-4" />
      <ActivityListSkeleton />
    </div>
  )
}

export function ConfigSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-3 rounded-lg border border-slate-100 p-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 max-w-xs" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function OrgDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-12 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <Skeleton className="mb-2 h-3 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function PanelShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="space-y-6 px-5 py-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="space-y-2 px-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 lg:px-8">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <AnalyticsDashboardSkeleton />
        </main>
      </div>
    </div>
  )
}

export function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-full" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export function RegisterSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-full" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
