"use client"

import { useId, useRef, useState, type RefObject } from "react"
import { flushSync } from "react-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { ChannelDialog } from "@/components/notifications/channel-dialog"
import { DeleteChannelDialog } from "@/components/notifications/delete-channel-dialog"
import { SigningSecretPanel } from "@/components/notifications/signing-secret-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ApiError } from "@/lib/api-client"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import {
  useDeleteChannel,
  useNewSigningSecret,
  useNotificationChannels,
  useTestChannel,
  useUpdateChannel,
} from "@/lib/hooks/useNotifications"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import { CHANNEL_EVENT_LABELS, CHANNEL_FIELD_LABELS, CHANNEL_TYPES, MAX_CHANNELS, deliveryLine } from "@/lib/notifications"
import type { ChannelType, NotificationChannel, NotificationChannelInput } from "@/lib/types"

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const typeLabel = (type: ChannelType) => CHANNEL_TYPES.find((option) => option.type === type)?.label ?? type

const TEST_DESTINATIONS: Record<ChannelType, string> = {
  DISCORD: "Discord",
  SLACK: "Slack",
  TELEGRAM: "Telegram",
  NTFY: "ntfy",
  WEBHOOK: "your webhook",
}

const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : "Something went wrong. Try again.")

const SAVE_SECRET_FIRST = "Save the signing secret shown above first."

const testButtonId = (channelId: number) => `notification-channel-${channelId}-test`

const withoutKey = <T,>(record: Record<number, T>, key: number): Record<number, T> =>
  Object.fromEntries(Object.entries(record).filter(([candidate]) => Number(candidate) !== key))

const inputOf = (channel: NotificationChannel, enabled: boolean): NotificationChannelInput => ({
  name: channel.name,
  type: channel.type,
  enabled,
  events: channel.events,
  chatId: channel.chatId,
})

interface TestOutcome {
  delivered: boolean
  text: string
}

interface ShownSecret {
  channelId: number
  channelName: string
  value: string
}

interface DialogState {
  mode: "create" | "edit"
  channel?: NotificationChannel
  key: number
}

interface ChannelListProps {
  titleRef: RefObject<HTMLHeadingElement | null>
}

export function ChannelList({ titleRef }: ChannelListProps) {
  const limitHintId = useId()
  const { data: channels, error, isFetching, refetch } = useNotificationChannels()
  const update = useUpdateChannel()
  const test = useTestChannel()
  const remove = useDeleteChannel()
  const rotate = useNewSigningSecret()
  const retry = useFocusAfterRetry(titleRef, channels !== undefined)
  const listRef = useRef<HTMLUListElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const secretHeadingRef = useRef<HTMLHeadingElement>(null)
  const deleteTrigger = useRef<HTMLElement | null>(null)
  const rotateTrigger = useRef<HTMLElement | null>(null)
  const dialogTrigger = useRef<HTMLElement | null>(null)
  const secretJustShown = useRef(false)
  const removal = useRowRemovalFocus(addButtonRef)
  const [switching, setSwitching] = useState<Record<number, boolean>>({})
  const [testing, setTesting] = useState<number[]>([])
  const [tests, setTests] = useState<Record<number, TestOutcome>>({})
  const [deleting, setDeleting] = useState<NotificationChannel | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [rotating, setRotating] = useState<NotificationChannel | null>(null)
  const [rotateBusy, setRotateBusy] = useState(false)
  const [secret, setSecret] = useState<ShownSecret | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ mode: "create", key: 0 })
  const [dialogOpen, setDialogOpen] = useState(false)

  const atLimit = (channels?.length ?? 0) >= MAX_CHANNELS
  const addBlocked = atLimit || secret !== null
  const addHint = secret ? SAVE_SECRET_FIRST : atLimit ? `You can have up to ${MAX_CHANNELS} channels.` : null
  const now = new Date()

  const toggle = async (channel: NotificationChannel, enabled: boolean) => {
    if (channel.id in switching) return
    setSwitching((current) => ({ ...current, [channel.id]: enabled }))
    try {
      await update.mutateAsync({ id: channel.id, input: inputOf(channel, enabled) })
      setTests((current) => withoutKey(current, channel.id))
    } catch (err) {
      toast.error(errorText(err))
    } finally {
      setSwitching((current) => withoutKey(current, channel.id))
    }
  }

  const sendTest = async (channel: NotificationChannel) => {
    if (testing.includes(channel.id)) return
    setTesting((current) => [...current, channel.id])
    setTests((current) => withoutKey(current, channel.id))
    let outcome: TestOutcome
    try {
      const result = await test.mutateAsync(channel.id)
      outcome = result.delivered
        ? { delivered: true, text: `Sent. Check ${TEST_DESTINATIONS[channel.type]}.` }
        : { delivered: false, text: result.error || "Couldn't reach the channel." }
    } catch (err) {
      outcome = { delivered: false, text: errorText(err) }
    }
    setTests((current) => ({ ...current, [channel.id]: outcome }))
    setTesting((current) => current.filter((id) => id !== channel.id))
  }

  const neighbourOf = (trigger: HTMLElement | null): HTMLElement | null => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-remove-row]") ?? [])
    const index = trigger ? buttons.indexOf(trigger) : -1
    return index === -1 ? null : (buttons[index + 1] ?? buttons[index - 1] ?? null)
  }

  const confirmDelete = async () => {
    if (!deleting || deleteBusy) return
    const neighbour = neighbourOf(deleteTrigger.current)
    setDeleteBusy(true)
    try {
      await remove.mutateAsync(deleting.id)
      toast.success("Channel deleted")
    } catch (err) {
      toast.error(errorText(err))
      if (!(err instanceof ApiError && err.status === 404)) {
        setDeleteBusy(false)
        return
      }
    }
    removal.setTarget(neighbour)
    if (secret?.channelId === deleting.id) setSecret(null)
    setTests((current) => withoutKey(current, deleting.id))
    setDeleteBusy(false)
    setDeleting(null)
  }

  const confirmRotate = async () => {
    if (!rotating || rotateBusy) return
    setRotateBusy(true)
    try {
      const { signingSecret } = await rotate.mutateAsync(rotating.id)
      secretJustShown.current = true
      setSecret({ channelId: rotating.id, channelName: rotating.name, value: signingSecret })
    } catch (err) {
      toast.error(errorText(err))
    }
    setRotateBusy(false)
    setRotating(null)
  }

  const openDialog = (mode: DialogState["mode"], trigger: HTMLElement, channel?: NotificationChannel) => {
    dialogTrigger.current = trigger
    if (channel) setTests((current) => withoutKey(current, channel.id))
    setDialog((current) => ({ mode, channel, key: current.key + 1 }))
    setDialogOpen(true)
  }

  const focusSecretOrReturn = (event: Event, returnTo: HTMLElement | null) => {
    const heading = secretJustShown.current ? secretHeadingRef.current : null
    secretJustShown.current = false
    const next = heading?.isConnected ? heading : returnTo?.isConnected ? returnTo : addButtonRef.current
    if (!next) return
    event.preventDefault()
    next.focus()
  }

  const dismissSecret = () => {
    const channelId = secret?.channelId
    flushSync(() => setSecret(null))
    const next = channelId === undefined ? null : document.getElementById(testButtonId(channelId))
    ;(next ?? addButtonRef.current)?.focus()
  }

  const addButton = (
    <div className="space-y-1.5">
      <Button
        ref={addButtonRef}
        type="button"
        variant="outline"
        size="sm"
        aria-disabled={addBlocked}
        aria-describedby={addHint ? limitHintId : undefined}
        onClick={(event) => { if (!addBlocked) openDialog("create", event.currentTarget) }}
        className="gap-1.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add channel
      </Button>
      {addHint && <p id={limitHintId} className="text-xs text-muted-foreground">{addHint}</p>}
    </div>
  )

  return (
    <section aria-labelledby="notifications-channels-heading" className="space-y-3">
      <h4 id="notifications-channels-heading" className="text-sm font-semibold">Chat apps and webhooks</h4>
      {secret && (
        <SigningSecretPanel ref={secretHeadingRef} channelName={secret.channelName} secret={secret.value} onDone={dismissSecret} />
      )}
      {channels === undefined ? (
        error ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">Couldn&apos;t load your channels.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-disabled={isFetching}
              onClick={() => { if (!isFetching) retry(refetch) }}
              className="aria-disabled:opacity-50"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1].map((row) => (
              <Skeleton key={row} className="h-24 w-full" />
            ))}
          </div>
        )
      ) : channels.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No channels yet. Add Discord, Slack, Telegram, ntfy or a webhook to get notifications there.</p>
          {addButton}
        </div>
      ) : (
        <>
          <ul ref={listRef} className="divide-y rounded-lg border">
            {channels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                now={now}
                enabled={switching[channel.id] ?? channel.enabled}
                switching={channel.id in switching}
                testing={testing.includes(channel.id)}
                testOutcome={tests[channel.id]}
                rotateHintId={secret ? limitHintId : undefined}
                onToggle={(enabled) => toggle(channel, enabled)}
                onTest={() => sendTest(channel)}
                onEdit={(trigger) => openDialog("edit", trigger, channel)}
                onRotate={(trigger) => {
                  if (secret) return
                  rotateTrigger.current = trigger
                  setRotating(channel)
                }}
                onDelete={(trigger) => {
                  deleteTrigger.current = trigger
                  setDeleting(channel)
                }}
              />
            ))}
          </ul>
          {addButton}
        </>
      )}
      <ChannelDialog
        key={dialog.key}
        mode={dialog.mode}
        channel={dialog.channel}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(signingSecret, created) => {
          if (!signingSecret) return
          secretJustShown.current = true
          setSecret({ channelId: created.id, channelName: created.name, value: signingSecret })
        }}
        onCloseAutoFocus={(event) => focusSecretOrReturn(event, dialogTrigger.current)}
      />
      <DeleteChannelDialog
        channelName={deleting?.name ?? null}
        busy={deleteBusy}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        onConfirm={confirmDelete}
        onCloseAutoFocus={(event) => removal.onCloseAutoFocus(event, deleteTrigger.current)}
      />
      <AlertDialog open={rotating !== null} onOpenChange={(open) => { if (!open && !rotateBusy) setRotating(null) }}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => { if (rotateBusy) event.preventDefault() }}
          onCloseAutoFocus={(event) => focusSecretOrReturn(event, rotateTrigger.current)}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="[overflow-wrap:anywhere]">New signing secret for {rotating?.name}?</AlertDialogTitle>
            <AlertDialogDescription>The old secret stops working at once. Continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={rotateBusy}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={confirmRotate}
              aria-disabled={rotateBusy}
              aria-busy={rotateBusy}
              className="aria-disabled:opacity-50"
            >
              {rotateBusy ? "Creating..." : "New signing secret"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

interface ChannelRowProps {
  channel: NotificationChannel
  now: Date
  enabled: boolean
  switching: boolean
  testing: boolean
  testOutcome: TestOutcome | undefined
  rotateHintId: string | undefined
  onToggle: (enabled: boolean) => void
  onTest: () => void
  onEdit: (trigger: HTMLElement) => void
  onRotate: (trigger: HTMLElement) => void
  onDelete: (trigger: HTMLElement) => void
}

function ChannelRow({ channel, now, enabled, switching, testing, testOutcome, rotateHintId, onToggle, onTest, onEdit, onRotate, onDelete }: ChannelRowProps) {
  const id = useId()
  const switchId = `${id}-enabled`
  const failed = channel.autoDisabledAt != null || channel.lastDelivery?.status === "FAILED"
  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{channel.name}</p>
        <Badge variant="secondary">{typeLabel(channel.type)}</Badge>
      </div>
      <p className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
        {channel.maskedTarget}
        {channel.chatId && <span className="font-sans">{`, ${CHANNEL_FIELD_LABELS.chatId} ${channel.chatId}`}</span>}
      </p>
      {channel.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">This channel gets nothing until you pick an event.</p>
      ) : (
        <ul aria-label="Events" className="flex flex-wrap gap-1.5">
          {channel.events.map((event) => (
            <li key={event}><Badge variant="outline" className="font-normal">{CHANNEL_EVENT_LABELS[event] ?? event}</Badge></li>
          ))}
        </ul>
      )}
      {(!testOutcome || channel.autoDisabledAt != null) && (
        <p role="status" className={failed ? "text-xs text-destructive [overflow-wrap:anywhere]" : "text-xs text-muted-foreground [overflow-wrap:anywhere]"}>
          {deliveryLine(channel, now)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="mr-1 flex items-center gap-2">
          <Switch
            id={switchId}
            checked={enabled}
            aria-label={`Turn ${channel.name} on or off`}
            aria-disabled={switching}
            aria-busy={switching}
            onCheckedChange={(checked) => { if (!switching) onToggle(checked) }}
            className="aria-disabled:opacity-60"
          />
          <span aria-hidden="true" className="text-sm">{enabled ? "On" : "Off"}</span>
        </div>
        <Button
          id={testButtonId(channel.id)}
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Send test to ${channel.name}`}
          aria-disabled={testing}
          aria-busy={testing}
          onClick={() => { if (!testing) onTest() }}
          className={rowButton}
        >
          {testing ? "Sending..." : "Send test"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Edit ${channel.name}`}
          onClick={(event) => onEdit(event.currentTarget)}
          className={rowButton}
        >
          Edit
        </Button>
        {channel.type === "WEBHOOK" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`New signing secret for ${channel.name}`}
            aria-disabled={rotateHintId !== undefined}
            aria-describedby={rotateHintId}
            onClick={(event) => { if (!rotateHintId) onRotate(event.currentTarget) }}
            className={rowButton}
          >
            New signing secret
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-remove-row
          aria-label={`Delete ${channel.name}`}
          onClick={(event) => onDelete(event.currentTarget)}
          className={`${rowButton} border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive`}
        >
          Delete
        </Button>
      </div>
      {testOutcome && (
        testOutcome.delivered ? (
          <p role="status" className="text-sm text-success [overflow-wrap:anywhere]">{testOutcome.text}</p>
        ) : (
          <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{testOutcome.text}</p>
        )
      )}
    </li>
  )
}
