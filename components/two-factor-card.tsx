"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function TwoFactorCard() {
  const { user, refreshUser } = useAuth()
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUri: string } | null>(null)
  const [code, setCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)

  const isLocal = !user?.authProvider || user.authProvider === "local"
  const enabled = !!user?.twoFactorEnabled

  if (!isLocal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Two-factor authentication</CardTitle>
          <CardDescription>Managed by your login provider for social accounts.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const startSetup = async () => {
    setLoading(true)
    try {
      setSetupData(await authApi.setupTwoFactor())
    } catch (err: any) {
      toast.error(err.message || "Failed to start 2FA setup")
    } finally {
      setLoading(false)
    }
  }

  const confirmEnable = async () => {
    setLoading(true)
    try {
      const res = await authApi.enableTwoFactor(code)
      setRecoveryCodes(res.recoveryCodes)
      setSetupData(null)
      setCode("")
      await refreshUser()
      toast.success("Two-factor authentication enabled")
    } catch (err: any) {
      toast.error(err.message || "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  const disable = async () => {
    setLoading(true)
    try {
      await authApi.disableTwoFactor(disableCode)
      setDisableCode("")
      await refreshUser()
      toast.success("Two-factor authentication disabled")
    } catch (err: any) {
      toast.error(err.message || "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Two-factor authentication
          {enabled && <Badge variant="success">On</Badge>}
        </CardTitle>
        <CardDescription>Add a TOTP authenticator app as a second login step.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recoveryCodes && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Save these recovery codes. Each works once if you lose your authenticator. They won't be shown again.</p>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
              {recoveryCodes.map((c) => <span key={c}>{c}</span>)}
            </div>
            <Button size="sm" variant="outline" onClick={() => setRecoveryCodes(null)}>Done</Button>
          </div>
        )}

        {!recoveryCodes && enabled && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="disableCode">Code to disable</Label>
              <Input id="disableCode" inputMode="numeric" placeholder="123456 or recovery code" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} className="h-10 max-w-sm" />
            </div>
            <Button variant="destructive" size="sm" disabled={loading || !disableCode} onClick={disable}>
              {loading ? "Disabling…" : "Disable 2FA"}
            </Button>
          </div>
        )}

        {!recoveryCodes && !enabled && !setupData && (
          <Button size="sm" disabled={loading} onClick={startSetup}>
            {loading ? "Starting…" : "Enable 2FA"}
          </Button>
        )}

        {!recoveryCodes && !enabled && setupData && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Scan with your authenticator app, then enter the 6-digit code.</p>
            <div className="inline-block rounded-lg border bg-white p-2">
              <QRCodeSVG value={setupData.otpauthUri} size={160} fgColor="#0e0e11" bgColor="#ffffff" />
            </div>
            <p className="break-all text-xs text-muted-foreground">Secret: <span className="font-mono text-foreground">{setupData.secret}</span></p>
            <div className="space-y-1.5">
              <Label htmlFor="enableCode">Verification code</Label>
              <Input id="enableCode" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} className="h-10 max-w-sm" autoFocus />
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={loading || !code} onClick={confirmEnable}>
                {loading ? "Verifying…" : "Verify & enable"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setSetupData(null); setCode("") }}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
