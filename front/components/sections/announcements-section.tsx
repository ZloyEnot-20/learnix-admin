"use client"

import { useCallback, useEffect, useState } from "react"
import {
  announcementsApi,
  orgsApi,
  type PlatformAnnouncement,
  type Organization,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnnouncementsSkeleton } from "@/components/skeletons"
import { Plus, Megaphone, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const SEVERITY_CLS: Record<string, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
}

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "news" as PlatformAnnouncement["type"],
  severity: "info" as PlatformAnnouncement["severity"],
  audience: "all" as "all" | "selected",
  targetOrgIds: [] as string[],
  endsAt: "",
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function AnnouncementsSection() {
  const [items, setItems] = useState<PlatformAnnouncement[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, orgList] = await Promise.all([
        announcementsApi.list(),
        orgsApi.list(),
      ])
      setItems(list)
      setOrgs(orgList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await announcementsApi.create({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        severity: form.severity,
        targetOrgIds:
          form.audience === "all" ? null : form.targetOrgIds.filter(Boolean),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      })
      setOpen(false)
      setForm(EMPTY_FORM)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(item: PlatformAnnouncement) {
    await announcementsApi.update(item.id, { isActive: !item.isActive })
    await load()
  }

  async function remove(item: PlatformAnnouncement) {
    if (!confirm(`Delete announcement "${item.title}"?`)) return
    await announcementsApi.delete(item.id)
    await load()
  }

  function toggleOrg(orgId: string) {
    setForm((prev) => {
      const has = prev.targetOrgIds.includes(orgId)
      return {
        ...prev,
        targetOrgIds: has
          ? prev.targetOrgIds.filter((id) => id !== orgId)
          : [...prev.targetOrgIds, orgId],
      }
    })
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <AnnouncementsSkeleton />
      ) : (
        <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">
            Send news or maintenance notices to all organizations or selected tenants.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Send announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ann-type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as PlatformAnnouncement["type"],
                      severity: v === "maintenance" ? "warning" : f.severity,
                    }))
                  }
                >
                  <SelectTrigger id="ann-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News / message</SelectItem>
                    <SelectItem value="maintenance">Maintenance / tech works</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-message">Message</Label>
                <Textarea
                  id="ann-message"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-severity">Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, severity: v as PlatformAnnouncement["severity"] }))
                  }
                >
                  <SelectTrigger id="ann-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-audience">Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      audience: v as "all" | "selected",
                      targetOrgIds: v === "all" ? [] : f.targetOrgIds,
                    }))
                  }
                >
                  <SelectTrigger id="ann-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All organizations</SelectItem>
                    <SelectItem value="selected">Selected organizations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.audience === "selected" && (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-3">
                  {orgs.map((org) => (
                    <label
                      key={org.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.targetOrgIds.includes(org.id)}
                        onChange={() => toggleOrg(org.id)}
                      />
                      <span>{org.name}</span>
                      <span className="text-xs text-slate-400">{org.subdomain}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ann-ends">Hide after (optional)</Label>
                <Input
                  id="ann-ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  saving ||
                  !form.title.trim() ||
                  !form.message.trim() ||
                  (form.audience === "selected" && form.targetOrgIds.length === 0)
                }
              >
                {saving ? "Sending…" : "Send announcement"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.type === "maintenance" ? (
                      <Wrench className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-sky-600" />
                    )}
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <Badge variant="outline" className={cn("capitalize", SEVERITY_CLS[item.severity])}>
                      {item.severity}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {item.type}
                    </Badge>
                    {!item.isActive && (
                      <Badge variant="outline" className="text-slate-500">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{item.message}</p>
                  <p className="text-xs text-slate-400">
                    {item.audience === "all"
                      ? "All organizations"
                      : item.targetOrgNames?.join(", ") ?? "Selected organizations"}
                    {" · "}
                    {formatDate(item.startsAt)} — {formatDate(item.endsAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(item)}>
                    {item.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(item)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
