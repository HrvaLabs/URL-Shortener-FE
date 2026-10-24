import { getApiBaseUrl } from "./utils"
import type { UrlResponse, ApiKeyResponse, UserDto, User, PeekUrl, CreateUrlDto, UrlUpdateDto, ApiKeyUpdateDto, UserUpdateDto, UpdatePasswordDto, LinkPreviewResponse, Page, AdminStatsResponse, UrlFilters, UserFilters, AuditLog, EmailLog, AnalyticsOverview, AnalyticsRange, UrlAnalytics, ConnectRequestView, ConnectApproval, ConnectDenial, ConnectedApp, BlocklistSource, BlocklistSourceInput, DomainRule, DomainRuleType, DomainRuleInput, DomainRuleCreated, LinksAffected, ReviewEntry, ReviewQueueFilters, ReviewAction, ReviewBulkResolveResult, AuditAction, UrlCheckResult, LinkReport } from "./types"

export const REQUEST_FAILED = "Request failed"

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
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

function errorMessage(body: unknown): string {
  if (typeof body !== "object" || body === null) return REQUEST_FAILED
  const fields = body as Record<string, unknown>
  // New API: { "error": "message" }, old API: { "message": "..." }, validation: { "field": "message" }
  const message = fields.error ?? fields.message ?? Object.values(fields).filter((value) => typeof value === "string").join(". ")
  return typeof message === "string" && message ? message : REQUEST_FAILED
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

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorBody = await readBody(response).catch(() => undefined)
    throw new ApiError(errorMessage(errorBody), response.status)
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
  login: (data: { email: string; password: string; rememberMe?: boolean; code?: string }) =>
    request<{ token?: string; user?: UserDto; twoFactorRequired?: boolean }>("POST", "/auth/login", data),
  setupTwoFactor: () =>
    request<{ secret: string; otpauthUri: string }>("POST", "/auth/2fa/setup"),
  enableTwoFactor: (code: string) =>
    request<{ recoveryCodes: string[] }>("POST", "/auth/2fa/enable", { code }),
  disableTwoFactor: (code: string) =>
    request<void>("POST", "/auth/2fa/disable", { code }),
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
    return request<Page<UrlResponse>>("GET", `/urls/all?${params}`)
  },
  getByShort: (short: string) =>
    request<UrlResponse>("GET", `/urls/${short}`),
  unlock: (short: string, password: string) =>
    request<{ longUrl: string }>("POST", `/urls/${short}/unlock`, { password }),
  peek: (short: string) =>
    request<PeekUrl>("GET", `/urls/${short}/peek`),
  preview: (short: string) =>
    request<LinkPreviewResponse>("GET", `/urls/${short}/preview`),
  getQrCodeUrl: (short: string, size = 300) =>
    `${getApiBaseUrl()}/urls/${short}/qr?size=${size}`,
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
  getMyKeys: () =>
    request<ApiKeyResponse[]>("GET", "/api-keys"),
  getAllKeys: (page = 0, size = 20) =>
    request<Page<ApiKeyResponse>>("GET", `/api-keys/all?page=${page}&size=${size}`),
  update: (id: number, data: ApiKeyUpdateDto) =>
    request<ApiKeyResponse>("PUT", `/api-keys/${id}`, data),
  revoke: (id: number) =>
    request<ApiKeyResponse>("PATCH", `/api-keys/${id}/revoke`),
  activate: (id: number) =>
    request<ApiKeyResponse>("PATCH", `/api-keys/${id}/activate`),
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
  getOverview: () =>
    request<AnalyticsOverview>("GET", "/analytics/overview"),
  getUrlAnalytics: (id: number, days: AnalyticsRange) =>
    request<UrlAnalytics>("GET", `/analytics/urls/${id}?days=${days}`),
}

// Admin
export const adminApi = {
  getStats: () =>
    request<AdminStatsResponse>("GET", "/admin/stats"),
  getAuditLog: (page = 0, size = 50, action?: AuditAction) =>
    request<Page<AuditLog>>("GET", `/admin/audit-log?page=${page}&size=${size}${action ? `&action=${action}` : ""}`),
  getEmailLog: (page = 0, size = 50) =>
    request<Page<EmailLog>>("GET", `/admin/email-log?page=${page}&size=${size}`),
  resendEmail: (id: number) =>
    request<EmailLog>("POST", `/admin/email-log/${id}/resend`),
  getLoginAttempts: () =>
    request<Record<string, number>>("GET", "/admin/login-attempts"),
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
  getDomainRules: (type: DomainRuleType) =>
    request<DomainRule[]>("GET", `/admin/domain-rules?type=${type}`),
  createDomainRule: (input: DomainRuleInput) =>
    request<DomainRuleCreated>("POST", "/admin/domain-rules", input),
  deleteDomainRule: (id: number) =>
    request<void>("DELETE", `/admin/domain-rules/${id}`),
  getReviewQueue: ({ page = 0, size = 20, reason, olderThanDays }: ReviewQueueFilters = {}) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (reason) params.set("reason", reason)
    if (olderThanDays != null) params.set("olderThanDays", String(olderThanDays))
    return request<Page<ReviewEntry>>("GET", `/admin/review-queue?${params}`)
  },
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
