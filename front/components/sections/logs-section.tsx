"use client"

import { useEffect, useState } from "react"
import { auditApi, type AuditLogEntry, type ErrorLogEntry } from "@/lib/api"
import { ActivityListSkeleton } from "@/components/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function describeAudit(log: AuditLogEntry): string {
  const who = log.actorName
  const what = log.targetLabel
  switch (`${log.category}.${log.action}`) {
    case "auth.login":
      return `${who} signed in`
    case "organizations.create":
      return `${who} created organization ${what ?? ""}`
    case "organizations.update":
      return `${who} updated organization ${what ?? ""}`
    case "organizations.delete":
      return `${who} deleted organization ${what ?? ""}`
    case "users.create":
      return `${who} added user ${what ?? ""}`
    case "users.update":
      return `${who} updated user ${what ?? ""}`
    case "users.delete":
      return `${who} removed user ${what ?? ""}`
    case "billing.create":
      return `${who} recorded payment ${what ?? ""}`
    case "billing.update":
      return `${who} updated subscription`
    case "config.update":
      return `${who} changed platform configuration`
    default:
      return `${who} — ${log.category}.${log.action}${what ? `: ${what}` : ""}`
  }
}

export default function LogsSection() {
  const [audit, setAudit] = useState<AuditLogEntry[]>([])
  const [errors, setErrors] = useState<ErrorLogEntry[]>([])
  const [auditPage, setAuditPage] = useState(1)
  const [auditPages, setAuditPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      auditApi.list({ page: auditPage }).then((r) => {
        setAudit(r.items)
        setAuditPages(r.pages)
      }),
      auditApi.errors({ page: 1 }).then((r) => setErrors(r.items)),
    ]).finally(() => setLoading(false))
  }, [auditPage])

  if (loading) {
    return (
      <div className="space-y-6">
        <ActivityListSkeleton rows={6} />
        <ActivityListSkeleton rows={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Audit log</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="text-xs text-slate-500 self-center">
              {auditPage} / {auditPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={auditPage >= auditPages}
              onClick={() => setAuditPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {audit.length === 0 && <p className="text-sm text-slate-500">No audit events yet.</p>}
          {audit.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm">
              <div>
                <Badge className="mb-1 border-slate-200 bg-slate-50">{log.category}</Badge>
                <p>{describeAudit(log)}</p>
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {new Date(log.createdAt).toLocaleString()}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.length === 0 && (
            <p className="text-sm text-slate-500">No errors recorded. Connect tenant apps to report here.</p>
          )}
          {errors.map((err) => (
            <div key={err.id} className="rounded-lg border border-red-100 bg-red-50/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <Badge className="border-red-200 bg-red-100 text-red-700">{err.level}</Badge>
                <time className="text-xs text-slate-400">{new Date(err.createdAt).toLocaleString()}</time>
              </div>
              <p className="mt-2 font-medium text-red-900">{err.message}</p>
              {err.source && <p className="text-xs text-slate-500">Source: {err.source}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
