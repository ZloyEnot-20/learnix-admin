"use client"

import { useCallback, useEffect, useState } from "react"
import { usersApi, orgsApi, type PlatformUser, type Organization } from "@/lib/api"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCardSkeleton, TableSkeleton } from "@/components/skeletons"
import { EllipsisVertical, Plus, Trash2, UserX } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  platform_admin: "Platform Admin",
  owner: "Owner",
  org_admin: "Org Admin",
}

export default function UsersSection() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "owner" as PlatformUser["role"],
    orgId: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, o] = await Promise.all([usersApi.list(), orgsApi.list()])
      setUsers(u)
      setOrgs(o)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    await usersApi.create({
      ...form,
      orgId: ["owner", "org_admin"].includes(form.role) ? form.orgId : null,
    })
    setOpen(false)
    load()
  }

  async function toggleActive(user: PlatformUser) {
    await usersApi.update(user.id, { isActive: !user.isActive })
    load()
  }

  async function remove(user: PlatformUser) {
    if (!confirm(`Delete user ${user.email}?`)) return
    await usersApi.delete(user.id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New platform user</DialogTitle>
            </DialogHeader>
            <form onSubmit={createUser} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as PlatformUser["role"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform_admin">Platform Admin</SelectItem>
                    <SelectItem value="owner">Organization Owner</SelectItem>
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {["owner", "org_admin"].includes(form.role) && (
                <div>
                  <Label>Organization</Label>
                  <Select value={form.orgId} onValueChange={(v) => setForm({ ...form, orgId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select org" />
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
              )}
              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Organization</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge className="border-slate-200 bg-slate-50">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{u.orgName ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <button type="button" onClick={() => toggleActive(u)} className="text-xs underline">
                        {u.isActive ? "active" : "disabled"}
                      </button>
                    </td>
                    <td className="py-3">
                      {u.role !== "super_admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Actions">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleActive(u)}>
                              <UserX className="h-4 w-4" />
                              {u.isActive ? "Disable user" : "Enable user"}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => remove(u)}>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
