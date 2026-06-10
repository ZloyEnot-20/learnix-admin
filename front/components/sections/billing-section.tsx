"use client"

import { useCallback, useEffect, useState } from "react"
import { billingApi, orgsApi, type Subscription, type PlatformPayment, type Organization } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableCardSkeleton, StatCardsSkeleton } from "@/components/skeletons"
import { Plus } from "lucide-react"

const STATUS_CLS: Record<string, string> = {
  trialing: "border-sky-200 bg-sky-50 text-sky-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  past_due: "border-amber-200 bg-amber-50 text-amber-700",
  canceled: "border-slate-200 bg-slate-50 text-slate-600",
}

export default function BillingSection() {
  const [summary, setSummary] = useState<{ activeSubs: number; trialing: number; pastDue: number; revenueTotal: number } | null>(null)
  const [subs, setSubs] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<PlatformPayment[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [open, setOpen] = useState(false)
  const [payForm, setPayForm] = useState({ orgId: "", amount: 0, periodLabel: "", status: "paid" as PlatformPayment["status"] })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, sub, pay, o] = await Promise.all([
        billingApi.summary(),
        billingApi.subscriptions(),
        billingApi.payments(),
        orgsApi.list(),
      ])
      setSummary(s)
      setSubs(sub)
      setPayments(pay)
      setOrgs(o)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  async function updateSubStatus(sub: Subscription, status: Subscription["status"]) {
    await billingApi.updateSubscription(sub.id, { status })
    load()
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault()
    await billingApi.createPayment(payForm)
    setOpen(false)
    load()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <StatCardsSkeleton count={4} className="sm:grid-cols-4 lg:grid-cols-4" />
        <TableCardSkeleton rows={5} columns={5} titleWidth="w-32" />
        <TableCardSkeleton rows={5} columns={5} titleWidth="w-28" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Active subs", value: summary.activeSubs },
            { label: "Trials", value: summary.trialing },
            { label: "Past due", value: summary.pastDue },
            { label: "Revenue", value: `$${summary.revenueTotal}` },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <p className="text-xs uppercase text-slate-500">{s.label}</p>
                <p className="mt-1 text-xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">Organization</th>
                <th className="pb-2 pr-4">Plan</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Trial ends</th>
                <th className="pb-2">Change status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr key={sub.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{sub.orgName}</td>
                  <td className="py-3 pr-4">{sub.plan}</td>
                  <td className="py-3 pr-4">
                    <Badge className={STATUS_CLS[sub.status]}>{sub.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3">
                    <Select value={sub.status} onValueChange={(v) => updateSubStatus(sub, v as Subscription["status"])}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trialing">trialing</SelectItem>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="past_due">past_due</SelectItem>
                        <SelectItem value="canceled">canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Record payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={recordPayment} className="space-y-3">
                <div>
                  <Label>Organization</Label>
                  <Select value={payForm.orgId} onValueChange={(v) => setPayForm({ ...payForm, orgId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Period</Label>
                  <Input
                    value={payForm.periodLabel}
                    onChange={(e) => setPayForm({ ...payForm, periodLabel: e.target.value })}
                    placeholder="June 2026"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">Organization</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Period</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{p.orgName}</td>
                  <td className="py-3 pr-4">
                    {p.amount} {p.currency}
                  </td>
                  <td className="py-3 pr-4">{p.periodLabel}</td>
                  <td className="py-3 pr-4">{p.status}</td>
                  <td className="py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
