"use client"

import { useState, type MouseEvent } from "react"
import { toast } from "sonner"
import { userApi } from "@/lib/api-client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export const SIGNED_OUT_EVERYWHERE = "Signed out everywhere else. This device stays signed in."

export function SignOutEverywhereCard() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const handleConfirm = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setPending(true)
    try {
      await userApi.endAllSessions()
      setOpen(false)
      toast.success(SIGNED_OUT_EVERYWHERE)
    } catch (err) {
      setOpen(false)
      toast.error(err instanceof Error && err.message ? err.message : "Couldn't sign out the other devices. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign out everywhere</CardTitle>
        <CardDescription>
          Signs out every other browser and device where you&apos;re signed in. API keys and connected apps keep working.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Sign out everywhere
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out everywhere else?</AlertDialogTitle>
              <AlertDialogDescription>
                Every other browser and device has to sign in again. This one stays signed in. API keys and connected apps
                aren&apos;t affected; revoke or disconnect them on their own.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} disabled={pending} className={buttonVariants({ variant: "destructive" })}>
                {pending ? "Signing out…" : "Sign out everywhere"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
