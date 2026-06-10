"use client"

import { useEffect, useState } from "react"
import { dashboardApi, type DashboardData } from "@/lib/api"
import { DashboardSkeleton } from "@/components/skeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardSection() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    dashboardApi.get().then(setData).catch(console.error)
  }, [])

  if (!data) {
    return <DashboardSkeleton />
  }

  const stats = [
    { label: "Organizations", value: data.organizations },
    { label: "Org users", value: data.orgUsers },
    { label: "Active trials", value: data.trialsActive },
    { label: "Revenue (paid)", value: `$${data.revenueTotal.toLocaleString()}` },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity.length === 0 && (
            <p className="text-sm text-slate-500">No activity yet.</p>
          )}
          {data.recentActivity.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <span className="font-medium">{a.actorName}</span>
                <span className="text-slate-500"> — {a.category}.{a.action}</span>
                {a.targetLabel && <span className="text-slate-600"> ({a.targetLabel})</span>}
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString()}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
