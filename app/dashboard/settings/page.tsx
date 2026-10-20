"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { userApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageMeta } from "@/components/page-meta"
import { TwoFactorCard } from "@/components/two-factor-card"
import { ConnectedAppsCard } from "@/components/connected-apps-card"

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState(user?.email || "")
  const [profileLoading, setProfileLoading] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const handleExport = async () => {
    setExportLoading(true)
    try {
      await userApi.exportMyData()
      toast.success("Your data has been downloaded.")
    } catch (err: any) {
      toast.error(err.message || "Failed to export data")
    } finally {
      setExportLoading(false)
    }
  }

  const isLocalAccount = !user?.authProvider || user.authProvider === "local"

  const handleDeleteAccount = async () => {
    if (!confirm("Permanently delete your account, all your URLs and API keys? This cannot be undone.")) {
      return
    }
    setDeleteLoading(true)
    try {
      await userApi.deleteMe(isLocalAccount ? { password: deletePassword } : undefined)
      toast.success("Your account has been deleted.")
      logout()
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setProfileLoading(true)
    try {
      await userApi.update(user.id, { id: user.id, email })
      await refreshUser()
      toast.success("Profile updated! Please sign in again.")
      logout()
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile")
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setPasswordLoading(true)
    try {
      await userApi.updatePassword({ oldPassword, newPassword })
      toast.success("Password changed successfully!")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Failed to change password")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageMeta title="Dashboard — Settings" description="Manage your hrva.cc account settings and password." />
      <div>
        <h1 className="font-display text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 max-w-sm" />
            </div>
            <Button type="submit" disabled={profileLoading} size="sm">
              {profileLoading ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="h-10 max-w-sm" />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-10 max-w-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-10 max-w-sm" />
            </div>
            <Button type="submit" disabled={passwordLoading} size="sm">
              {passwordLoading ? "Changing…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <TwoFactorCard />

      <ConnectedAppsCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data</CardTitle>
          <CardDescription>Download all your data (profile, URLs, API keys, emails) as JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" size="sm" disabled={exportLoading} onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            {exportLoading ? "Preparing…" : "Download my data"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete account</CardTitle>
          <CardDescription>Permanently delete your account, URLs and API keys. This cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLocalAccount && (
              <div className="space-y-1.5">
                <Label htmlFor="deletePassword">Confirm with your password</Label>
                <Input id="deletePassword" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="h-10 max-w-sm" />
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteLoading || (isLocalAccount && !deletePassword)}
              onClick={handleDeleteAccount}
            >
              {deleteLoading ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
