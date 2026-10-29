"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationApi } from "@/lib/api-client"
import type { EmailNotificationType, NotificationChannelInput, NotificationConsent } from "@/lib/types"

const CONSENTS_KEY = ["notifications", "consents"]

const CHANNELS_KEY = ["notifications", "channels"]

const SET_CONSENT_KEY = ["notifications", "set-consent"]

export function useNotificationConsents() {
  return useQuery({
    queryKey: CONSENTS_KEY,
    queryFn: notificationApi.consents,
  })
}

export function useSetConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: SET_CONSENT_KEY,
    mutationFn: ({ type, consented }: { type: EmailNotificationType; consented: boolean }) => notificationApi.setConsent(type, consented),
    onMutate: async ({ type, consented }) => {
      await queryClient.cancelQueries({ queryKey: CONSENTS_KEY })
      const previous = queryClient.getQueryData<NotificationConsent[]>(CONSENTS_KEY)
      queryClient.setQueryData<NotificationConsent[]>(CONSENTS_KEY, (consents) =>
        consents?.map((consent) => (consent.type === type ? { ...consent, consented } : consent)),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(CONSENTS_KEY, context.previous)
      toast.error(error.message)
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: SET_CONSENT_KEY }) === 1) return queryClient.invalidateQueries({ queryKey: CONSENTS_KEY })
    },
  })
}

export function useNotificationChannels() {
  return useQuery({
    queryKey: CHANNELS_KEY,
    queryFn: notificationApi.channels,
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NotificationChannelInput) => notificationApi.createChannel(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: NotificationChannelInput }) => notificationApi.updateChannel(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationApi.deleteChannel(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  })
}

export function useTestChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationApi.testChannel(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  })
}

export function useNewSigningSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationApi.newSigningSecret(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  })
}
