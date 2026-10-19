"use client"

import { useState, useEffect } from "react"
import { useAllUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/useUsers"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination } from "@/components/ui/pagination"
import type { User, UserFilters } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, ToggleLeft, ToggleRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatDateTime } from "@/lib/utils"
import { PageMeta } from "@/components/page-meta"

export default function AdminUsersPage() {
  const { page, size, sort, order, setPage, setSize, toggleSort, sortDir } = usePagination()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  useEffect(() => { setPage(0) }, [search, activeFilter])
  const filterKey = `${search}-${activeFilter}`
  const filters: UserFilters = {
    search: search || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
  }
  const { data: users, isLoading, error } = useAllUsers(filters, page, size, sort, order)
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editSlots, setEditSlots] = useState("")

  const handleEdit = (user: User) => {
    setEditUser(user)
    setEditEmail(user.email)
    setEditSlots(user.apiKeySlots.toString())
  }

  const handleEditSave = async () => {
    if (!editUser) return
    try {
      await updateUser.mutateAsync({
        id: editUser.id,
        data: {
          id: editUser.id,
          email: editEmail,
          apiKeySlots: parseInt(editSlots) || editUser.apiKeySlots,
          active: editUser.active,
        },
      })
      toast.success("User updated")
      setEditUser(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to update user")
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          id: user.id,
          active: !user.active,
        },
      })
      toast.success(user.active ? "User deactivated" : "User activated")
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle user status")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteUser.mutateAsync(id)
      toast.success("User deleted permanently")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user")
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Users" description="Manage all registered users on hrva.cc." />
      <div>
        <h1 className="font-display text-2xl">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all registered users</p>
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={!!(editUser?.authProvider && editUser.authProvider !== "local")}
                />
                {editUser?.authProvider && editUser.authProvider !== "local" && (
                  <p className="text-xs text-muted-foreground">
                    Email is managed by {editUser.authProvider === "google" ? "Google" : "GitHub"}. Cannot be changed here.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>API Key Slots</Label>
                <Input type="number" value={editSlots} onChange={(e) => setEditSlots(e.target.value)} />
              </div>
              <Button onClick={handleEditSave} disabled={updateUser.isPending} className="w-full">
                {updateUser.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load users</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : !users || !users.content || users.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">No users found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or status filter.</p>
        </div>
      ) : (
        <div key={filterKey} className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">ID</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("email")}>
                  <div className="flex items-center gap-1">
                    Email
                    {sortDir("email") === "asc" ? <ArrowUp className="h-3 w-3" /> : sortDir("email") === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="hidden lg:table-cell">Slots</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("createDate")}>
                  <div className="flex items-center gap-1">
                    Created
                    {sortDir("createDate") === "asc" ? <ArrowUp className="h-3 w-3" /> : sortDir("createDate") === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("lastLogin")}>
                  <div className="flex items-center gap-1">
                    Last login
                    {sortDir("lastLogin") === "asc" ? <ArrowUp className="h-3 w-3" /> : sortDir("lastLogin") === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("active")}>
                  <div className="flex items-center gap-1">
                    Status
                    {sortDir("active") === "asc" ? <ArrowUp className="h-3 w-3" /> : sortDir("active") === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.content?.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.authProvider && user.authProvider !== "local" ? "secondary" : "outline"}>
                      {user.authProvider === "google" ? "Google" : user.authProvider === "github" ? "GitHub" : "Email"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">{user.apiKeySlots}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground" title={formatDateTime(user.createDate)}>{formatDate(user.createDate)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground lg:table-cell" title={formatDateTime(user.lastLogin)}>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "success" : "destructive"}>
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)} aria-label="Edit user" title="Edit user">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(user)}
                        disabled={updateUser.isPending}
                        title={user.active ? "Deactivate user" : "Activate user"}
                        aria-label={user.active ? "Deactivate user" : "Activate user"}
                      >
                        {user.active
                          ? <ToggleRight className="h-4 w-4 text-success" />
                          : <ToggleLeft className="h-4 w-4 text-destructive" />
                        }
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete user" title="Delete user">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete user?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete {user.email}. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={users?.totalPages ?? 0}
            totalElements={users?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}
    </div>
  )
}
