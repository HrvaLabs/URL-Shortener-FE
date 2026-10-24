export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  author: string
  tags: string[]
  content: string
}

export const authorUrls: Record<string, string> = {
  "Karlo Hrvačić": "https://karlo.cc",
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-hrva-cc-stops-phishing-links",
    title: "How hrva.cc stops phishing links",
    date: "2026-10-22",
    excerpt:
      "In September, scam links imitating Njuškalo and Jófogás got past Google Safe Browsing and every other check we tried. Here's what hrva.cc checks now, what it still can't catch, and how you can help.",
    author: "Karlo Hrvačić",
    tags: ["security", "phishing", "blocklists", "safe browsing"],
    content: `
      <p class="lead">
        In September 2026, a new account used hrva.cc to share links to fake Njuškalo and Jófogás pages.
        Google Safe Browsing didn't catch them, and neither did anything else we checked them against later.
        This post explains why, and the layers hrva.cc now uses to stop links like these.
      </p>

      <h2>What happened</h2>
      <p>
        Njuškalo and Jófogás are popular classifieds sites in Croatia and Hungary. In mid-September, one new
        account created a batch of hrva.cc links to pages that copied them, on domains such as
        <code>njuskaio[.]cam</code> and <code>jofogas[.]cards</code>. The domains had been registered the same
        day the links appeared. The links stayed up for weeks before we found them.
      </p>
      <p>
        When we checked those domains in October, none of the outside services had flagged them. Google Safe
        Browsing let them through. So did HaGeZi's threat lists, which hold more than two million known bad domains,
        and the malware-blocking DNS from Quad9 and Cloudflare.
      </p>
      <p>
        That isn't a failure of those services. A list can only block a site after someone has spotted it,
        and a domain registered that same day has no history yet. The lesson for us was that lists alone are too
        slow for scams on fresh domains. So hrva.cc now also looks at how old a domain is, and at whether its
        name imitates a well-known brand.
      </p>

      <h2>Checks when a link is created</h2>
      <p>
        No single check catches everything, so hrva.cc runs several. Each one covers gaps in the others.
      </p>
      <ul>
        <li>
          <strong>Google Safe Browsing.</strong> Every destination is checked against Google's database of
          phishing and malware sites when the link is created, and again every night. We wrote about this in
          <a href="/blog/safe-browsing-link-sharing">Why Safe Browsing matters for link sharing</a> and
          <a href="/blog/safe-browsing-at-scale">Safe Browsing at scale</a>.
        </li>
        <li>
          <strong>Local blocklists.</strong> hrva.cc downloads public blocklists to its own server and
          refreshes them several times a day. Some list harmful domains. Others list exact links, which lets
          us catch one bad page on a trusted host without blocking the whole host. Because the lists live on
          our server, checking a link against them sends it nowhere.
        </li>
        <li>
          <strong>Domain age.</strong> hrva.cc asks the domain's registry when the domain was registered. A
          brand-new domain gets a closer look.
        </li>
        <li>
          <strong>Lookalike and lure signals.</strong> A name that imitates a well-known brand, or an address
          dressed up as a login or verification page, is a warning sign. Signals like these add up. A single
          weak one never blocks a link on its own; it sends the link to a person instead.
        </li>
        <li>
          <strong>Spamhaus.</strong> Destination domains are also checked against the Spamhaus domain
          blocklist, which tracks domains used for phishing, malware and spam.
        </li>
        <li>
          <strong>Redirect checks.</strong> A link can point to a harmless-looking address that then
          redirects to a scam. After a link is created, hrva.cc follows its redirects in the background and
          checks every address along the way.
        </li>
      </ul>

      <h2>Checks after a link is live</h2>
      <ul>
        <li>
          <strong>Every night.</strong> All active links are checked again against Safe Browsing and the
          latest lists, so a site that turns bad later still gets caught.
        </li>
        <li>
          <strong>Every click.</strong> Before a visitor is sent anywhere, the destination is checked against
          the blocklists that block outright. If it has been listed since the last check, the link stops working on that click,
          and the visitor sees a page saying the link isn't available.
        </li>
        <li>
          <strong>Domain rules.</strong> When a domain is clearly bad, we can block it, and every link to it
          stops working at once. We can also mark a domain as trusted, to undo a false alarm.
        </li>
      </ul>

      <h2>A person makes the hard calls</h2>
      <p>
        Some links look doubtful but are fine. A small business on a new domain, or a real login page, can
        trip the same signals as a scam. Blocking those automatically would hurt real people, so doubtful
        links aren't blocked. They go to a review queue, and a person decides: the link is fine, the domain
        is trusted, or the link, the domain or the account gets blocked.
      </p>
      <p>
        Accounts that act like typical scam accounts are marked as possible scammers in that queue, so
        they're easy to spot. The marker never blocks anything by itself. Blocking an account is never
        automatic. A daily email lists the decisions waiting, so nothing sits in the
        queue unseen.
      </p>

      <h2>Limits and reports</h2>
      <ul>
        <li>
          <strong>Rate limits.</strong> Visitors and accounts can only create so many links in a short time,
          so one account can't flood hrva.cc with scam links.
        </li>
        <li>
          <strong>Reports from visitors.</strong> Anyone can report a link on the
          <a href="/report">report page</a>. Reports go to the review queue. They never block a link on their
          own, so nobody can take down someone else's link just by reporting it.
        </li>
      </ul>

      <h2>What it can't catch</h2>
      <p>
        These checks make hrva.cc much harder to abuse, but they aren't perfect. They can miss:
      </p>
      <ul>
        <li>
          <strong>Bad files on trusted hosts.</strong> A harmful file on a big file-sharing or cloud service
          is only caught once it's on a list of exact links. We won't block a whole trusted host for one bad
          file.
        </li>
        <li>
          <strong>Scams on old or hacked domains.</strong> A domain with a long, clean history looks normal
          until a list picks it up.
        </li>
        <li>
          <strong>Pages that change by visitor.</strong> Some scam pages show a harmless page to checkers and
          the scam to real visitors.
        </li>
        <li>
          <strong>JavaScript redirects.</strong> hrva.cc follows normal web redirects, but not ones a script
          inside the page performs.
        </li>
      </ul>

      <h2>What you can do</h2>
      <ul>
        <li>
          <strong>Be wary of short links in messages.</strong> Scam links often arrive in chats, texts and
          emails. If a message pushes you to log in, pay or confirm your details through a link, don't. Open
          the site yourself by typing its address.
        </li>
        <li>
          <strong>Check before you click.</strong> <a href="/validate">Check a link</a> shows where a hrva.cc
          link goes without opening it.
        </li>
        <li>
          <strong>Report it.</strong> If a hrva.cc link leads somewhere harmful, report it at
          <a href="/report">/report</a> or email <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a> with the
          short link.
        </li>
      </ul>

      <h2>Thanks</h2>
      <p>
        This protection stands on the work of people who track threats and share what they find:
        <a href="https://github.com/hagezi/dns-blocklists" target="_blank" rel="noopener noreferrer">HaGeZi</a>,
        <a href="https://urlhaus.abuse.ch/" target="_blank" rel="noopener noreferrer">URLhaus</a> by abuse.ch,
        <a href="https://openphish.com/" target="_blank" rel="noopener noreferrer">OpenPhish</a>,
        <a href="https://phishtank.org/" target="_blank" rel="noopener noreferrer">PhishTank</a>, the
        <a href="https://github.com/Phishing-Database/Phishing.Database" target="_blank" rel="noopener noreferrer">Phishing.Database</a>
        project and
        <a href="https://www.spamhaus.org/" target="_blank" rel="noopener noreferrer">Spamhaus</a>. Thank you.
      </p>
    `,
  },
  {
    slug: "why-use-a-url-shortener",
    title: "Why You Should Use a URL Shortener in 2026",
    date: "2026-05-15",
    excerpt:
      "Long URLs are ugly, hard to share, and easy to mistype. A URL shortener solves these problems — but modern tools go far beyond just shrinking links.",
    author: "Karlo Hrvačić",
    tags: ["URL shortener", "link management", "productivity"],
    content: `
      <p class="lead">
        Every day, millions of long, unreadable URLs are shared across email, social media, messaging apps, and printed materials. 
        A URL shortener makes them manageable — but the best ones do much more than shrink a link.
      </p>

      <h2>Beyond the Short Link</h2>
      <p>
        A good URL shortener like <a href="/">hrva.cc</a> doesn't just turn a 500-character URL into a 20-character one. 
        It gives you control over every link you share. You can set visit limits, expiration dates, and track how many 
        times each link was clicked — all without needing a separate analytics tool.
      </p>

      <h2>Why Length Matters</h2>
      <p>
        Long URLs break in messages, wrap awkwardly in emails, and look suspicious on social media. 
        A short, clean link like <code>hrva.cc/abc123</code> is immediately more trustworthy — and it fits 
        anywhere. Twitter's character limit, SMS messages, and even printed QR codes all benefit from shorter links.
      </p>

      <h2>Control Every Link You Share</h2>
      <p>
        Once you shorten a URL, it's out there. But what if you need to change the destination? Or what if you 
        only want it to work for a limited time? Modern URL shorteners let you:
      </p>
      <ul>
        <li><strong>Set expiration dates</strong> — links automatically stop working after a specific date</li>
        <li><strong>Limit visits</strong> — perfect for time-sensitive campaigns or shared documents</li>
        <li><strong>Track clicks</strong> — see exactly how many people visited each link</li>
        <li><strong>Create custom aliases</strong> — make your short links brand-readable</li>
      </ul>

      <h2>Security First</h2>
      <p>
        One feature that sets hrva.cc apart is Google Safe Browsing integration. Every long URL is checked against 
        Google's threat database before it's shortened. If the destination is flagged as malware or phishing, 
        the link is blocked — protecting everyone who clicks your short links.
      </p>

      <h2>Getting Started</h2>
      <p>
        Shortening a URL takes seconds. Paste your long URL, optionally set an alias or expiration, and you're done. 
        No account required for basic use — and creating a free account unlocks analytics, custom aliases, and more.
      </p>
    `,
  },
  {
    slug: "link-analytics-guide",
    title: "The Complete Guide to Link Analytics",
    date: "2026-05-12",
    excerpt:
      "Knowing how many people clicked your link is just the beginning. Here's what link analytics can tell you — and why it matters for your marketing.",
    author: "Karlo Hrvačić",
    tags: ["analytics", "marketing", "link tracking"],
    content: `
      <p class="lead">
        You've shared a link. Now what? Did anyone click it? How many times? Link analytics give you answers — 
        and the data can shape your entire marketing strategy.
      </p>

      <h2>What Link Analytics Tell You</h2>
      <p>
        At its simplest, link analytics tells you how many times a short URL was visited. But modern tools go deeper. 
        With hrva.cc, you can see:
      </p>
      <ul>
        <li><strong>Total visits</strong> — the raw number of clicks on each link</li>
        <li><strong>Visit limits</strong> — set a maximum number of clicks before the link deactivates</li>
        <li><strong>Real-time tracking</strong> — see visits as they happen</li>
      </ul>

      <h2>Why Analytics Matter</h2>
      <p>
        If you're sharing links for business — whether in email campaigns, social media posts, or documentation — 
        knowing your click-through rates tells you what's working. A link that gets 100 clicks is performing 
        differently than one that gets 3. Without analytics, you're guessing.
      </p>

      <h2>Visit Limits: Control Your Links</h2>
      <p>
        One unique feature of hrva.cc is the ability to set a hard limit on how many times a link can be clicked. 
        This is incredibly useful for:
      </p>
      <ul>
        <li>Limited-time offers or coupons</li>
        <li>Event registrations with capped attendance</li>
        <li>Document sharing with controlled distribution</li>
        <li>APIs where you want to meter access</li>
      </ul>
      <p>
        Once the limit is reached, the link automatically deactivates. No more broken promises — just precise control.
      </p>

      <h2>Analytics for Teams</h2>
      <p>
        With an hrva.cc account, all your links are tracked in one dashboard. You can see which links perform best, 
        sort by visit count, and manage them all from a single place. The dashboard even shows you a progress bar 
        for links with visit limits, so you always know how close a link is to its cap.
      </p>

      <h2>Privacy and Analytics</h2>
      <p>
        Link analytics doesn't have to mean invading privacy. hrva.cc tracks visit counts without collecting personal data. 
        You know how many people visited, not who they are — giving you useful data while respecting your audience's privacy.
      </p>
    `,
  },
  {
    slug: "expiration-dates-visit-limits",
    title: "How Expiration Dates and Visit Limits Work",
    date: "2026-05-10",
    excerpt:
      "Set it and forget it — expiration dates and visit limits give you full control over your links, even after you've shared them.",
    author: "Karlo Hrvačić",
    tags: ["features", "expiration", "control"],
    content: `
      <p class="lead">
        Once you share a link, you lose control — unless you use a URL shortener with expiration dates and visit limits. 
        Here's how they work and why you'd use each one.
      </p>

      <h2>Expiration Dates</h2>
      <p>
        An expiration date tells a short URL to stop working at a specific time. When someone visits an expired link, 
        they won't be redirected — the link simply doesn't work anymore. This is perfect for:
      </p>
      <ul>
        <li><strong>Time-sensitive promotions</strong> — "Sale ends Friday" links that auto-disable</li>
        <li><strong>Event links</strong> — conference registrations, webinar access links</li>
        <li><strong>Shared documents</strong> — contracts or proposals with a viewing window</li>
        <li><strong>Temporary access</strong> — any link that should self-destruct after a date</li>
      </ul>

      <h2>Visit Limits</h2>
      <p>
        A visit limit sets a maximum number of clicks. Once that number is reached, the link deactivates. 
        This is different from an expiration date — a link with a visit limit of 100 could last a day or a year, 
        depending on how popular it is.
      </p>
      <p>
        Visit limits are great for:
      </p>
      <ul>
        <li>Exclusive content that should only be accessed a fixed number of times</li>
        <li>Exhaustive A/B testing where you need exactly N visits per variant</li>
        <li>API rate limiting where a key should only make a set number of calls</li>
      </ul>

      <h2>Combined: Maximum Control</h2>
      <p>
        You can set both an expiration date and a visit limit on the same link. The link deactivates as soon as 
        <em>either</em> condition is met — whichever comes first. This gives you the ultimate control: "This link 
        works at most 500 times, and never after December 31st."
      </p>

      <h2>How hrva.cc Handles Expired Links</h2>
      <p>
        Expired and deactivated links are checked every minute by our background scheduler. The moment a link 
        passes its expiration date or hits its visit limit, it's automatically deactivated. The system also 
        sends you an email notification if you have expiring links coming up in the next 24 hours — so you 
        can extend them before they die.
      </p>
    `,
  },
  {
    slug: "url-shortening-best-practices-2026",
    title: "URL Shortening Best Practices for 2026",
    date: "2026-05-08",
    excerpt:
      "URL shorteners are everywhere — but not all short links are created equal. Follow these best practices to keep your links trustworthy, trackable, and effective.",
    author: "Karlo Hrvačić",
    tags: ["best practices", "tips", "SEO"],
    content: `
      <p class="lead">
        A short link is more than a convenience — it's a trust signal. Follow these best practices to make your 
        short URLs work harder for you.
      </p>

      <h2>1. Use Custom Aliases When It Matters</h2>
      <p>
        Auto-generated short codes are fine for internal use, but for public-facing links — social media, 
        marketing campaigns, print materials — use a custom alias. A link like <code>hrva.cc/summer-sale</code> 
        is more memorable and trustworthy than <code>hrva.cc/x7K9m</code>.
      </p>
      <p>
        Custom aliases also give your audience a hint about where the link leads before they click. This 
        transparency builds trust and improves click-through rates.
      </p>

      <h2>2. Always Set Expiration for Time-Sensitive Content</h2>
      <p>
        If your link is tied to an event, promotion, or deadline, set an expiration date. This prevents 
        stale links from circulating after they're no longer relevant. A link to last year's conference 
        that still redirects is a bad experience for everyone.
      </p>

      <h2>3. Monitor Your Link Analytics</h2>
      <p>
        Don't share and forget. Check your analytics dashboard to see which links are performing and which aren't. 
        If a link has zero visits after a week, maybe it's not reaching the right audience. If another link 
        has thousands of visits and is close to its limit, you might want to create a replacement.
      </p>

      <h2>4. Choose a Safe Shortener</h2>
      <p>
        Not all URL shorteners check destination URLs for malware. Using a shortener without Safe Browsing 
        protection can expose your audience to phishing or malware sites. hrva.cc checks every URL against 
        Google Safe Browsing before shortening — and rechecks active links daily.
      </p>

      <h2>5. Keep Your Dashboard Organized</h2>
      <p>
        With dozens or hundreds of short links, organization matters. Use the search and filter features to 
        find links by keyword, status, or date range. The hrva.cc dashboard supports all of these — no more 
        scrolling through endless rows to find the link you need.
      </p>

      <h2>6. Plan for Link Rot</h2>
      <p>
        Links die. Services shut down, pages move, domains expire. Use a URL shortener that lets you update 
        the destination of an existing short link. hrva.cc supports this — so if your long URL changes, 
        your short link still works.
      </p>
    `,
  },
  {
    slug: "safe-browsing-link-sharing",
    title: "Why Safe Browsing Matters for Link Sharing",
    date: "2026-05-05",
    excerpt:
      "How Google Safe Browsing keeps your short links safe — and why every URL shortener should check destinations before sharing them.",
    author: "Karlo Hrvačić",
    tags: ["security", "safe browsing", "privacy"],
    content: `
      <p class="lead">
        When you share a short link, you're vouching for the destination. But what if that destination has been 
        compromised since you last visited? Safe Browsing integration catches threats before your audience does.
      </p>

      <h2>What Is Google Safe Browsing?</h2>
      <p>
        Google Safe Browsing is a database of known malicious websites — phishing pages, malware hosts, 
        unwanted software, and social engineering sites. Every day, Google discovers thousands of new threats 
        and adds them to the list. Services like Chrome, Firefox, and Safari use Safe Browsing to warn users 
        before they visit dangerous sites.
      </p>

      <h2>How hrva.cc Uses Safe Browsing</h2>
      <p>
        Every URL submitted to hrva.cc is checked against Google Safe Browsing before it's shortened. If the 
        URL is flagged, the short link is blocked immediately — giving you protection at the moment of creation.
      </p>
      <p>
        But threats evolve. A URL that was safe yesterday could be compromised today. That's why hrva.cc 
        <strong>rechecks all active URLs daily</strong> through an automated background job. If a previously 
        safe URL is later flagged, the short link is automatically deactivated and the owner is notified 
        by email.
      </p>

      <h2>What Happens When a Threat Is Detected</h2>
      <p>
        If a URL is flagged by Safe Browsing, hrva.cc:
      </p>
      <ul>
        <li>Blocks the short link from being created (at creation time)</li>
        <li>Deactivates the link automatically (during daily recheck)</li>
        <li>Notifies the link owner by email with the threat type detected</li>
        <li>Evicts the link from the cache so no one gets redirected to a dangerous page</li>
      </ul>

      <h2>Why This Matters for Your Audience</h2>
      <p>
        Every short link you share is a reflection of your judgment. If someone clicks a link you shared and 
        lands on a malware page, they won't blame the shortener — they'll blame you. Safe Browsing protection 
        is your safety net, catching threats before they reach your audience.
      </p>

      <h2>The Bottom Line</h2>
      <p>
        Not all URL shorteners check destination URLs. Many are simply pass-through services that redirect 
        without looking. By choosing a shortener with automatic threat scanning and proactive rechecking, 
        you're protecting both yourself and everyone who clicks your links.
      </p>
    `,
  },
  {
    slug: "how-we-built-it",
    title: "How hrva.cc Handles Security, Speed, Reliability, and Migration",
    date: "2026-05-18",
    excerpt:
      "A deep dive into the architecture behind hrva.cc — how we keep links fast, safe, and always available through Redis caching, JWT auth, Safe Browsing, and zero-downtime migrations.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "architecture", "infrastructure", "security"],
    content: `
      <p class="lead">
        Building a URL shortener sounds simple: accept a long URL, generate a short code, redirect when someone visits it. 
        But making that redirect fast, secure, and reliable at scale — while evolving the platform without downtime — is 
        where the real engineering lives. Here's how hrva.cc is built.
      </p>

      <h2>Stack Overview</h2>
      <p>
        hrva.cc runs on a Spring Boot 4.0.6 backend (Java 25) with a Next.js 16 frontend (React 19). 
        The backend uses PostgreSQL for persistent storage, Redis for caching, and MailHog for email in development. 
        The frontend is deployed on Cloudflare Workers, and the backend runs in Docker with multi-arch builds 
        (amd64 + arm64) via GitHub Actions.
      </p>

      <h2>Security: Defense in Depth</h2>

      <h3>Threat Scanning at Every Level</h3>
      <p>
        Every URL shortened through hrva.cc is checked against the Google Safe Browsing API v4 before it's 
        saved. If the destination is flagged as malware, phishing, or social engineering, the link is blocked 
        at creation time. But threats evolve — a safe site today can be compromised tomorrow. That's why a 
        scheduled task rechecks every active URL against Safe Browsing <strong>daily at 2 AM</strong>. 
        Flagged URLs are automatically deactivated, evicted from cache, and the owner is notified by email.
      </p>

      <h3>JWT Authentication</h3>
      <p>
        All authenticated requests use stateless JWT tokens with configurable expiry (default 10 hours). 
        Tokens are signed with a server-side secret and verified on every request through a custom 
        <code>JwtFilter</code> that sits in the Spring Security chain. No session state, no server-side 
        token storage — just cryptographic verification.
      </p>

      <h3>Rate Limiting</h3>
      <p>
        Login attempts are rate-limited using a Guava in-memory cache — 20 attempts per IP per day. 
        After that, the IP is blocked until the window expires or an admin clears the limit from the 
        dashboard. The admin panel also shows a live view of all active rate limits with a one-click clear button.
      </p>

      <h3>OWASP Basics</h3>
      <p>
        Actuator endpoints are locked down: <code>/actuator/health</code> is public, everything else 
        requires <code>ROLE_ADMIN</code>. CORS is configured to only allow the frontend origin. 
        The <code>ForwardedHeaderFilter</code> ensures correct IP resolution behind proxies. 
        Input validation happens at the controller, service, and entity levels.
      </p>

      <h2>Speed: Every Millisecond Counts</h2>

      <h3>Redis Caching</h3>
      <p>
        The redirect endpoint (<code>GET /{short}</code>) is the hottest path in the system — every click 
        on every short URL goes through it. Initially it made two database queries per redirect. Now it's 
        cache-first: on every request, we check Redis. If the URL data is cached and still valid 
        (not expired, not over its visit limit, not deactivated), we serve the redirect from cache 
        without touching the database. Visit tracking happens asynchronously in the background.
      </p>

      <h3>Cache Warmup and Priming</h3>
      <p>
        On application startup, the <code>CacheWarmup</code> component loads the 20 most visited, 
        20 most recent, and 20 most recently accessed URLs into Redis — so the most popular links 
        are hot from the start. New URLs are cached immediately on creation via 
        <code>cacheUrlResponse()</code>. The TTL is set to 7 days, but stale data is caught by 
        validation logic on every cache hit. Redis graceful degradation means if Redis is down, 
        we fall through to the database without error.
      </p>

      <h3>Read-Optimized Transactions</h3>
      <p>
        All service-layer methods default to <code>@Transactional(readOnly = true)</code>. Only write 
        operations explicitly override this. This gives the database query planner better optimization 
        hints and prevents accidental writes in read paths.
      </p>

      <h3>Frontend Performance</h3>
      <p>
        The Next.js frontend uses server-side rendering for initial page loads, then takes over as a 
        single-page app. The landing page is static and prerendered. Fonts are loaded via 
        <code>next/font</code> with swap display. Animations use CSS-only keyframes (no JavaScript 
        animation libraries) with zero external runtime dependencies for styling.
      </p>

      <h2>Reliability: Built to Handle Failures</h2>

      <h3>Cache Graceful Degradation</h3>
      <p>
        Redis is a performance accelerator, not a hard dependency. A custom <code>CacheErrorHandler</code> 
        catches every Redis failure — get, put, evict, clear — logs it, and returns null, causing the 
        application to fall through to the database. A Redis outage means slightly slower requests, not 
        downtime.
      </p>

      <h3>SafeBrowsing Graceful Degradation</h3>
      <p>
        The Google Safe Browsing API client is a singleton that retries on failure. If the API is 
        unreachable, it returns an empty threat list — URLs are not blocked due to an API outage. 
        The daily recheck task will catch any threats once the API is available again.
      </p>

      <h3>Async Visit Tracking</h3>
      <p>
        Visit counting is fully asynchronous. When someone clicks a short link, the redirect response is 
        sent immediately, and a background task increments the visit counter using Spring's 
        <code>TaskExecutor</code>. This means the redirect response time is independent of database 
        write latency. Visit limits are checked on every redirect via the cached data, and the 
        async write enforces the final deactivation.
      </p>

      <h3>Health Monitoring</h3>
      <p>
        The admin dashboard shows real-time status of PostgreSQL, Redis, JVM heap, uptime, and request 
        counts. The system health page provides green/red indicators for every service layer. 
        Micrometer metrics track redirect response times (cache hit vs. cache miss), and the 
        admin panel displays average and max redirect latency.
      </p>

      <h2>Migration: Evolve Without Downtime</h2>

      <h3>Liquibase for Schema Changes</h3>
      <p>
        All database changes go through Liquibase changelogs — versioned, sequential, and 
        reversible. Migrations run automatically on application startup. The changelog has 9 
        migrations covering the full schema evolution from initial users table to audit logging 
        and email tracking.
      </p>

      <h3>Angular to React Rewrite</h3>
      <p>
        The frontend was originally built in Angular 14. It was completely rewritten to Next.js 16 
        (React 19) in 2026. The rewrite was done alongside the existing Angular deployment, with 
        the new frontend deployed to a separate subdomain (<code>app.hrva.cc</code>) while the 
        old Angular app remained at the root domain. Once the new frontend was fully tested, 
        the root domain was switched via a 302 redirect.
      </p>

      <h3>Gradle to Maven Migration</h3>
      <p>
        The backend was migrated from Gradle to Maven for faster builds and simpler CI configuration. 
        This was a single-commit migration that touched only build files and directory structure — 
        zero runtime code changes. The CI pipeline was updated simultaneously to use <code>mvn package</code> 
        instead of <code>gradle build</code>.
      </p>

      <h3>Docker Multi-Arch CI</h3>
      <p>
        Every push to <code>main</code> triggers a GitHub Actions workflow that runs all 150+ backend 
        tests, builds the application, and pushes a multi-arch Docker image (amd64 + arm64) to 
        GitHub Container Registry. PRs run only the build and tests — no image push. Production 
        deployments pull the image via Portainer with environment variables for OAuth2 secrets.
      </p>

      <h3>Deployment Safety</h3>
      <p>
        Rolling updates ensure zero-downtime deploys. Database schema changes via Liquibase are 
        backward-compatible: new columns are added before code that reads them is deployed, and 
        removed only after no running code references them. The scheduled SafeBrowsing recheck 
        and URL deactivation tasks have configurable schedules in case maintenance windows are needed.
      </p>

      <h2>The Numbers</h2>
      <p>
        As of May 2026: 150+ automated tests covering controllers, services, validators, converters, and 
        models. All tests run on every commit. Redis handles thousands of cache lookups with a 7-day TTL.
      </p>
    `,
  },
  {
    slug: "zero-downtime-migrations",
    title: "Zero-Downtime Migrations: Evolving a Database Without Breaking Anything",
    date: "2026-05-19",
    excerpt: "How we use Liquibase, backward-compatible schema changes, and careful deploy ordering to evolve our PostgreSQL schema without downtime.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "database", "migrations", "liquibase"],
    content: `
      <p class="lead">
        Database migrations are the highest-risk operation in any production service. A bad migration means 
        downtime, data loss, or a midnight rollback. Here's how we approach schema changes at hrva.cc.
      </p>

      <h2>The Rules of Zero-Downtime Migrations</h2>
      <p>
        Every migration follows three rules: <strong>additive first</strong> (add columns before code reads them), 
        <strong>backward-compatible</strong> (old code still works with new schema), and 
        <strong>reversible</strong> (every changeset has a known rollback path).
      </p>

      <h2>Liquibase Changelogs</h2>
      <p>
        All schema changes live in <code>src/main/resources/db/changelog/</code> as numbered XML files. 
        The master changelog at <code>dbchangelog.xml</code> includes them in order. Each changeset has 
        a unique <code>id</code> and <code>author</code>, and migrations run automatically on application 
        startup. If changeset 008 hasn't been applied, it runs before the application context finishes loading.
      </p>
      <p>
        The Liquibase changelog covers the full schema evolution — from the initial users table 
        through URL tracking, API keys, password resets, Safe Browsing columns, IP address tracking, 
        and the recent audit log and email log tables.
      </p>

      <h2>Add Columns Before Code Reads Them</h2>
      <p>
        When adding a new column, we deploy the migration first — before the application code that 
        references it. During a rolling deploy, old application instances continue running against 
        the new schema. An old instance that doesn't know about the new column simply ignores it. 
        A new instance that expects the column finds it already there.
      </p>

      <h2>Removing Columns: The Reverse</h2>
      <p>
        Dropping a column happens in reverse: first deploy code that stops referencing it, wait for 
        all instances to pick up the change, then deploy the migration that drops it. The gap between 
        the two deploys is the safety window. We typically wait a full deploy cycle (all instances 
        confirmed on the new version) before executing destructive operations.
      </p>

      <h2>The &#x1FA84; Moment</h2>
      <p>
        The trickiest migration was adding <code>lastSafeBrowsingCheck</code> to a table with tens of 
        thousands of rows — a nullable column with no default. The <code>ALTER TABLE</code> was instant 
        on PostgreSQL (metadata-only for nullable columns with no default), but backfilling the timestamp 
        for existing rows took 20 minutes. We used a background batch job so the application stayed 
        responsive.
      </p>
    `,
  },
  {
    slug: "async-everything",
    title: "Async Everything: Keeping Redirects Fast While Counting Millions of Visits",
    date: "2026-05-19",
    excerpt: "How we use Spring's TaskExecutor to fire-and-forget visit tracking, email sending, and cache warmup — keeping the redirect path under 5ms.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "performance", "async", "spring"],
    content: `
      <p class="lead">
        Every click on a short URL does two things: redirect the user to the destination, and record the 
        visit. The redirect must be fast. The visit recording can wait. Here's how we separate them.
      </p>

      <h2>The Redirect Path</h2>
      <p>
        When a user visits <code>hrva.cc/abc123</code>, the backend checks Redis for cached URL data. 
        If found and valid (not expired, not deactivated, under visit limit), the redirect response is 
        returned immediately while the visit counter is incremented asynchronously in a background thread.
      </p>

      <h2>Async Visit Tracking</h2>
      <p>
        Spring's <code>TaskExecutor</code> runs the visit tracking in a separate thread. The method 
        <code>fireVisitTracking</code> loads the URL entity from the database (it's already cached for 
        the redirect, but we re-fetch the entity for the write), checks for duplicate IPs, increments 
        the counter via <code>url.onVisit()</code>, and saves. If the visit exceeds the limit, the 
        URL is automatically deactivated.
      </p>
      <p>
        This means the redirect response time is independent of the database write latency. A slow 
        database write doesn't slow down the redirect. The user gets their 302 response in milliseconds 
        while the visit is recorded behind the scenes.
      </p>

      <h2>Async Email Sending</h2>
      <p>
        Email is another fire-and-forget operation. Welcome emails, password resets, expiry notifications, 
        and malware alerts all go through <code>@Async</code> methods. The <code>tryToSendEmail</code> 
        method attempts to send up to 3 times with exponential backoff, but the caller doesn't wait — 
        the email is queued and delivered in the background.
      </p>

      <h2>Async Cache Warmup</h2>
      <p>
        On application startup, the <code>CacheWarmup</code> component loads the 20 most visited, 
        20 most recent, and 20 most recently accessed URLs into Redis. This runs asynchronously 
        after the application context is ready, so the application starts serving requests immediately 
        while the cache fills in the background.
      </p>

      <h2>What We Don't Make Async</h2>
      <p>
        Not everything should be async. URL creation, deletion, and schema migrations are synchronous — 
        the caller waits for confirmation. Authentication is synchronous (you need to know if login 
        succeeded before proceeding). The rule: if the user needs to see the result, it's synchronous. 
        If it's bookkeeping that happens after the response, it's async.
      </p>
    `,
  },
  {
    slug: "caching-strategy-deep-dive",
    title: "Caching Strategy for a URL Shortener: TTL, Warmup, Priming, and Graceful Degradation",
    date: "2026-05-19",
    excerpt: "A deep dive into our Redis caching architecture — how we keep 99% of redirects cache-hot, validate stale data, and survive Redis outages.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "caching", "redis", "performance"],
    content: `
      <p class="lead">
        Every redirect at hrva.cc goes through Redis first. The database is the fallback, not the primary 
        path. Here's how we designed our caching layer to be fast, correct, and resilient.
      </p>

      <h2>Why Cache at All</h2>
      <p>
        The redirect endpoint (<code>GET /{short}</code>) is the hottest path in the system — every click 
        on every short URL hits it. Without caching, every redirect requires two database queries: one 
        to check if the URL exists and is active, and another to read the destination URL. With caching, 
        a single Redis lookup replaces both queries. The database is only touched when the cache is cold 
        or the cached data is stale.
      </p>

      <h2>Cache Layout</h2>
      <p>
        We use a single Redis cache named <code>urls</code>. Each entry maps a short URL code to a 
        serialized <code>UrlResponse</code> object containing the destination URL, active status, 
        expiration date, visit count, and visit limit. The cache is configured with a 7-day TTL — 
        entries expire after a week regardless of access.
      </p>

      <h2>Validation on Every Cache Hit</h2>
      <p>
        A long TTL means entries can become stale. Every cache hit runs <code>isUrlRedirectValid()</code>, 
        which checks three things from the cached data:
      </p>
      <ul>
        <li>Is the URL still active? (wasn't deactivated by owner or scheduler)</li>
        <li>Has the expiration date passed?</li>
        <li>Has the visit limit been reached?</li>
      </ul>
      <p>
        If any check fails, the entry is evicted from cache and the request falls through to the database. 
        This gives us the performance of a 7-day TTL with the correctness of real-time validation.
      </p>

      <h2>Cache Warmup</h2>
      <p>
        When the application starts, the <code>CacheWarmup</code> component loads the 20 most visited 
        URLs, the 20 most recently created, and the 20 most recently accessed into Redis. This runs 
        asynchronously after startup, so the most popular links are cache-hot from the beginning.
      </p>

      <h2>Cache Priming</h2>
      <p>
        New URLs are cached immediately at creation time. When a user shortens a URL, the response is 
        written to Redis before the HTTP response is sent. The first visitor gets a cache hit.
      </p>

      <h2>Eviction Strategy</h2>
      <p>
        When a URL is deactivated, activated, updated, or deleted, the corresponding cache entry is 
        evicted immediately. Deactivation and activation evict by key, delete evicts all entries 
        (it's a rare operation). The scheduled URL deactivation task (runs every minute) does not 
        evict cache — expired URLs fail validation on cache hit, so the database is only queried 
        when necessary.
      </p>

      <h2>Graceful Degradation</h2>
      <p>
        Redis is not a hard dependency. A custom <code>CacheErrorHandler</code> catches every Redis 
        failure — get, put, evict, clear — logs a warning, and returns null. The application falls 
        through to the database without throwing an error. During a Redis outage, redirects are 
        slightly slower (two database queries instead of one cache lookup), but the site stays up.
      </p>
      <p>
        The admin dashboard tracks redirect timing separately for cache hits and cache misses via 
        Micrometer timers, so we can monitor cache effectiveness in real-time.
      </p>
    `,
  },
  {
    slug: "safe-browsing-at-scale",
    title: "Safe Browsing at Scale: Checking Every URL Twice",
    date: "2026-05-20",
    excerpt: "How we integrate Google Safe Browsing v4 to check every URL at creation time and recheck all active URLs daily — with auto-deactivation and email notifications.",
    author: "Karlo Hrvačić",
    tags: ["security", "safe browsing", "automation", "google"],
    content: `
      <p class="lead">
        Every URL shortened through hrva.cc is checked against Google Safe Browsing before it's saved. 
        And then every active URL is rechecked every night. Here's how the pipeline works.
      </p>

      <h2>Why Two Checks</h2>
      <p>
        A single check at creation time is not enough. A URL that is safe today can be compromised 
        tomorrow — a legitimate site gets hacked, a benign page gets replaced with phishing content. 
        The daily recheck catches these cases. Between the two, no link stays live longer than 24 hours 
        after being flagged.
      </p>

      <h2>Creation-Time Check</h2>
      <p>
        When a user submits a URL to shorten, the <code>DefaultUrlValidator</code> calls 
        <code>safeBrowsingService.checkUrlsForThreats()</code> before the URL is saved. If Google 
        Safe Browsing returns any threats, the request is rejected with a validation error. The link 
        is never created.
      </p>
      <p>
        The SafeBrowsing API client is a singleton that creates batch search requests using Google's 
        API v4. It gracefully degrades: if the API is unreachable, it returns an empty threat list — 
        URLs are not blocked due to an API outage. Safety shouldn't become a denial-of-service vector.
      </p>

      <h2>Daily Recheck</h2>
      <p>
        Every night at 2 AM, a scheduled task runs <code>SafeBrowsingRecheckService.recheckActiveUrls()</code>. 
        It queries all active URLs from the database, batches them into pages of 20, and checks each 
        one against Safe Browsing. If a URL is flagged:
      </p>
      <ul>
        <li>The URL is immediately deactivated (<code>active = false</code>)</li>
        <li>The cache entry is evicted so no one gets redirected to a dangerous page</li>
        <li>The owner receives an email notification with the threat type detected</li>
      </ul>

      <h2>The Email Template</h2>
      <p>
        The malware notification email tells the owner which short URL was affected, the destination 
        URL, the threat type detected, and includes a link to the dashboard where they can review 
        or delete the link. The email is styled with the same dark theme as the app, matching the 
        hrva.cc brand.
      </p>

      <h2>Graceful Degradation</h2>
      <p>
        If the Safe Browsing API is down during the daily recheck, the task catches the exception, 
        logs a warning, and tries again the next night. A single failed recheck doesn't cascade into 
        data loss or incorrect deactivations.
      </p>
    `,
  },
  {
    slug: "building-audit-log",
    title: "Building an Audit Log That Doesn't Suck: AOP, Pointcuts, and Meaningful Events",
    date: "2026-05-20",
    excerpt: "How we used Spring AOP to auto-log every admin action — and why we had to exclude read-only endpoints to avoid noise.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "audit", "spring", "aop"],
    content: `
      <p class="lead">
        Every admin action at hrva.cc is automatically logged to the audit trail. Here's how we built it 
        with Spring AOP, what went wrong on the first attempt, and the final design that captures 
        meaningful events without noise.
      </p>

      <h2>Why an Audit Log?</h2>
      <p>
        When multiple admins manage a system, you need to know who did what. Did an admin delete a URL 
        or did the scheduler deactivate it? Was a user account modified by someone or by the inactivity 
        cleanup? An audit log answers these questions. It's also essential for compliance, debugging, 
        and security investigations.
      </p>

      <h2>First Attempt: Wildcard Pointcut</h2>
      <p>
        Our first version used a broad pointcut: <code>execution(* AdminController.*(..))</code>. 
        This intercepted every method on the admin controller — including read-only GET endpoints 
        like <code>getDashboardStats()</code> and <code>getLoginAttempts()</code>. Within an hour, 
        the audit log was flooded with "getDashboardStats" entries from the dashboard's auto-refresh 
        (it polls every 30 seconds). The meaningful events were buried in noise.
      </p>

      <h2>Second Attempt: Explicit Mutations Only</h2>
      <p>
        We narrowed the pointcut to only match methods that actually change state. The final version 
        explicitly lists every mutating method across all admin-relevant controllers: 
        <code>clearLoginAttempts</code>, <code>deleteUser</code>, <code>updateUser</code>, 
        <code>revokeUrl</code>, <code>activateUrl</code>, <code>deleteUrl</code>, <code>updateUrl</code>. 
        Read-only endpoints are excluded entirely.
      </p>

      <h2>The AOP Aspect</h2>
      <p>
        The <code>AdminAuditAspect</code> uses <code>@Around</code> advice. Before the method executes, 
        it captures the user's email, method name, target type (extracted from the controller class name), 
        and method arguments. The method proceeds normally, and on success the audit entry is saved. 
        If the method throws, a separate entry is logged with "FAILED" appended to the action name 
        and the exception message as details.
      </p>

      <h2>The Audit Log Table</h2>
      <p>
        The Liquibase migration creates an <code>audit_log</code> table with: <code>performedBy</code> 
        (admin email), <code>action</code> (method name), <code>targetType</code> (controller name), 
        <code>targetIdentifier</code> (first argument, usually the ID), <code>details</code> 
        (serialized arguments), and <code>performedAt</code> (auto-set via <code>@PrePersist</code>). 
        The admin UI at <code>/admin/audit-log</code> shows all entries in a paginated table with 
        color-coded action badges — red for deletions, amber for updates, green for activations.
      </p>
    `,
  },
  {
    slug: "angular-to-react-rewrite",
    title: "Rewriting an Angular App to React Without Stopping Development",
    date: "2026-05-20",
    excerpt: "How we migrated from Angular 14 to Next.js 16 while keeping the live app running — and the lessons we learned about incremental rewrites.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "rewrite", "react", "nextjs", "angular"],
    content: `
      <p class="lead">
        Rewriting a production frontend is risky. Users don't care about your tech stack — they care 
        that the site works. Here's how we migrated from Angular 14 to Next.js 16 without downtime 
        and without slowing down feature development.
      </p>

      <h2>Why Rewrite</h2>
      <p>
        The original hrva.cc frontend was built in Angular 14 with Material Design components. It worked, 
        but the development velocity was slowing down. Adding new features required navigating Angular's 
        module system, dependency injection, and RxJS streams. The team wanted React's simpler mental 
        model, Next.js's server-side rendering for SEO, and the broader ecosystem of React components.
      </p>

      <h2>The Dual-Deploy Strategy</h2>
      <p>
        We deployed the new React frontend to <code>app.hrva.cc</code> while the old Angular app 
        remained at the root domain. During the transition period, both apps were live. The backend 
        API served both — the API was already versioned, so both frontends could coexist. Users 
        who found the new app at <code>app.hrva.cc</code> could use it immediately, while existing 
        bookmarks to the root domain still worked.
      </p>

      <h2>What We Kept</h2>
      <p>
        The backend API stayed unchanged during the rewrite (it was already well-designed with 
        RESTful endpoints). The data model, authentication flow, and business logic were identical. 
        The rewrite was purely a frontend concern — the backend didn't know or care whether Angular 
        or React was talking to it.
      </p>

      <h2>What We Redid</h2>
      <p>
        The entire UI was rebuilt from scratch with a new design system — glassmorphism cards, amber 
        accent colors, dark theme by default, responsive layout. We replaced Angular Material with 
        Radix UI primitives and Tailwind CSS. The state management went from RxJS to TanStack Query. 
        The build system went from Angular CLI to Next.js with TurboPack.
      </p>

      <h2>The Switch</h2>
      <p>
        After a month of parallel operation, we switched the root domain's DNS to point to the new 
        frontend. The old Angular app was decommissioned. The entire migration took 3 months from 
        decision to completion, with zero user-facing downtime. The key lesson: a gradual, 
        coexistence-based migration is less dramatic than a big-bang rewrite, and it's safer.
      </p>
    `,
  },
  {
    slug: "designing-url-shortener-ui",
    title: "Designing a URL Shortener UI That Works for Everyone",
    date: "2026-05-21",
    excerpt: "The design decisions behind hrva.cc's interface — why we removed the advanced options toggle, how we upsell without being pushy, and what we learned from user behavior.",
    author: "Karlo Hrvačić",
    tags: ["design", "ux", "ui", "product"],
    content: `
      <p class="lead">
        A URL shortener has two very different user types: the visitor who wants to shorten one link 
        quickly, and the power user who needs custom aliases, visit limits, and analytics. The UI 
        must serve both without confusing either. Here's how we designed for that.
      </p>

      <h2>The Anonymous Flow: Paste, Shorten, Done</h2>
      <p>
        The landing page's hero section is deliberately minimal: a URL input field and a "Shorten" 
        button. No account required, no options to configure, no friction. The user pastes a URL, 
        clicks Shorten, and gets their short link instantly. This is the path that 80% of visitors take.
      </p>

      <h2>What We Removed</h2>
      <p>
        The original design had a "Show advanced options" toggle that revealed custom alias, visit 
        limit, and expiration date fields. We removed it from the anonymous flow because those 
        features don't work for unauthenticated users — the backend clears them. Showing options 
        that silently do nothing is worse than not showing them at all. Instead, after a visitor 
        shortens a link, we show a subtle upsell: "Create a free account to set custom aliases, 
        visit limits, and track analytics."
      </p>

      <h2>The Logged-In Flow: Power Tools Visible</h2>
      <p>
        When a user logs in, the same form changes. Custom alias, visit limit, and expiration date 
        fields are always visible — no toggle needed. The user is already authenticated and intentional; 
        hiding power features behind an accordion only adds friction. The form has a clear separation 
        with a "Optional settings" label and a subtle border above the advanced fields.
      </p>

      <h2>The Dashboard</h2>
      <p>
        The dashboard shows all URLs in a sortable, filterable, paginated table. Users can search by 
        keyword, filter by status (active/inactive), and check "Expired only" to see links past their 
        expiration date. Each row has quick actions: copy URL, open destination, generate QR code, 
        view analytics, deactivate, and delete. The pagination always shows the total element count 
        and page size selector.
      </p>

      <h2>What We Learned</h2>
      <p>
        The toggle pattern assumed users would discover advanced options and use them. In practice, 
        anonymous visitors who want a quick short link don't explore hidden sections — they paste 
        and click Shorten. Showing options that don't work for their current auth state added 
        confusion without benefit. The upsell card after shortening is more transparent: it tells 
        them exactly what they'd get by creating an account, right when they've just experienced 
        the core value of the tool.
      </p>
    `,
  },
  {
    slug: "open-source-url-shortener",
    title: "Open Sourcing a URL Shortener: What We Learned",
    date: "2026-05-21",
    excerpt: "Why we made hrva.cc open source, what the community taught us, and the surprising number of people who want to self-host their link infrastructure.",
    author: "Karlo Hrvačić",
    tags: ["open source", "community", "self-hosting", "business"],
    content: `
      <p class="lead">
        hrva.cc is open source — the entire codebase is on GitHub under an MIT license. Here's why we 
        did it, what we got out of it, and what surprised us about running an open source URL shortener.
      </p>

      <h2>Why Open Source?</h2>
      <p>
        The decision was practical, not ideological. URL shorteners are a commodity — there are hundreds 
        of them. Making the code open source differentiates hrva.cc from closed competitors. It signals 
        transparency (you can see exactly how your data is handled), trust (you can audit the security 
        code), and longevity (if hrva.cc ever shuts down, the code doesn't disappear).
      </p>

      <h2>The Surprise: Self-Hosting Demand</h2>
      <p>
        The most unexpected outcome was the number of people who want to self-host. Companies with 
        compliance requirements (GDPR, SOC2, internal data policies) prefer to run their own instance 
        rather than trust a third-party service. Universities want to provide link shorteners for their 
        students. Developers want to experiment with the architecture. The Docker image with 
        multi-arch support (amd64 + arm64) was a direct response to this demand.
      </p>

      <h2>What Open Source Changed</h2>
      <p>
        Publishing the code improved the project in unexpected ways. Knowing that strangers will read 
        the code made us write better code — cleaner interfaces, better documentation (in the form of 
        clear naming and structure), and more thorough tests. The test suite grew significantly as we 
        added coverage for edge cases we wouldn't have bothered with internally.
      </p>

      <h2>What We Didn't Expect</h2>
      <p>
        The hardest part of open source is not the code — it's the issue triage. Setting up issue 
        templates, responding to questions, reviewing contributions, and deciding what to accept 
        takes more time than writing the code itself. We learned to be clear about what we will 
        and won't accept: bug fixes and small features yes, major architectural changes no 
        (unless they align with the roadmap).
      </p>

      <h2>Would We Do It Again?</h2>
      <p>
        Absolutely. The open source version drives adoption that the hosted version alone wouldn't get. 
        People find hrva.cc through GitHub, try the hosted version, and some become paying API users. 
        The self-hosters would never have used a closed-source shortener anyway — they're not lost 
        revenue, they're free marketing.
      </p>
    `,
  },
]

export const featuredPosts = blogPosts.slice(0, 3)
