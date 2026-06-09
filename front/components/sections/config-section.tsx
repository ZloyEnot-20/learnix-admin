"use client"

import { useEffect, useState } from "react"
import { configApi, type PlatformConfig } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfigSection() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    configApi.get().then(setConfig).catch(console.error)
  }, [])

  async function save() {
    if (!config) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await configApi.update(config)
      setConfig(updated)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (!config) return <p className="text-sm text-slate-500">Loading configuration…</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Default limits by plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {(["free", "pro"] as const).map((plan) => (
            <div key={plan} className="space-y-3 rounded-lg border border-slate-100 p-4">
              <p className="text-sm font-semibold capitalize">{plan}</p>
              <div>
                <Label>Max students</Label>
                <Input
                  type="number"
                  value={config.defaultLimits[plan].maxStudents}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      defaultLimits: {
                        ...config.defaultLimits,
                        [plan]: { ...config.defaultLimits[plan], maxStudents: Number(e.target.value) },
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Max teachers</Label>
                <Input
                  type="number"
                  value={config.defaultLimits[plan].maxTeachers}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      defaultLimits: {
                        ...config.defaultLimits,
                        [plan]: { ...config.defaultLimits[plan], maxTeachers: Number(e.target.value) },
                      },
                    })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial period</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Default trial days for new organizations</Label>
          <Input
            type="number"
            className="mt-2 max-w-xs"
            value={config.trialDays}
            onChange={(e) => setConfig({ ...config, trialDays: Number(e.target.value) })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.featureFlags).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{key.replace(/_/g, " ")}</p>
                <p className="text-xs text-slate-500">Global toggle for all tenants</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(v) =>
                  setConfig({
                    ...config,
                    featureFlags: { ...config.featureFlags, [key]: v },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save configuration"}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </div>
  )
}
