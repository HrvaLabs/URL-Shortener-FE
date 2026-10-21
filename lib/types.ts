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

export interface AnalyticsTopUrl {
  id: number
  shortUrl: string
  longUrl: string
  visits: number
}

export interface AnalyticsOverview {
  totalUrls: number
  activeUrls: number
  expiredUrls: number
  totalVisits: number
  topUrls: AnalyticsTopUrl[]
}

export interface DailyCount {
  date: string
  count: number
}

export interface UrlAnalytics {
  id: number
  shortUrl: string
  longUrl: string
  status: string
  visits: number
  uniqueRecentVisitors: number
  totalRecentClicks: number
  lastAccessed?: string
  createDate?: string
  dailyNewVisitors: DailyCount[]
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
}

export interface AuditLog {
  id: number
  performedBy: string
  action: string
  targetType: string
  targetIdentifier: string
  details: string
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
