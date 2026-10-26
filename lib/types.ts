export interface Authorities {
  id: number
  name: string
  active: boolean
}

export interface User {
  id: number
  name?: string
  email: string
  password?: string
  apiKeySlots: number
  authorities: Authorities[]
  createDate: string
  lastLogin: string
  active: boolean
  authProvider?: string
  possibleScammer?: boolean
}

export interface UserDto {
  id: number
  name?: string
  email: string
  apiKeySlots: number
  authorities: Authorities[]
  createDate: string
  lastLogin: string
  authProvider?: string
  twoFactorEnabled?: boolean
}

export interface Url {
  id: number
  longUrl: string
  shortUrl: string
  owner?: User
  apiKey?: ApiKey
  createDate: string
  lastAccessed?: string
  expirationDate?: string
  visits: number
  visitLimit: number
  lastSafeBrowsingCheck?: string
  platformType?: string
  threatType?: string
  active: boolean
}

/** New API response — slimmed down, no apiKey/internal fields */
export interface UrlResponse {
  id: number
  longUrl: string
  shortUrl: string
  createDate: string
  expirationDate?: string
  visits: number
  visitLimit: number
  active: boolean
  status?: string
  tags?: string[]
  passwordProtected?: boolean
  ownerEmail?: string
  suspiciousReasons?: string[]
  blockReason?: BlockReason
  reviewOpen?: boolean
  ownerPossibleScammer?: boolean
  finalUrl?: string | null
}

export interface ApiKey {
  id: number
  key: string
  owner: User
  apiCallsLimit: number
  apiCallsUsed: number
  createDate: string
  expirationDate?: string
  active: boolean
}

/** New API response — no urls field */
export interface ApiKeyResponse {
  id: number
  key: string
  apiCallsLimit: number
  apiCallsUsed: number
  createDate: string
  expirationDate?: string
  active: boolean
  status?: string
  ownerEmail?: string
}

export type AnalyticsRange = 7 | 30 | 90 | 365

export interface AnalyticsTotals {
  clicks: number
  uniqueVisitors: number
  botClicks: number
}

export interface AnalyticsDay {
  date: string
  clicks: number
  uniqueVisitors: number
  botClicks: number
}

export interface BreakdownEntry {
  value: string
  clicks: number
}

export interface AnalyticsBreakdowns {
  referrers: BreakdownEntry[]
  countries: BreakdownEntry[]
  devices: BreakdownEntry[]
  browsers: BreakdownEntry[]
  operatingSystems: BreakdownEntry[]
}

export type BreakdownDimension = keyof AnalyticsBreakdowns

export interface AnalyticsLinkSummary {
  id: number
  shortUrl: string
  destinationHost: string
  status: string
  passwordProtected: boolean
  createDate?: string | null
  lastAccessed?: string | null
  visits: number
}

export interface UrlAnalytics {
  link: AnalyticsLinkSummary
  days: AnalyticsRange
  from: string
  to: string
  totals: AnalyticsTotals
  daily: AnalyticsDay[]
  breakdowns: AnalyticsBreakdowns
}

export interface AnalyticsTopLink {
  id: number
  shortUrl: string
  destinationHost: string
  clicks: number
  uniqueVisitors: number
}

export interface AnalyticsOverview {
  days: AnalyticsRange
  from: string
  to: string
  totals: AnalyticsTotals
  daily: AnalyticsDay[]
  topLinks: AnalyticsTopLink[]
  totalUrls: number
  activeUrls: number
  expiredUrls: number
  totalVisits: number
}

export interface CountEntry {
  value: string
  count: number
}

export interface DailyCounts {
  date: string
  counts: Record<string, number>
}

export interface StackedSeries {
  keys: string[]
  daily: DailyCounts[]
}

export interface TrafficTopLink {
  id: number
  shortUrl: string
  destinationHost: string
  ownerEmail: string | null
  clicks: number
  uniqueVisitors: number
}

export interface TrafficStats {
  days: AnalyticsRange
  from: string
  to: string
  totals: AnalyticsTotals
  daily: AnalyticsDay[]
  anonymousClicks: number
  accountClicks: number
  topLinks: TrafficTopLink[]
  breakdowns: AnalyticsBreakdowns
  allTimeVisits: number
}

export type CreatedVia = "WEB" | "API_KEY" | "BULK" | "MCP" | "ANONYMOUS_WEB" | "ANONYMOUS_MCP"

export interface NewestLink {
  id: number
  shortUrl: string
  destinationHost: string
  ownerEmail: string | null
  createdVia: CreatedVia | "unknown"
  createDate: string
  status: string
}

export interface LinksStats {
  days: AnalyticsRange
  from: string
  to: string
  created: StackedSeries
  createdInRange: {
    total: number
    account: number
    anonymous: number
    aiTagged: number
  }
  now: {
    total: number
    active: number
    inactive: number
    expired: number
    passwordProtected: number
    withVisitLimit: number
    withExpiry: number
    blockedByReason: CountEntry[]
  }
  topTags: CountEntry[]
  topDomains: CountEntry[]
  newest: NewestLink[]
}

export interface UsersStats {
  days: AnalyticsRange
  from: string
  to: string
  signups: StackedSeries
  now: {
    total: number
    active: number
    deactivated: number
    admins: number
    emailVerified: number
    twoFactorEnabled: number
    byProvider: CountEntry[]
  }
  activeLast7Days: number
  activeLast30Days: number
  apiKeys: {
    active: number
    expired: number
    revoked: number
    callsUsed: number
  }
  mcp: {
    connectedUsers: number
    registeredClients: number
  }
}

export type ReviewSource = "SYSTEM" | "VISITOR"

export type ReviewResolution = "OK" | "DOMAIN_TRUSTED" | "LINK_BLOCKED" | "DOMAIN_BLOCKED" | "USER_BLOCKED" | "DESTINATION_CHANGED"

export interface SourceHealth {
  id: number
  name: string
  action: SourceAction
  enabled: boolean
  domainCount: number | null
  memoryBytes: number | null
  lastSuccessAt: string | null
  lastError: string | null
}

export interface SafetyStats {
  days: AnalyticsRange
  from: string
  to: string
  reviewsOpened: StackedSeries
  openReviews: number
  openVisitorReports: number
  resolved: CountEntry[]
  resolveTimes: {
    count: number
    medianMinutes: number | null
    p90Minutes: number | null
  }
  blocked: StackedSeries
  domainRules: {
    block: number
    allow: number
  }
  possibleScammers: number
  sources: SourceHealth[]
}

export interface RedirectTiming {
  source: "cache" | "db"
  count: number
  meanMs: number | null
  maxMs: number | null
}

export interface RedisKeyCounts {
  counts: Record<string, number>
  other: number
  scanned: number
  capped: boolean
}

export type EmailStatus = "SENT" | "FAILED" | "SENDING" | "RESENT"

export interface SystemStats {
  days: AnalyticsRange
  from: string
  to: string
  appVersion: string
  startedAt: string
  uptime: string
  javaVersion: string
  activeProfiles: string[]
  jvmHeapUsedBytes: number
  jvmHeapMaxBytes: number
  redirects: RedirectTiming[]
  requests: {
    total: number
    serverErrors: number
  }
  cache: {
    hits: number
    misses: number
    hitRatio: number | null
  }
  health: {
    database: string
    redis: string
  }
  redis: {
    usedMemoryBytes: number | null
    maxMemoryBytes: number | null
    keys: RedisKeyCounts | null
  }
  database: {
    product: string
    version: string
    sizeBytes: number | null
    shortUrlUnique: boolean
  }
  emails: StackedSeries
}

export interface PeekUrl {
  longUrl: string | null
  shortUrl: string
  createDate: string
  passwordProtected?: boolean
}

export interface JWTTokenDto {
  token: string
  user: UserDto
}

export interface LoginDto {
  email: string
  password: string
  rememberMe?: boolean
}

/** New API — name field removed */
export interface UserRegisterDto {
  email: string
  password: string
}

export interface CreateUrlDto {
  longUrl: string
  shortUrl?: string
  visitLimit?: number
  expirationDate?: string
  tags?: string[]
  password?: string
}

export interface UrlUpdateDto {
  id: number
  longUrl?: string
  visitLimit?: number
  expirationDate?: string
  tags?: string[]
  password?: string
}

export interface ApiKeyUpdateDto {
  id: number
  apiCallsLimit?: number
  apiCallsUsed?: number
  expirationDate?: string
  active?: boolean
}

/** New API — name field removed */
export interface UserUpdateDto {
  id: number
  email?: string
  apiKeySlots?: number
  active?: boolean
}

export interface UpdatePasswordDto {
  oldPassword: string
  newPassword: string
}

export interface RequestPasswordResetDto {
  email: string
}

export interface PasswordResetDto {
  token: string
  email: string
  password: string
}

/** Link preview from OG/Twitter meta tags */
export interface LinkPreviewResponse {
  url: string
  title?: string
  description?: string
  imageUrl?: string
}

/** Generic paginated response (Spring Page<T>) */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface AdminStatsResponse {
  totalUsers: number
  newUsers7d: number
  newUsers30d: number
  totalUrls: number
  activeUrls: number
  totalApiKeys: number
  appVersion: string
  uptime: string
  cacheActive: boolean
  databaseActive: boolean
  javaVersion: string
  serverTime: string
  recentUrls: RecentUrlItem[]
  cacheHitRatio: string
  activeProfiles: string[]
  jvmMemoryUsed: string
  jvmMemoryMax: string
  requestsCount: number
  redirectAvgMs?: string
  redirectMaxMs?: string
  redirectCount?: number
}

export interface RecentUrlItem {
  id: number
  shortUrl: string
  longUrl: string
  createDate: string
  visits: number
  ownerEmail?: string
}

export interface UrlFilters {
  search?: string
  active?: boolean
  expired?: boolean
  anonymous?: boolean
  dateFrom?: string
  dateTo?: string
  tag?: string
}

export interface UserFilters {
  search?: string
  active?: boolean
  possibleScammer?: boolean
}

export type AuditAction =
  | "CLEAR_LOGIN_ATTEMPTS"
  | "RESEND_EMAIL"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "UPDATE_URL"
  | "REVOKE_URL"
  | "ACTIVATE_URL"
  | "DELETE_URL"
  | "CREATE_SOURCE"
  | "UPDATE_SOURCE"
  | "DELETE_SOURCE"
  | "REFRESH_SOURCE"
  | "RESOLVE_REVIEW"
  | "BLOCK_LINK"
  | "BLOCK_DOMAIN"
  | "ALLOW_DOMAIN"
  | "REMOVE_DOMAIN_RULE"
  | "BLOCK_USER"
  | "REACTIVATE_USER"
  | "DELETE_LINK"
  | "RESERVE_ALIAS"
  | "UNRESERVE_ALIAS"
  | "UNKNOWN"

export interface AuditLog {
  id: number
  performedBy: string
  action: AuditAction
  failed: boolean
  targetType: string
  targetIdentifier: string | null
  details: string | null
  performedAt: string
}

export interface EmailLog {
  id: number
  sender?: string | null
  recipient: string
  subject: string
  status: string
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
  resendable?: boolean
}

export interface ConnectRequestView {
  clientName: string
}

export interface ConnectApproval {
  continueUrl: string
}

export interface ConnectDenial {
  redirectTo: string
}

export interface ConnectedApp {
  clientId: string
  clientName: string
  firstConnected: string
  lastUsed: string | null
}

export type BlockReason = "SAFE_BROWSING" | "BLOCKLIST" | "DOMAIN_RULE" | "ADMIN" | "USER_BLOCKED" | "SCAM_SIGNALS"

export type SourceKind = "DOMAINS" | "LINKS"

export type SourceAction = "BLOCK" | "FLAG"

export interface BlocklistSource {
  id: number
  name: string
  url: string
  fallbackUrls: string[]
  kind: SourceKind
  action: SourceAction
  enabled: boolean
  refreshIntervalHours: number
  lastFetchedAt: string | null
  lastSuccessAt: string | null
  lastSuccessUrl: string | null
  domainCount: number | null
  listVersion: string | null
  lastError: string | null
  memoryBytes: number | null
}

export interface BlocklistSourceInput {
  name: string
  url: string
  kind: SourceKind
  action: SourceAction
  enabled: boolean
  refreshIntervalHours: number
  fallbackUrls: string[]
}

export type DomainRuleType = "BLOCK" | "ALLOW"

export interface ReservedAliasLink {
  id: number
  shortUrl: string
  ownerEmail: string | null
  active: boolean
}

export interface ReservedAlias {
  id: number | null
  alias: string
  reason: string
  builtIn: boolean
  createdAt: string | null
  createdBy: string | null
  inUse: ReservedAliasLink[]
}

export interface ReservedAliasInput {
  alias: string
  reason: string
}

export interface DomainRule {
  id: number
  domain: string
  type: DomainRuleType
  reason: string | null
  createdBy: string | null
  createdAt: string
}

export interface DomainRuleInput {
  domain: string
  type: DomainRuleType
  reason?: string
}

export interface DomainRuleCreated {
  rule: DomainRule
  linksAffected: number
}

export interface LinksAffected {
  linksAffected: number
}

export interface ReviewEntry {
  urlId: number
  shortUrl: string
  longUrl: string
  host: string | null
  registrableDomain: string | null
  ownerId: number | null
  ownerEmail: string | null
  ownerCreatedAt: string | null
  possibleScammer: boolean
  createDate: string
  reasons: string[]
  flaggedAt: string
}

export interface ReviewQueueFilters {
  page?: number
  size?: number
  reason?: string
  olderThanDays?: number
}

export type ReviewAction = "OK" | "TRUST_DOMAIN" | "BLOCK_LINK" | "BLOCK_DOMAIN" | "BLOCK_USER"

export interface ReviewResolveFailure {
  urlId: number
  error: string
}

export interface ReviewBulkResolveResult {
  resolved: number[]
  failed: ReviewResolveFailure[]
}

export type UrlCheckOutcome = "ALLOWED" | "BLOCK" | "FLAG" | "CLEAN"

export interface UrlCheckResult {
  outcome: UrlCheckOutcome
  reasons: string[]
  blockReason: BlockReason | null
  blockDetail: string | null
  host: string | null
  registrableDomain: string | null
}

export type ReportCategory = "PHISHING" | "MALWARE" | "SPAM" | "OTHER"

export interface LinkReport {
  shortUrl: string
  category: ReportCategory
  details?: string
}
