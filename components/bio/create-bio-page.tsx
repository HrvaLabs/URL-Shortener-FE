"use client"

import { useId } from "react"
import { HandleField, useHandleForm } from "@/components/bio/handle-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { useCreateBioPage } from "@/lib/hooks/useBioPage"

export function CreateBioPage() {
  const id = useId()
  const create = useCreateBioPage()
  const form = useHandleForm((handle) => create.mutateAsync(handle))

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <h2 className="text-base font-semibold leading-tight tracking-tight">Create your bio page</h2>
        <CardDescription>One page with your links, for your Instagram, TikTok or any other bio.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.onSubmit} noValidate className="space-y-3">
          <HandleField
            id={`${id}-handle`}
            label="Handle"
            value={form.value}
            onChange={form.onChange}
            currentHandle={null}
            error={form.error}
            hint="3–30 characters: letters, numbers, - and _."
            inputRef={form.inputRef}
          />
          <Button
            type="submit"
            size="sm"
            aria-disabled={form.busy}
            aria-busy={form.busy}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {form.busy ? "Creating…" : "Create page"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
