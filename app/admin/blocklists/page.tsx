"use client"

import { PageMeta } from "@/components/page-meta"
import { DomainRulesSection } from "@/components/admin/blocklists/domain-rules-section"
import { SourcesSection } from "@/components/admin/blocklists/sources-section"
import { UrlTester } from "@/components/admin/blocklists/url-tester"

export default function AdminBlocklistsPage() {
  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Blocklists" description="Manage blocklist sources and domain rules, and test a URL." />
      <div>
        <h1 className="font-display text-2xl">Blocklists</h1>
        <p className="mt-1 text-sm text-muted-foreground">The lists and domain rules every link is checked against</p>
      </div>
      <SourcesSection />
      <DomainRulesSection />
      <UrlTester />
    </div>
  )
}
