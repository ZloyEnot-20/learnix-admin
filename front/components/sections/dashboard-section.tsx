"use client"

import { useEffect, useState } from "react"
import { analyticsApi, dashboardApi, type DashboardData, type PlatformAnalyticsData } from "@/lib/api"
import { AnalyticsDashboardSkeleton } from "@/components/skeletons"
import { AnalyticsAreaChart } from "@/components/platform-analytics-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const CHART_DAYS = 60

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU")
}

export default function DashboardSection() {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null)
  const [platform, setPlatform] = useState<DashboardData | null>(null)

  useEffect(() => {
    Promise.all([analyticsApi.platform(CHART_DAYS), dashboardApi.get()])
      .then(([a, p]) => {
        setAnalytics(a)
        setPlatform(p)
      })
      .catch(console.error)
  }, [])

  if (!analytics || !platform) {
    return <AnalyticsDashboardSkeleton />
  }

  const platformStats = [
    { label: "Организаций", value: formatNumber(platform.organizations) },
    { label: "Пользователей", value: formatNumber(platform.orgUsers) },
    { label: "Активных триалов", value: formatNumber(platform.trialsActive) },
    { label: "Выручка", value: `$${platform.revenueTotal.toLocaleString("en-US")}` },
  ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl sm:p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-5 py-6">
            <p className="text-4xl font-bold tabular-nums tracking-tight text-amber-400 sm:text-5xl">
              {formatNumber(analytics.totalHomeworkCompletions)}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Выполненных ДЗ
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-5 py-6">
            <p className="text-4xl font-bold tabular-nums tracking-tight text-amber-400 sm:text-5xl">
              {formatNumber(analytics.uniqueStudents)}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Уникальных студентов
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            ДЗ по дням
          </p>
          <AnalyticsAreaChart
            data={analytics.homeworkByDay}
            color="#3b82f6"
            fillId="homework-fill"
            height={300}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Активных студентов по дням
            </p>
            <AnalyticsAreaChart
              data={analytics.activeStudentsByDay}
              color="#22c55e"
              fillId="active-fill"
              height={240}
            />
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Уникальные student_id с хотя бы одной записью в studentactivities за день (ДЗ, упражнения,
              тесты).
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Новых студентов по дням
            </p>
            <AnalyticsAreaChart
              data={analytics.newStudentsByDay}
              color="#f59e0b"
              fillId="new-fill"
              height={240}
            />
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Новые записи в таблице users (первое появление студента в системе, поле joinedAt).
            </p>
          </div>
        </div>

        <p className="mt-4 text-right text-[11px] text-zinc-600">
          {analytics.from} — {analytics.to} · последние {analytics.days} дн.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformStats.map((s) => (
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
          <CardTitle>Недавняя активность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {platform.recentActivity.length === 0 && (
            <p className="text-sm text-slate-500">Пока нет событий.</p>
          )}
          {platform.recentActivity.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <span className="font-medium">{a.actorName}</span>
                <span className="text-slate-500">
                  {" "}
                  — {a.category}.{a.action}
                </span>
                {a.targetLabel && <span className="text-slate-600"> ({a.targetLabel})</span>}
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString("ru-RU")}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
