import { getApiBaseUrl } from "./utils"
import type { UrlResponse, ApiKeyResponse, UserDto, User, PeekUrl, CreateUrlDto, UrlUpdateDto, ApiKeyUpdateDto, UserUpdateDto, UpdatePasswordDto, LinkPreviewResponse, Page, AdminStatsResponse, UrlFilters, UserFilters, AuditLog, EmailLog, AnalyticsOverview, AnalyticsRange, UrlAnalytics, ConnectRequestView, ConnectApproval, ConnectDenial, ConnectedApp, BlocklistSource, BlocklistSourceInput, DomainRule, DomainRuleType, DomainRuleInput, DomainRuleCreated, DomainBlockPreview, DomainBulkBlockResult, LinksAffected, ReviewEntry, ReviewQueueFilters, ReviewAction, ReviewBulkResolveResult, UrlCheckResult, LinkReport, TrafficStats, LinksStats, UsersStats, SafetyStats, SystemStats, ReservedAlias, ReservedAliasInput, LoginResponse, SignedIn, PasskeyOptions, CreationOptionsJSON, RequestOptionsJSON, RegistrationCredentialJSON, AssertionCredentialJSON, Passkey, TwoStepStatus, PublicStatsResponse, BioPage, BioPageUpdate, BioHandleAvailability, BioPageAnalytics, AdminBioPage, BioPageReviewEntry, BioPageReviewAction, ApiKeysDeleted, EmailNotificationType, NotificationConsent, NotificationChannel, NotificationChannelInput, ChannelTestResult, UnsubscribeResult, CustomDomain, MyDomains, DomainRemoval, DomainLinkMode, AdminDomain, AdminDomainFilters, DomainSummary, CloudflareCheck, DomainReconcile, DomainAllowance, ApiKeyFilters, AuditLogFilters, EmailLogFilters, LoginAttempt } from "./types"

export const REQUEST_FAILED = "Request failed"

export const CANT_REACH = "Can't reach hrva.cc right now. Check your connection and try again."

export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
    this.name = "ApiError"
  }
}

interface PageWrapper {
  page: { totalPages: number; totalElements: number; number?: number; size?: number }
  totalPages?: number
  totalElements?: number
  number?: number
  size?: number
}

const isPageWrapper = (data: unknown): data is PageWrapper =>
  typeof data === "object" && data !== null && (data as PageWrapper).page?.totalPages != null

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

type ListParam = string | number | boolean | null | undefined

const listParams = (page: number, size: number, sort?: string, order?: string, extra: Record<string, ListParam> = {}) => {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
  for (const [name, value] of Object.entries(extra)) {
    if (value != null && value !== "") params.set(name, String(value))
  }
  return params
}

function errorMessage(body: unknown, status: number): string {
  const fallback = status >= 500 ? CANT_REACH : REQUEST_FAILED
  if (typeof body !== "object" || body === null) return fallback
  const fields = body as Record<string, unknown>
  // New API: { "error": "message" }, old API: { "message": "..." }, validation: { "field": "message" }
  const message = fields.error ?? fields.message ?? Object.values(fields).filter((value) => typeof value === "string").join(". ")
  return typeof message === "string" && message ? message : fallback
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const token = localStorage.getItem("auth-token")

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    reqHeaders["Authorization"] = token
  }

  if (headers) {
    Object.assign(reqHeaders, headers)
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(CANT_REACH, 0)
  }

  if (!response.ok) {
    const errorBody = await readBody(response).catch(() => undefined)
    throw new ApiError(errorMessage(errorBody, response.status), response.status, validationFields(errorBody))
  }

  if (response.status === 204 || response.status === 202) return {} as T

  const data = await readBody(response)

  // Normalize Spring Page wrapper: some endpoints return
  // {"content":[...],"page":{"totalPages":2,"totalElements":13}}
  // instead of flat fields. Promote nested page fields to root.
  if (isPageWrapper(data)) {
    data.totalPages = data.page.totalPages
    data.totalElements = data.page.totalElements
    data.number = data.page.number ?? data.number
    data.size = data.page.size ?? data.size
  }

  return data as T
}

// Auth
export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    request<LoginResponse>("POST", "/auth/login", data),
  secondStepTotp: (pendingToken: string, code: string) =>
    request<SignedIn>("POST", "/auth/2fa/totp", { pendingToken, code }),
  secondStepPasskeyOptions: (pendingToken: string) =>
    request<PasskeyOptions<RequestOptionsJSON>>("POST", "/auth/2fa/webauthn/options", { pendingToken }),
  secondStepPasskey: (pendingToken: string, ceremonyId: string, credential: AssertionCredentialJSON) =>
    request<SignedIn>("POST", "/auth/2fa/webauthn/verify", { pendingToken, ceremonyId, credential }),
  passkeyOptions: () =>
    request<PasskeyOptions<RequestOptionsJSON>>("POST", "/auth/passkeys/options"),
  passkeySignIn: (ceremonyId: string, credential: AssertionCredentialJSON, rememberMe: boolean) =>
    request<SignedIn>("POST", "/auth/passkeys/verify", { ceremonyId, credential, rememberMe }),
  setupTwoFactor: () =>
    request<{ secret: string; otpauthUri: string }>("POST", "/auth/2fa/setup"),
  enableTwoFactor: (code: string) =>
    request<{ recoveryCodes: string[] }>("POST", "/auth/2fa/enable", { code }),
  register: (data: { email: string; password: string }) =>
    request<string>("POST", "/auth/register", data),
  requestPasswordReset: (data: { email: string }) =>
    request<void>("POST", "/auth/password-reset", data),
  resetPassword: (data: { token: string; email: string; password: string }) =>
    request<User>("POST", "/auth/password-reset/confirm", data),
  verifyEmail: (token: string) =>
    request<void>("POST", "/auth/verify-email/confirm", { token }),
  resendVerification: (email: string) =>
    request<void>("POST", "/auth/verify-email/resend", { email }),
}

export const passkeyApi = {
  list: () =>
    request<Passkey[]>("GET", "/users/me/passkeys"),
  registrationOptions: (password?: string) =>
    request<PasskeyOptions<CreationOptionsJSON>>("POST", "/users/me/passkeys/registration/options", { password }),
  register: (ceremonyId: string, credential: RegistrationCredentialJSON, label: string) =>
    request<Passkey>("POST", "/users/me/passkeys", { ceremonyId, credential, label }),
  rename: (id: number, label: string) =>
    request<Passkey>("PATCH", `/users/me/passkeys/${id}`, { label }),
  remove: (id: number, password?: string) =>
    request<void>("DELETE", `/users/me/passkeys/${id}`, { password }),
}

export const twoStepApi = {
  status: () =>
    request<TwoStepStatus>("GET", "/users/me/two-step"),
  enable: () =>
    request<{ recoveryCodes: string[] }>("POST", "/users/me/two-step/enable"),
  disableOptions: () =>
    request<PasskeyOptions<RequestOptionsJSON>>("POST", "/users/me/two-step/disable/options"),
  disable: (confirmation: { code: string } | { ceremonyId: string; credential: AssertionCredentialJSON }) =>
    request<void>("POST", "/users/me/two-step/disable", confirmation),
  removeTotp: (code: string) =>
    request<void>("DELETE", "/users/me/two-step/totp", { code }),
}

// URL
export const urlApi = {
  create: (data: CreateUrlDto, apiKey?: string) => {
    const headers = apiKey ? { "X-Api-Key": apiKey } : undefined
    return request<UrlResponse>("POST", "/urls", data, headers)
  },
  bulkCreate: (data: CreateUrlDto[]) =>
    request<UrlResponse[]>("POST", "/urls/bulk", data),
  getMyUrls: (filters: UrlFilters = {}, page = 0, size = 20, sort?: string, order?: string) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
    if (filters.search) params.set("search", filters.search)
    if (filters.active != null) params.set("active", String(filters.active))
    if (filters.expired) params.set("expired", "true")
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.tag) params.set("tag", filters.tag)
    return request<Page<UrlResponse>>("GET", `/urls?${params}`)
  },
  getMyTags: () =>
    request<string[]>("GET", "/urls/tags"),
  getAllUrls: (filters: UrlFilters = {}, page = 0, size = 20, sort?: string, order?: string) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
    if (filters.search) params.set("search", filters.search)
    if (filters.active != null) params.set("active", String(filters.active))
    if (filters.expired) params.set("expired", "true")
    if (filters.anonymous) params.set("anonymous", "true")
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.deadDestination) params.set("deadDestination", "true")
    return request<Page<UrlResponse>>("GET", `/urls/all?${params}`)
  },
  getByShort: (short: string, domain?: string | null) =>
    request<UrlResponse>("GET", `/urls/${short}${domainQuery(domain, "?")}`),
  unlock: (short: string, password: string, domain?: string | null) =>
    request<{ longUrl: string }>("POST", `/urls/${short}/unlock${domainQuery(domain, "?")}`, { password }),
  peek: (short: string, domain?: string | null) =>
    request<PeekUrl>("GET", `/urls/${short}/peek${domainQuery(domain, "?")}`),
  preview: (short: string, domain?: string | null) =>
    request<LinkPreviewResponse>("GET", `/urls/${short}/preview${domainQuery(domain, "?")}`),
  getQrCodeUrl: (short: string, size = 300, domain?: string | null) =>
    `${getApiBaseUrl()}/urls/${short}/qr?size=${size}${domainQuery(domain, "&")}`,
  update: (id: number, data: UrlUpdateDto) =>
    request<UrlResponse>("PUT", `/urls/${id}`, data),
  deactivate: (id: number) =>
    request<UrlResponse>("PATCH", `/urls/${id}/deactivate`),
  activate: (id: number) =>
    request<UrlResponse>("PATCH", `/urls/${id}/activate`),
  delete: (id: number) =>
    request<void>("DELETE", `/urls/${id}`),
  exportCsv: async () => {
    const baseUrl = getApiBaseUrl()
    const token = localStorage.getItem("auth-token")
    const response = await fetch(`${baseUrl}/urls/export`, {
      headers: token ? { "Authorization": token } : {},
    })
    if (!response.ok) throw new Error("Failed to export")
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "my-urls.csv"
    a.click()
    URL.revokeObjectURL(url)
  },
}

// API Key
export const apiKeyApi = {
  generate: () =>
    request<ApiKeyResponse>("POST", "/api-keys"),
  getMyKeys: (active?: boolean) =>
    request<ApiKeyResponse[]>("GET", active == null ? "/api-keys" : `/api-keys?active=${active}`),
  getMyInactiveKeys: (page = 0, size = 10) =>
    request<Page<ApiKeyResponse>>("GET", `/api-keys/inactive?${listParams(page, size)}`),
  getAllKeys: (filters: ApiKeyFilters = {}, page = 0, size = 20, sort = "createDate", order = "desc") =>
    request<Page<ApiKeyResponse>>("GET", `/api-keys/all?${listParams(page, size, sort, order, { search: filters.search, active: filters.active })}`),
  update: (id: number, data: ApiKeyUpdateDto) =>
    request<ApiKeyResponse>("PUT", `/api-keys/${id}`, data),
  revoke: (id: number) =>
    request<ApiKeyResponse>("PATCH", `/api-keys/${id}/revoke`),
  activate: (id: number) =>
    request<ApiKeyResponse>("PATCH", `/api-keys/${id}/activate`),
  delete: (id: number) =>
    request<void>("DELETE", `/api-keys/${id}`),
  deleteInactive: () =>
    request<ApiKeysDeleted>("DELETE", "/api-keys/inactive"),
}

// User
export const userApi = {
  getMe: () =>
    request<UserDto>("GET", "/users/me"),
  getAll: (filters: UserFilters = {}, page = 0, size = 20, sort?: string, order?: string) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) params.set("sort", `${sort},${order ?? "desc"}`)
    if (filters.search) params.set("search", filters.search)
    if (filters.active != null) params.set("active", String(filters.active))
    if (filters.possibleScammer) params.set("possibleScammer", "true")
    if (filters.signInMethod) params.set("signInMethod", filters.signInMethod)
    return request<Page<User>>("GET", `/users?${params}`)
  },
  update: (id: number, data: UserUpdateDto) =>
    request<User>("PUT", `/users/${id}`, data),
  updatePassword: (data: UpdatePasswordDto) =>
    request<User>("PATCH", "/users/password", data),
  delete: (id: number) =>
    request<void>("DELETE", `/users/${id}`),
  deleteMe: (data?: { password?: string }) =>
    request<void>("DELETE", "/users/me", data),
  exportMyData: async () => {
    const baseUrl = getApiBaseUrl()
    const token = localStorage.getItem("auth-token")
    const response = await fetch(`${baseUrl}/users/me/export`, {
      headers: token ? { "Authorization": token } : {},
    })
    if (!response.ok) throw new Error("Failed to export data")
    const data = await response.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "my-data.json"
    a.click()
    URL.revokeObjectURL(url)
  },
}

export const connectApi = {
  getRequest: (handle: string) =>
    request<ConnectRequestView>("GET", `/connect/requests/${encodeURIComponent(handle)}`),
  approve: (handle: string) =>
    request<ConnectApproval>("POST", `/connect/requests/${encodeURIComponent(handle)}/approve`),
  deny: (handle: string) =>
    request<ConnectDenial>("POST", `/connect/requests/${encodeURIComponent(handle)}/deny`),
}

export const connectedAppsApi = {
  list: () =>
    request<ConnectedApp[]>("GET", "/users/me/connected-apps"),
  disconnect: (clientId: string) =>
    request<void>("DELETE", `/users/me/connected-apps/${encodeURIComponent(clientId)}`),
}

// Analytics
export const analyticsApi = {
  getOverview: (days: AnalyticsRange) =>
    request<AnalyticsOverview>("GET", `/analytics/overview?days=${days}`),
  getUrlAnalytics: (id: number, days: AnalyticsRange) =>
    request<UrlAnalytics>("GET", `/analytics/urls/${id}?days=${days}`),
}

// Admin
export const adminApi = {
  getStats: () =>
    request<AdminStatsResponse>("GET", "/admin/stats"),
  getTrafficStats: (days: AnalyticsRange) =>
    request<TrafficStats>("GET", `/admin/stats/traffic?days=${days}`),
  getLinksStats: (days: AnalyticsRange) =>
    request<LinksStats>("GET", `/admin/stats/links?days=${days}`),
  getUsersStats: (days: AnalyticsRange) =>
    request<UsersStats>("GET", `/admin/stats/users?days=${days}`),
  getSafetyStats: (days: AnalyticsRange) =>
    request<SafetyStats>("GET", `/admin/stats/safety?days=${days}`),
  getSystemStats: (days: AnalyticsRange) =>
    request<SystemStats>("GET", `/admin/stats/system?days=${days}`),
  getAuditLog: (filters: AuditLogFilters = {}, page = 0, size = 50, sort = "performedAt", order = "desc") =>
    request<Page<AuditLog>>("GET", `/admin/audit-log?${listParams(page, size, sort, order, {
      action: filters.action,
      search: filters.search,
      from: filters.from,
      to: filters.to,
    })}`),
  getEmailLog: (filters: EmailLogFilters = {}, page = 0, size = 50, sort = "createdAt", order = "desc") =>
    request<Page<EmailLog>>("GET", `/admin/email-log?${listParams(page, size, sort, order, { status: filters.status, search: filters.search })}`),
  resendEmail: (id: number) =>
    request<EmailLog>("POST", `/admin/email-log/${id}/resend`),
  getLoginAttempts: (search?: string, page = 0, size = 20, sort = "attempts", order = "desc") =>
    request<Page<LoginAttempt>>("GET", `/admin/login-attempts?${listParams(page, size, sort, order, { search })}`),
  clearLoginAttempts: () =>
    request<void>("DELETE", "/admin/login-attempts"),
  getBlocklistSources: () =>
    request<BlocklistSource[]>("GET", "/admin/blocklist-sources"),
  createBlocklistSource: (input: BlocklistSourceInput) =>
    request<BlocklistSource>("POST", "/admin/blocklist-sources", input),
  updateBlocklistSource: (id: number, input: BlocklistSourceInput) =>
    request<BlocklistSource>("PUT", `/admin/blocklist-sources/${id}`, input),
  deleteBlocklistSource: (id: number) =>
    request<void>("DELETE", `/admin/blocklist-sources/${id}`),
  refreshBlocklistSource: (id: number) =>
    request<BlocklistSource>("POST", `/admin/blocklist-sources/${id}/refresh`),
  getDomainRules: (type: DomainRuleType, page = 0, size = 20, sort = "createdAt", order = "desc", search?: string) => {
    const params = new URLSearchParams()
    params.set("type", type)
    params.set("page", String(page))
    params.set("size", String(size))
    params.set("sort", `${sort},${order}`)
    if (search) params.set("search", search)
    return request<Page<DomainRule>>("GET", `/admin/domain-rules?${params}`)
  },
  createDomainRule: (input: DomainRuleInput) =>
    request<DomainRuleCreated>("POST", "/admin/domain-rules", input),
  deleteDomainRule: (id: number) =>
    request<void>("DELETE", `/admin/domain-rules/${id}`),
  previewBlockDomains: (urlIds: number[]) =>
    request<DomainBlockPreview[]>("POST", "/admin/domain-rules/bulk-preview", { urlIds }),
  blockDomains: (domains: string[], reason: string) =>
    request<DomainBulkBlockResult>("POST", "/admin/domain-rules/bulk", { domains, reason }),
  getReservedAliases: (search?: string, page = 0, size = 20, sort?: string, order = "asc") =>
    request<Page<ReservedAlias>>("GET", `/admin/reserved-aliases?${listParams(page, size, sort, order, { search })}`),
  reserveAlias: (input: ReservedAliasInput) =>
    request<ReservedAlias>("POST", "/admin/reserved-aliases", input),
  unreserveAlias: (id: number) =>
    request<void>("DELETE", `/admin/reserved-aliases/${id}`),
  getReviewQueue: ({ page = 0, size = 20, reason, olderThanDays, search, sort, order = "desc" }: ReviewQueueFilters = {}) =>
    request<Page<ReviewEntry>>("GET", `/admin/review-queue?${listParams(page, size, sort, order, { reason, olderThanDays, search })}`),
  resolveReview: (urlId: number, action: ReviewAction, domain?: string) =>
    request<void>("POST", `/admin/review-queue/${urlId}/resolve`, domain ? { action, domain } : { action }),
  resolveReviews: (urlIds: number[], action: ReviewAction) =>
    request<ReviewBulkResolveResult>("POST", "/admin/review-queue/resolve", { urlIds, action }),
  blockUser: (id: number) =>
    request<LinksAffected>("POST", `/admin/users/${id}/block`),
  unblockUser: (id: number) =>
    request<LinksAffected>("POST", `/admin/users/${id}/unblock`),
  getPossibleScammers: () =>
    request<number[]>("GET", "/admin/possible-scammers"),
  checkUrl: (url: string) =>
    request<UrlCheckResult>("POST", "/admin/url-check", { url }),
  exportUrlsCsv: async () => {
    const baseUrl = getApiBaseUrl()
    const token = localStorage.getItem("auth-token")
    const response = await fetch(`${baseUrl}/admin/urls/export`, {
      headers: token ? { "Authorization": token } : {},
    })
    if (!response.ok) throw new Error("Failed to export")
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "all-urls.csv"
    a.click()
    URL.revokeObjectURL(url)
  },
}

// Reports
export const reportApi = {
  report: (data: LinkReport) =>
    request<void>("POST", "/reports", data),
}

// Public numbers
export const publicApi = {
  getStats: () => request<PublicStatsResponse>("GET", "/public/stats"),
}

// Bio pages
export const bioApi = {
  mine: () =>
    request<BioPage>("GET", "/bio-pages/me"),
  create: (handle: string) =>
    request<BioPage>("POST", "/bio-pages/me", { handle }),
  update: (data: BioPageUpdate) =>
    request<BioPage>("PUT", "/bio-pages/me", data),
  changeHandle: (handle: string) =>
    request<BioPage>("PUT", "/bio-pages/me/handle", { handle }),
  remove: () =>
    request<void>("DELETE", "/bio-pages/me"),
  availability: (handle: string) =>
    request<BioHandleAvailability>("GET", `/bio-pages/handles/${encodeURIComponent(handle)}/availability`),
  analytics: (days: AnalyticsRange) =>
    request<BioPageAnalytics>("GET", `/analytics/bio-page?days=${days}`),
}

export const adminBioApi = {
  list: ({ search, hiddenOnly }: { search?: string; hiddenOnly?: boolean } = {}, page = 0, size = 20, sort = "createdAt", order = "desc") =>
    request<Page<AdminBioPage>>("GET", `/admin/bio-pages?${listParams(page, size, sort, order, { search, hidden: hiddenOnly || undefined })}`),
  hide: (id: number, reason: string) =>
    request<AdminBioPage>("POST", `/admin/bio-pages/${id}/hide`, { reason }),
  unhide: (id: number) =>
    request<AdminBioPage>("POST", `/admin/bio-pages/${id}/unhide`),
  changeHandle: (id: number, handle: string) =>
    request<AdminBioPage>("PUT", `/admin/bio-pages/${id}/handle`, { handle }),
  revokeHandle: (id: number, reason: string, expectedHandle?: string | null) =>
    request<AdminBioPage>("POST", `/admin/bio-pages/${id}/revoke-handle`, { reason, expectedHandle: expectedHandle ?? undefined }),
  reviews: (search?: string, page = 0, size = 20, sort = "flaggedAt", order = "desc") =>
    request<Page<BioPageReviewEntry>>("GET", `/admin/bio-page-reviews?${listParams(page, size, sort, order, { search })}`),
  resolveReview: (pageId: number, action: BioPageReviewAction, reason?: string) =>
    request<void>("POST", `/admin/bio-page-reviews/${pageId}/resolve`, reason ? { action, reason } : { action }),
}

function validationFields(body: unknown): Record<string, string> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return {}
  const fields = body as Record<string, unknown>
  if (fields.error != null || fields.message != null) return {}
  return Object.fromEntries(Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
}

export const notificationApi = {
  consents: () =>
    request<NotificationConsent[]>("GET", "/users/me/notifications"),
  setConsent: (type: EmailNotificationType, consented: boolean) =>
    request<NotificationConsent>("PUT", `/users/me/notifications/${type}`, { consented }),
  channels: () =>
    request<NotificationChannel[]>("GET", "/users/me/notification-channels"),
  createChannel: (input: NotificationChannelInput) =>
    request<NotificationChannel>("POST", "/users/me/notification-channels", input),
  updateChannel: (id: number, input: NotificationChannelInput) =>
    request<NotificationChannel>("PUT", `/users/me/notification-channels/${id}`, input),
  deleteChannel: (id: number) =>
    request<void>("DELETE", `/users/me/notification-channels/${id}`),
  testChannel: (id: number) =>
    request<ChannelTestResult>("POST", `/users/me/notification-channels/${id}/test`),
  newSigningSecret: (id: number) =>
    request<{ signingSecret: string }>("POST", `/users/me/notification-channels/${id}/signing-secret`),
  unsubscribe: (token: string) =>
    request<UnsubscribeResult>("POST", `/notifications/unsubscribe?token=${encodeURIComponent(token)}`),
}

function domainQuery(domain: string | null | undefined, separator: "?" | "&"): string {
  return domain ? `${separator}domain=${encodeURIComponent(domain)}` : ""
}

export const domainApi = {
  mine: () =>
    request<MyDomains>("GET", "/users/me/domains"),
  apply: (hostname: string, reason: string) =>
    request<CustomDomain>("POST", "/users/me/domains", { hostname, reason }),
  get: (id: number) =>
    request<CustomDomain>("GET", `/users/me/domains/${id}`),
  remove: (id: number, links: DomainLinkMode) =>
    request<DomainRemoval>("DELETE", `/users/me/domains/${id}?links=${links}`),
  retry: (id: number) =>
    request<CustomDomain>("POST", `/users/me/domains/${id}/retry`),
}

export const adminDomainApi = {
  list: ({ status, search, page, size, sort, order }: AdminDomainFilters) =>
    request<Page<AdminDomain>>("GET", `/admin/domains?${listParams(page, size, sort, order, { status, search })}`),
  summary: () =>
    request<DomainSummary>("GET", "/admin/domains/summary"),
  approve: (id: number, note?: string | null) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/approve`, { note: note || null }),
  reject: (id: number, note?: string | null) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/reject`, { note: note || null }),
  disable: (id: number, note: string) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/disable`, { note }),
  enable: (id: number) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/enable`),
  retry: (id: number) =>
    request<AdminDomain>("POST", `/admin/domains/${id}/retry`),
  remove: (id: number, links: DomainLinkMode) =>
    request<DomainRemoval>("DELETE", `/admin/domains/${id}?links=${links}`),
  checkCloudflare: () =>
    request<CloudflareCheck>("POST", "/admin/domains/cloudflare-check"),
  reconcile: () =>
    request<DomainReconcile>("POST", "/admin/domains/reconcile"),
  allowance: (userId: number) =>
    request<DomainAllowance>("GET", `/admin/domains/allowances/${userId}`),
  setAllowance: (userId: number, maxDomains: number, reason: string) =>
    request<DomainAllowance>("PUT", `/admin/domains/allowances/${userId}`, { maxDomains, reason }),
  removeAllowance: (userId: number) =>
    request<void>("DELETE", `/admin/domains/allowances/${userId}`),
}
