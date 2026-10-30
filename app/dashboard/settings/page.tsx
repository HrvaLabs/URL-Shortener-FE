"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { userApi } from "@/lib/api-client"
import { useReauthToast } from "@/lib/hooks/useReauthToast"
import { useNeedsPassword } from "@/lib/hooks/useSignInMethods"
import { isLocalAccount } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { PageMeta } from "@/components/page-meta"
import { PasskeysCard } from "@/components/passkeys-card"
import { SignInMethodsCard } from "@/components/sign-in-methods-card"
import { TwoStepCard } from "@/components/two-step-card"
import { ConnectedAppsCard } from "@/components/connected-apps-card"
import { NotificationsCard } from "@/components/notifications/notifications-card"
import { CustomDomainsCard } from "@/components/domains/custom-domains-card"

export default function SettingsPage() {
  const { user, refreshUser, logout, logoutTo, isAdmin } = useAuth()
  const [email, setEmail] = useState(user?.email || "")
  const [profileLoading, setProfileLoading] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const deletePasswordRef = useRef<HTMLInputElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const focusAfterRefusedDeletion = useRef(false)
  const showError = useReauthToast()
  const needsPassword = useNeedsPassword()

  useEffect(() => {
    if (deleteLoading || !focusAfterRefusedDeletion.current) return
    focusAfterRefusedDeletion.current = false
    const field = deletePasswordRef.current
    if (field) {
      field.focus()
      field.select()
    } else {
      deleteButtonRef.current?.focus()
    }
  }, [deleteLoading])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      await userApi.exportMyData()
      toast.success("Your data has been downloaded.")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to export data")
    } finally {
      setExportLoading(false)
    }
  }

  const isLocal = isLocalAccount(user)
  const canEditEmail = isAdmin && isLocal

  const handleDeleteAccount = async () => {
    if (!confirm("Permanently delete your account, all your links, API keys and passkeys? This cannot be undone.")) {
      return
    }
    setDeleteLoading(true)
    try {
      await userApi.deleteMe(needsPassword ? { password: deletePassword } : undefined)
      toast.success("Your account has been deleted.")
      logoutTo("/login")
    } catch (err) {
      showError(err, err instanceof Error && err.message ? err.message : "Failed to delete account")
      focusAfterRefusedDeletion.current = true
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
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to update profile")
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
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to change password")
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
          <CardDescription>{canEditEmail ? "Update your email address" : "The email address you sign in with"}</CardDescription>
        </CardHeader>
        <CardContent>
          {canEditEmail ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 h-10 max-w-sm" />
              </div>
              <Button type="submit" disabled={profileLoading} size="sm">
                {profileLoading ? "Saving…" : "Save changes"}
              </Button>
            </form>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium wrap-anywhere">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                To change it, email <a href="mailto:privacy@hrvalabs.net" className="text-brand underline-offset-4 hover:underline">privacy@hrvalabs.net</a>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {needsPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input id="oldPassword" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="mt-1.5 h-10 max-w-sm" />
              </div>
              <Separator />
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1.5 h-10 max-w-sm" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1.5 h-10 max-w-sm" />
              </div>
              <Button type="submit" disabled={passwordLoading} size="sm">
                {passwordLoading ? "Changing…" : "Change password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <NotificationsCard />

      <CustomDomainsCard />

      <SignInMethodsCard />

      <PasskeysCard />

      <TwoStepCard />

      <ConnectedAppsCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data</CardTitle>
          <CardDescription>Download all your data (profile, URLs, API keys, passkeys, emails, notification settings) as JSON</CardDescription>
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
          <CardDescription>Permanently delete your account, links, API keys, passkeys and notification channels. This cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {needsPassword && (
              <div>
                <Label htmlFor="deletePassword">Confirm with your password</Label>
                <Input ref={deletePasswordRef} id="deletePassword" type="password" autoComplete="current-password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="mt-1.5 h-10 max-w-sm" />
              </div>
            )}
            <Button
              ref={deleteButtonRef}
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteLoading || (needsPassword && !deletePassword)}
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
