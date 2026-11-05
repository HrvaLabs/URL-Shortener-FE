export interface BlogPost {
  slug: string
  title: string
  shortTitle?: string
  date: string
  updated?: string
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
    updated: "2026-11-05",
    excerpt:
      "In September, scam links imitating Njuškalo and Jófogás got past Google Safe Browsing and every other check they were run against. Here's what hrva.cc checks now, what it still can't catch, and how you can help.",
    author: "Karlo Hrvačić",
    tags: ["security", "phishing", "blocklists", "safe browsing"],
    content: `
      <p class="lead">
        In September 2026, a new account used hrva.cc to share links to fake Njuškalo and Jófogás pages.
        Google Safe Browsing didn't catch them, and neither did anything else they were checked against later.
        This post explains why, and the layers hrva.cc now uses to stop links like these.
      </p>

      <h2>What happened</h2>
      <p>
        Njuškalo and Jófogás are popular classifieds sites in Croatia and Hungary. In mid-September, one new
        account created a batch of hrva.cc links to pages that copied them, on domains such as
        <code>njuskaio[.]cam</code> and <code>jofogas[.]cards</code>. The domains had been registered the same
        day the links appeared. The links stayed up for weeks before they were found.
      </p>
      <p>
        When those domains were checked in October, none of the outside services had flagged them. Google Safe
        Browsing let them through. So did HaGeZi's threat lists, which hold more than two million known bad domains,
        and the malware-blocking DNS from Quad9 and Cloudflare.
      </p>
      <p>
        That isn't a failure of those services. A list can only block a site after someone has spotted it,
        and a domain registered that same day has no history yet. The lesson was that lists alone are too
        slow for scams on fresh domains. So hrva.cc now also looks at how old a domain is, and at whether its
        name imitates a well-known brand.
      </p>

      <h2>Checks when a link is created</h2>
      <p>
        No single check catches everything, so hrva.cc runs several. Each one covers gaps in the others. The
        <a href="/security">security page</a> lists them with hrva.cc's other protections.
      </p>
      <ul>
        <li>
          <strong>Google Safe Browsing.</strong> Every destination is checked against Google's database of
          phishing and malware sites when the link is created, and again later. More in
          <a href="/blog/safe-browsing-link-sharing">Why Safe Browsing matters for link sharing</a> and
          <a href="/blog/safe-browsing-at-scale">Google Safe Browsing: when links are checked</a>.
        </li>
        <li>
          <strong>Local blocklists.</strong> hrva.cc downloads public blocklists to its own server and
          refreshes them several times a day. Some list harmful domains. Others list exact links, which lets
          hrva.cc catch one bad page on a trusted host without blocking the whole host. Because the lists live on
          hrva.cc's server, checking a link against them sends it nowhere.
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
        <li>
          <strong>Warning page.</strong> Some links made without an account open a page first. It shows the full
          destination, a Continue button and a way to report the link.
        </li>
        <li>
          <strong>Sign-in forms.</strong> hrva.cc's server opens the destination page of some of those links once,
          and of links made, repointed or turned back on from an account. If the page asks for a password or card
          details, a person checks the link, and the link can be held until then. Visitors are told the link is
          being checked. On links from an account, a sign-in page on one of the most-visited sites, such as
          Google's or Microsoft's own, doesn't count.
        </li>
      </ul>

      <h2>Checks after a link is live</h2>
      <ul>
        <li>
          <strong>While a link is active.</strong> Active links are checked again against Safe Browsing and the
          latest lists, so a site that turns bad later still gets caught.
        </li>
        <li>
          <strong>Every click.</strong> Before a visitor is sent anywhere, the destination is checked against
          the blocklists that block outright. If it has been listed since the last check, the link stops working on that click,
          and the visitor sees a page saying the link isn't available.
        </li>
        <li>
          <strong>Domain rules.</strong> When a domain is clearly bad, an admin can block it, and every link to it
          stops working at once. An admin can also mark a domain as trusted, to undo a false alarm.
        </li>
      </ul>

      <h2>A person makes the hard calls</h2>
      <p>
        Some links look doubtful but are fine. A small business on a new domain, or a real login page, can
        trip the same signals as a scam. Blocking those automatically would hurt real people, so doubtful
        links aren't blocked. They go to a review queue, and a person decides: the link is fine, the domain
        is trusted, or the link, the domain or the account gets blocked. A link that is held, like one that
        leads to a sign-in form, opens only once a person has allowed it.
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
          is only caught once it's on a list of exact links. hrva.cc doesn't block a whole trusted host for one
          bad file.
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
    updated: "2026-11-01",
    excerpt:
      "What a short link does better than a long one, what hrva.cc checks before it sends anyone on, what you get with and without an account, and when a long link is the better choice.",
    author: "Karlo Hrvačić",
    tags: ["URL shortener", "link management", "productivity"],
    content: `
      <p class="lead">
        A long address is hard to read out, easy to mistype and often breaks across lines in an email. A short link
        fixes that. A shortener can also do things a plain address can't: stop a link on a date, stop it after a
        number of clicks, and count how often it was opened.
      </p>

      <h2>What a short link does</h2>
      <ul>
        <li>
          <strong>It's easy to type and read out.</strong> <code>hrva.cc/summer-sale</code> is easier to copy from a
          poster or say on the phone than an address full of parameters. When hrva.cc picks the alias itself, it
          leaves out 0, O, 1, l and I, which are easy to mix up (<a href="/help/links#aliases">how aliases work</a>).
        </li>
        <li>
          <strong>It makes a simpler QR code.</strong> Fewer characters give a QR code with fewer, larger squares,
          which is easier to print small and to scan. hrva.cc's QR codes mark their scans, so a link's stats show how
          many clicks came from the QR code (<a href="/help/stats#qr-scans">QR scans</a>).
        </li>
        <li>
          <strong>It can end on purpose.</strong> A link can stop working on a date or after a number of clicks.
          <a href="/blog/expiration-dates-visit-limits">How expiration dates and visit limits work</a> explains both.
        </li>
        <li>
          <strong>It counts clicks.</strong> With an account, each link has a stats page with daily clicks, unique
          visitors, referring sites, countries and devices, and no visitor's IP address is stored.
          <a href="/blog/link-analytics-guide">The link analytics guide</a> covers what is counted.
        </li>
      </ul>

      <h2>What hrva.cc checks</h2>
      <p>
        A short link hides where it goes until someone opens it, so hrva.cc checks the destination before it sends
        anyone there. Every destination is checked against Google Safe Browsing and public blocklists when the link
        is made and again while the link is active, and every click is checked against blocklists. Links to other URL
        shorteners are refused, so a short link can't hide another one. The <a href="/security">security page</a>
        lists every check.
      </p>

      <h2>With and without an account</h2>
      <p>
        Without an account, you paste an address on the <a href="/">home page</a> and get a short link to copy. It
        has no stats page, hrva.cc may give it an end date or a visit limit (the form says so), and some of these
        links open a page that shows the destination first.
        <a href="/help/links-without-an-account">Links made without an account</a> has the details.
      </p>
      <p>
        A free account adds custom aliases, visit limits, expiry dates, passwords, tags and stats, plus
        <a href="/help/utm">campaign (UTM) tags</a>, a <a href="/link-in-bio">bio page</a>, a
        <a href="/help/custom-domains">custom domain</a>, <a href="/help/notifications">notifications</a>,
        <a href="/developers">API keys</a> and the <a href="/mcp">MCP connector</a> for AI assistants. hrva.cc has
        no paid plans and shows no ads.
      </p>

      <h2>When a long link is better</h2>
      <p>
        A full address tells the reader where it goes before they click. When that matters, for example for a bank
        or a sign-in page, share the full address or say where the link leads. For a hrva.cc link,
        <a href="/validate">Check a link</a> shows the destination without opening it.
      </p>
    `,
  },
  {
    slug: "link-analytics-guide",
    title: "Link Analytics Guide: What hrva.cc Counts, and What It Doesn't",
    shortTitle: "Link Analytics Guide: What hrva.cc Counts",
    date: "2026-05-12",
    updated: "2026-11-01",
    excerpt:
      "What a link's stats show, how to read clicks, unique visitors and bot clicks, where UTM tags fit in, and what hrva.cc never records about the people who click.",
    author: "Karlo Hrvačić",
    tags: ["analytics", "marketing", "link tracking"],
    content: `
      <p class="lead">
        Link analytics answers a few questions: how many people opened a link, on which days, and roughly where they
        came from. This guide covers what hrva.cc counts for each link, how to read the numbers, and what it never
        records.
      </p>

      <h2>What a link's stats show</h2>
      <p>
        With an account, each link has a stats page. For every day, hrva.cc keeps totals:
      </p>
      <ul>
        <li><strong>Clicks:</strong> each time someone was sent on to the destination.</li>
        <li><strong>Unique visitors:</strong> each person counted once per link per day.</li>
        <li><strong>Bot clicks:</strong> bots and link previews, counted apart and left out of every other number.</li>
        <li>
          <strong>Referrers:</strong> the domain of the site a click came from, such as <code>t.co</code>, never the
          full page address.
        </li>
        <li><strong>Countries, devices, browsers and operating systems:</strong> a count for each.</li>
        <li><strong>QR scans:</strong> clicks from a QR code made by hrva.cc, shown next to the other clicks.</li>
      </ul>
      <p>
        You can look at the last 7, 30, 90 or 365 days. The Analytics page in the dashboard adds up all your links
        and lists the ones with the most clicks.
      </p>

      <h2>Reading the numbers</h2>
      <ul>
        <li>
          <strong>Clicks and unique visitors differ.</strong> Someone who opens a link three times in a day is three
          clicks and one unique visitor. The same person on two days, or on two of your links, counts as two unique
          visitors, because the count starts over for each link and each day.
        </li>
        <li>
          <strong>Link previews aren't people.</strong> When a link is posted in a chat app, the app often fetches it
          to show a preview. hrva.cc counts link previews as bot clicks, so they don't add to your clicks.
        </li>
        <li>
          <strong>Direct means no referrer.</strong> A click counts as direct when the browser didn't say where it
          came from, for example when the link was typed in or opened from an app that doesn't send one.
        </li>
        <li>
          <strong>Visits isn't clicks.</strong> The Visits number on your links page adds up each day's unique
          visitors, so it can be lower than the clicks.
        </li>
      </ul>

      <h2>Campaigns and UTM tags</h2>
      <p>
        hrva.cc counts the click on the short link. To see what visitors do after they arrive, add UTM tags to the
        destination; your own analytics tool reads them. The <a href="/utm">UTM builder</a> adds them, and the
        <a href="/help/utm">campaign tracking guide</a> explains each field. A short link made with an account also
        passes its own query string on, so <code>hrva.cc/abc?ref=mail</code> opens the destination with
        <code>ref=mail</code> added (<a href="/help/links#query-strings">query strings</a>).
      </p>

      <h2>What hrva.cc doesn't record</h2>
      <p>
        IP addresses, full browser identifiers and full referring addresses are never stored, and nothing is recorded
        about a single click. Short links set no cookies and run no scripts. Unique visitors are counted with a
        one-way hash and a key that changes every day; the hashes and the key are kept only in Redis and deleted a
        few hours after the day ends, so the same visitor can't be followed across days or links.
        <a href="/privacy-first-url-shortener">URL shortener without tracking</a> shows how, with links to the code,
        and the <a href="/privacy">privacy policy</a> lists everything that is kept.
      </p>
      <p>
        Only you, and an admin who uses two-step sign-in, can see a link's stats. Anyone who has the short link can
        see where it goes and how many times it has been opened.
      </p>

      <h2>Stats without opening the dashboard</h2>
      <p>
        You can turn on a weekly summary email, and a daily click summary for a chat channel or webhook. Nothing is
        on by default (<a href="/help/notifications#what-you-can-get">what you can get</a>).
      </p>
    `,
  },
  {
    slug: "expiration-dates-visit-limits",
    title: "How Expiration Dates and Visit Limits Work",
    date: "2026-05-10",
    updated: "2026-11-01",
    excerpt:
      "An expiration date stops a link at a set time, a visit limit after a number of clicks. How each works on hrva.cc, what visitors see afterwards, and how to get a reminder.",
    author: "Karlo Hrvačić",
    tags: ["features", "expiration", "control"],
    content: `
      <p class="lead">
        A shared link keeps working until something stops it. An expiration date and a visit limit are two ways to
        stop it on purpose. Both come with a free account, and you set them when you make the link.
      </p>

      <h2>Expiration dates</h2>
      <p>
        An expiration date is the date and time a link stops working. The form takes your local time, and hrva.cc
        stores it in UTC. The date is checked on every click, so the link never opens after it; a visitor sees
        "This link has expired." It suits:
      </p>
      <ul>
        <li>a sale or an offer that ends on a known day</li>
        <li>a registration link that should close with the event</li>
        <li>a document shared for a review with a deadline</li>
      </ul>
      <p>
        Through the API, a date without a time zone is read as UTC (<a href="/developers#dates">dates in the API</a>).
      </p>

      <h2>Visit limits</h2>
      <p>
        A visit limit is the number of clicks a link allows. Every click counts, repeat clicks from the same person
        included. Bots, link previews and HEAD requests from link checkers don't. Each click is counted before the
        visitor is sent on, so clicks at the same moment can't go past the limit. The click that reaches the limit is
        the last one to open the link; after it, visitors see "This link has reached its visit limit."
      </p>
      <p>
        Your dashboard shows how many clicks have counted, for example "3 of 5 clicks used". The Visits number counts
        unique visitors per day, so it can be lower. A visit limit suits:
      </p>
      <ul>
        <li>a download meant for a set number of people</li>
        <li>a coupon or an invitation that should work a set number of times</li>
      </ul>
      <p>
        <a href="/help/links#visit-limits">Visit limits</a> in the help has the details.
      </p>

      <h2>Both on one link</h2>
      <p>
        A link can have both, and it stops at whichever comes first: "works at most 500 times, and never after
        December 31".
      </p>

      <h2>What visitors see</h2>
      <p>
        An expired or used-up link answers with a short hrva.cc page that says why, with the status
        <code>410 Gone</code> and a link to report it. It never sends the visitor on to the destination.
      </p>

      <h2>Reminders</h2>
      <p>
        Turn on <strong>Expiry reminders</strong> in Settings to get an email a day before one of your links expires.
        Like every notification, it stays off until you turn it on
        (<a href="/help/notifications#what-you-can-get">notifications</a>).
      </p>

      <h2>Links made without an account</h2>
      <p>
        hrva.cc can give links made without an account an end date or a visit limit. When it does, the form says so,
        and the limits can't be changed there
        (<a href="/help/links-without-an-account#limits">limits for links without an account</a>).
      </p>
    `,
  },
  {
    slug: "url-shortening-best-practices-2026",
    title: "URL Shortening Best Practices for 2026",
    date: "2026-05-08",
    updated: "2026-11-01",
    excerpt:
      "Seven habits that make short links easier to trust, to measure and to keep working: readable aliases, an end for time-bound links, UTM tags, reading stats right, destination checks, dead-link alerts and a tidy dashboard.",
    author: "Karlo Hrvačić",
    tags: ["best practices", "tips", "SEO"],
    content: `
      <p class="lead">
        A short link hides its destination, so people decide whether to trust it from the link itself and from where
        they found it. These practices make short links easier to trust, to measure and to keep working.
      </p>

      <h2>1. Use a readable alias for public links</h2>
      <p>
        A random alias is fine for a link you send to one person. For a poster, a slide or a social post, choose your
        own: <code>hrva.cc/summer-sale</code> says more than <code>hrva.cc/x7Kp9</code> and is easier to type.
        Aliases are case-sensitive, so <code>hrva.cc/Sale</code> and <code>hrva.cc/sale</code> are different links;
        lower case is easier to read out. Custom aliases come with a free account.
      </p>

      <h2>2. Give time-bound links an end</h2>
      <p>
        A link to an event, an offer or a form with a deadline should stop when it's over. Set an expiration date or
        a visit limit when you make it (<a href="/blog/expiration-dates-visit-limits">how they work</a>). Visitors then
        see that the link has expired instead of an outdated page.
      </p>

      <h2>3. Tag campaigns at the destination</h2>
      <p>
        Put a campaign's UTM tags on the destination, so your analytics tool sees where visitors came from. The
        <a href="/utm">UTM builder</a> adds them and can shorten the result. For a one-off parameter, add it to the
        short link instead: hrva.cc passes the query string of a link made with an account on to the destination, and
        the destination's own value wins a clash (<a href="/help/links#query-strings">query strings</a>).
      </p>

      <h2>4. Read the stats before acting on them</h2>
      <p>
        Clicks count every open, unique visitors count each person once per link per day, and bots and link previews
        are kept apart. A link posted in a busy chat can show bot clicks before any person opens it.
        <a href="/blog/link-analytics-guide">The link analytics guide</a> explains each number.
      </p>

      <h2>5. Use a shortener that checks destinations</h2>
      <p>
        A shortener that doesn't check where links go can be used to hide phishing and malware. hrva.cc checks every
        destination when the link is made and again while it is active, checks every click against blocklists, and
        refuses links to other shorteners. The <a href="/security">security page</a> lists the checks. When you get a
        hrva.cc link and aren't sure about it, <a href="/validate">Check a link</a> shows where it goes without
        opening it.
      </p>

      <h2>6. Watch for dead destinations</h2>
      <p>
        Pages move and sites close. hrva.cc checks whether each active link's destination still answers, and your
        dashboard marks a link whose destination looks dead. You can also get an email or a chat alert when that
        happens (<a href="/help/notifications#dead-links">dead links</a>). You can't change where a hrva.cc link goes
        once it's made, so when a page moves, make a new link and replace the old one where you shared it.
      </p>

      <h2>7. Keep the dashboard tidy</h2>
      <p>
        Your links page can be searched, filtered by status or tag, narrowed to expired links, and sorted by visits,
        creation date or expiry date, with 10 to 100 links per page. Turn off the links you no longer need, or delete
        them; deleting a link also deletes its stats.
      </p>
    `,
  },
  {
    slug: "safe-browsing-link-sharing",
    title: "Why Safe Browsing Matters for Link Sharing",
    date: "2026-05-05",
    updated: "2026-11-01",
    excerpt:
      "A short link hides where it goes until someone opens it. What hrva.cc checks before it sends anyone on, what Google Safe Browsing receives, and what a list like it can't catch.",
    author: "Karlo Hrvačić",
    tags: ["security", "safe browsing", "privacy"],
    content: `
      <p class="lead">
        A short link hides where it goes until someone opens it. So before hrva.cc sends anyone on, it checks the
        destination. Google Safe Browsing is one of those checks.
      </p>

      <h2>What Safe Browsing is</h2>
      <p>
        Google Safe Browsing is a list Google keeps of sites known for phishing, malware and unwanted software.
        hrva.cc asks it about every destination.
      </p>

      <h2>What hrva.cc checks</h2>
      <ul>
        <li>
          <strong>When a link is made.</strong> The destination is checked against Safe Browsing and against public
          blocklists that hrva.cc keeps on its own server. A destination marked as harmful is refused.
        </li>
        <li>
          <strong>Where it redirects.</strong> After a link is made, hrva.cc follows the destination's redirects and
          checks every address along the way.
        </li>
        <li>
          <strong>While the link is active.</strong> Links are checked again later, so a site that turns harmful after
          the link was made still gets caught. A link found then stops working, and visitors see a page saying it
          isn't available.
        </li>
        <li>
          <strong>On every click.</strong> The destination is checked against blocklists before the visitor is sent
          on.
        </li>
      </ul>
      <p>
        Links the checks are unsure about go to a review queue, and a person decides what happens to them.
      </p>

      <h2>What Safe Browsing receives</h2>
      <p>
        hrva.cc sends Google the destination address, and the addresses it redirects to. It sends nothing about the
        person who made the link or the people who open it. Google's terms are in its
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
      </p>

      <h2>What a list can't catch</h2>
      <p>
        A list can only hold a site after someone has spotted it. A scam on a domain registered the same day isn't
        on any list yet. That's why Safe Browsing is one check among several.
        <a href="/blog/how-hrva-cc-stops-phishing-links">How hrva.cc stops phishing links</a> covers the others,
        and the <a href="/security">security page</a> lists them in one place.
      </p>

      <h2>What you can do</h2>
      <ul>
        <li>
          <strong>Check before you open.</strong> <a href="/validate">Check a link</a> shows where a hrva.cc link
          goes without opening it.
        </li>
        <li>
          <strong>Report it.</strong> If a hrva.cc link leads somewhere harmful, report it on the
          <a href="/report">report page</a>.
        </li>
      </ul>
    `,
  },
  {
    slug: "how-we-built-it",
    title: "How hrva.cc Handles Security, Speed, Reliability, and Migration",
    shortTitle: "How hrva.cc Is Built: Security, Speed, Reliability",
    date: "2026-05-18",
    updated: "2026-11-01",
    excerpt:
      "What hrva.cc runs on, how it protects links and accounts, how redirects stay fast, what happens when a part of it fails, and how changes are shipped.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "architecture", "infrastructure", "security"],
    content: `
      <p class="lead">
        hrva.cc turns a long address into a short one and sends visitors on when they open it. This post describes
        how it is built: what it runs on, how it protects links and accounts, how redirects stay fast, what happens
        when a part of it fails, and how changes are shipped.
      </p>

      <h2>What it runs on</h2>
      <p>
        The API is a Spring Boot 4.1 application on Java 25, with PostgreSQL for data and Redis for the cache and
        counters. It runs on Oracle Cloud in Frankfurt, Germany. The web app is Next.js 16 with React 19, deployed
        on Cloudflare Workers. Both are open source under the GPL-3.0 licence: the
        <a href="https://github.com/HrvaLabs/url-shortener" target="_blank" rel="noopener noreferrer">API</a> and
        the <a href="https://github.com/HrvaLabs/URL-Shortener-FE" target="_blank" rel="noopener noreferrer">web app</a>.
      </p>

      <h2>Security</h2>
      <p>
        The <a href="/security">security page</a> lists what hrva.cc checks and protects. In short:
      </p>
      <ul>
        <li>
          <strong>Links.</strong> Every destination is checked against Google Safe Browsing and public blocklists
          when the link is made and again while it is active. Redirects are followed and checked, and every click
          is checked against blocklists. Links the checks are unsure about go to a person.
        </li>
        <li>
          <strong>Accounts.</strong> Passwords are stored as bcrypt hashes. Two-step sign-in works with an
          authenticator app, passkeys and recovery codes, and admin pages need it. Sign-in attempts are limited,
          and <strong>Sign out everywhere</strong> ends every other sign-in.
        </li>
        <li>
          <strong>Secrets.</strong> Password reset links are stored only as hashes, and API keys as a hash and
          their first characters. A reset link works once and expires after an hour.
        </li>
        <li>
          <strong>The API.</strong> Every request is refused unless the route is public or the caller is signed
          in. When the server fetches an address someone gave it, it connects only to public internet addresses.
        </li>
      </ul>

      <h2>Speed</h2>
      <p>
        The redirect is the busiest path: every click on every short link goes through it. A link's details are
        cached in Redis, so a redirect that finds its link in the cache answers without a database query, unless
        the link has a visit limit, whose clicks are counted in the database first. Before it uses a cached entry,
        the redirect checks again that the link is active, not expired and not over its visit limit.
      </p>
      <p>
        New links are cached as soon as they are made, and the most used links are loaded into the cache when the
        API starts. Counting a click for the link's statistics runs in the background, so the redirect doesn't wait
        for it.
      </p>
      <p>
        The web app's public pages, this blog included, are prerendered when the site is built.
      </p>

      <h2>Reliability</h2>
      <ul>
        <li>
          <strong>Redis is down.</strong> Redirects read the link from the database instead of the cache.
        </li>
        <li>
          <strong>The database is down.</strong> Links in the cache keep redirecting, except links with a visit
          limit, which need the database to count the click. Requests that need the database get a quick 503
          answer, "hrva.cc can't reach its database right now. Try again in a minute.", instead of waiting.
        </li>
        <li>
          <strong>Status.</strong> Uptime and incidents are on the
          <a href="https://status.hrva.cc/status/url" target="_blank" rel="noopener noreferrer">status page</a>.
        </li>
      </ul>

      <h2>Shipping changes</h2>
      <ul>
        <li>
          <strong>Database changes</strong> are Liquibase changelogs, applied in order when the API starts.
        </li>
        <li>
          <strong>The API</strong> is built and tested with Maven on every push and pull request to
          <code>main</code>. A push to <code>main</code> also publishes a Docker image for amd64 and arm64.
        </li>
        <li>
          <strong>The web app</strong> is type-checked, linted, checked and built on every push and pull request to
          <code>main</code>.
        </li>
        <li>
          <strong>Scanning.</strong> GitHub CodeQL scans both repositories on every change and every week, and
          Dependabot proposes dependency updates.
        </li>
      </ul>

      <h2>How it got here</h2>
      <p>
        The web app was first written in Angular and was rewritten in Next.js in 2026
        (<a href="/blog/angular-to-react-rewrite">how the rewrite went</a>). The API's build moved from Gradle to
        Maven.
      </p>
    `,
  },
  {
    slug: "zero-downtime-migrations",
    title: "Database Migrations with Liquibase: How hrva.cc Changes Its Schema",
    shortTitle: "Database Migrations with Liquibase",
    date: "2026-05-19",
    updated: "2026-11-01",
    excerpt:
      "How hrva.cc changes its PostgreSQL tables: Liquibase changesets applied at startup, schema and data changed together, preconditions for work that may already be done, rollbacks, and tests that run a migration on old rows.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "database", "migrations", "liquibase"],
    content: `
      <p class="lead">
        hrva.cc keeps its data in PostgreSQL, and every change to its tables is a Liquibase changeset that ships with
        the code that needs it. This post covers how those changesets are laid out, applied, written and tested.
      </p>

      <h2>Where the changes live</h2>
      <p>
        The master changelog, <code>src/main/resources/db/dbchangelog.xml</code>, includes the other files in order.
        The oldest files seed the roles, create one table each, or make an early change to a table; since then,
        each change has its own numbered file named after the feature, such as <code>026-privacy-first-analytics.xml</code> or <code>043-url-opens.xml</code>. Every
        changeset has an id and an author. Liquibase records the changesets it has applied in the database and runs
        only the new ones.
      </p>

      <h2>Applied when the API starts</h2>
      <p>
        The API runs as one Docker container. When a new version starts, Liquibase applies the pending changesets
        before the API takes any requests, and if a changeset fails, startup stops there. The container's health
        check allows a two-minute start period, so a first start with a long migration isn't marked unhealthy.
      </p>

      <h2>Schema and data in one change</h2>
      <p>
        A new column often needs values for the rows that already exist. In version 2.23, visit limits started to
        count every click instead of daily unique visitors. <code>043-url-opens.xml</code> has two changesets: the
        first adds an <code>opens</code> column, not null with a default of 0; the second copies each limited link's
        old count into it, so no limited link gained or lost clicks it had left.
      </p>
      <p>
        <code>030-url-short-url-unique-again.xml</code> does the same before a constraint: it renames duplicate
        short URLs, keeping the name for the link that was being served, and only then adds the unique index.
      </p>

      <h2>Changes that may already be done</h2>
      <p>
        Some changesets check first. A precondition with <code>onFail="MARK_RAN"</code> lets Liquibase record a
        changeset as applied when its work is already there, instead of failing startup: 030 skips the unique index
        if one with that name already exists, and 026 drops the old <code>ip_address</code> table only if it's still
        there. One precondition does the opposite: a changeset in 032 halts startup on PostgreSQL older than 15,
        because the next index needs <code>NULLS NOT DISTINCT</code>, which 15 added.
      </p>

      <h2>Rollbacks</h2>
      <p>
        Most changesets declare how to undo them; 043's first changeset drops the column again. A data change that
        can't be undone, such as 043's copy or 026's drop, declares an empty rollback, so it's clear that nothing
        will be restored.
      </p>

      <h2>Two databases, one changelog</h2>
      <p>
        Production runs PostgreSQL; the tests run H2. A changeset that only makes sense on PostgreSQL is marked
        <code>dbms="postgresql"</code>, such as 042's hash index, and where the syntax differs a changeset carries
        one statement for each database.
      </p>

      <h2>Testing a migration</h2>
      <p>
        Schema tests run the whole changelog. A migration that rewrites data gets its own test, which runs a test
        changelog, inserts rows shaped like the old data, applies the migration and checks the result.
        <code>UrlOpensMigrationTest</code>, for example, checks that a limited link starts with its old count as
        <code>opens</code> and every other link at 0.
      </p>
      <p>
        The changelogs are in the
        <a href="https://github.com/HrvaLabs/url-shortener" target="_blank" rel="noopener noreferrer">backend repository</a>.
        <a href="/blog/how-we-built-it">How hrva.cc is built</a> covers the rest of the stack.
      </p>
    `,
  },
  {
    slug: "async-everything",
    title: "Async Work in a URL Shortener: Keeping Redirects Fast",
    shortTitle: "Async Visit Counting That Keeps Redirects Fast",
    date: "2026-05-19",
    updated: "2026-11-01",
    excerpt:
      "What hrva.cc's redirect does before it answers, what it hands to background threads (counting the click, following redirects, sending email), and what never leaves the request.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "performance", "async", "spring"],
    content: `
      <p class="lead">
        A click on a short link has one job that can't wait, sending the visitor on, and several that can: counting
        the click, checking where a new link redirects, sending an email. hrva.cc does the first on the request and
        hands the rest to background threads.
      </p>

      <h2>What the redirect does before it answers</h2>
      <ol>
        <li>Finds the link, in the Redis cache or else in PostgreSQL.</li>
        <li>Checks that it is active, not expired and not over its visit limit. A link with a password goes to its
        password page instead.</li>
        <li>Checks the destination against blocklists.</li>
        <li>For a link with a visit limit, counts the click in PostgreSQL first, with one conditional update, so
        clicks at the same moment can't go past the limit.</li>
        <li>Hands the click to a background thread and answers with a redirect.</li>
      </ol>
      <p>
        For a cached link without a visit limit, none of these steps touches the database.
        <a href="/blog/caching-strategy-deep-dive">The caching post</a> covers the cache.
      </p>

      <h2>Counting clicks in the background</h2>
      <p>
        The day of a click is taken when it arrives; the rest runs on a Spring <code>TaskExecutor</code> thread. That
        thread sorts bots from people, reduces the browser, device, referrer and country to a category, adds to the
        link's daily totals in PostgreSQL, and checks the day's unique-visitor hash in Redis. A failure there is
        logged without the visitor's details and never reaches the visitor.
      </p>
      <p>
        Counts go straight to the database and aren't held in memory, and when a deploy stops the API, it waits up
        to 10 seconds for the clicks still queued. <a href="/blog/link-analytics-guide">The link analytics guide</a>
        lists what is counted.
      </p>

      <h2>Other background work</h2>
      <ul>
        <li>
          <strong>Redirect checks.</strong> After a link is made, a separate pool of two threads follows the
          destination's redirects and checks every address along the way.
        </li>
        <li>
          <strong>Email.</strong> Emails are sent from background threads, tried up to three times, and recorded in
          an email log, where a failed one can be sent again.
        </li>
        <li>
          <strong>Long scheduled jobs.</strong> The destination check, notification deliveries and the click summaries
          run on their own pool, so they never hold up click counting or email.
        </li>
      </ul>

      <h2>What stays on the request</h2>
      <p>
        Anything the answer depends on. Making a link runs the checks that can refuse it before the link is saved.
        The visit-limit count happens before the redirect, because it decides
        whether the visitor gets one. Signing in, and every change to an account, finish before the response.
      </p>

      <h2>Measuring it</h2>
      <p>
        The admin's System tab shows how long redirects take, separately for links served from the cache and from
        the database, and the cache's hit rate.
      </p>
    `,
  },
  {
    slug: "caching-strategy-deep-dive",
    title: "Caching Strategy for a URL Shortener: TTL, Warmup, Priming, and Graceful Degradation",
    shortTitle: "Caching Strategy for a URL Shortener",
    date: "2026-05-19",
    updated: "2026-11-01",
    excerpt:
      "How hrva.cc caches links in Redis: what an entry holds, why it lives for an hour, how every hit is checked again, when entries are evicted, and what happens when Redis or the database is down.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "caching", "redis", "performance"],
    content: `
      <p class="lead">
        Every click on every short link goes through one endpoint, the redirect. hrva.cc keeps the links it serves in
        a Redis cache, so most redirects answer without asking PostgreSQL. This post covers how that cache is laid
        out, kept correct, and what happens when it fails.
      </p>

      <h2>Cache layout</h2>
      <p>
        There is one cache, <code>urls</code>. Its key is the link's alias, or the custom domain's id and the alias
        for a link on a custom domain. The value is the link as the API describes it: the destination, whether it is
        active, its expiration date, its visit limit and the clicks used, whether it has a password, and whether it
        opens the warning page first.
      </p>

      <h2>TTL: one hour</h2>
      <p>
        An entry expires an hour after it is written. Changes evict entries straight away, so the hour only matters
        if an eviction is missed: it bounds how long a stale entry can outlive the change.
      </p>

      <h2>Every hit is checked again</h2>
      <p>
        A cached entry is never trusted blindly. On every hit, the redirect checks that the link is active, not past
        its expiration date and not over its visit limit. If any check fails, the entry is evicted and the link is
        read from the database. The click is also checked against blocklists, and a link with a visit limit still
        counts its click in PostgreSQL before the visitor is sent on. A hit on a link without a visit limit opens no
        database transaction at all.
      </p>

      <h2>Warmup and priming</h2>
      <p>
        When the API starts, it loads three sets of active links into the cache: the 20 most visited, the 20 newest
        and the 20 opened most recently. A new link is cached as soon as it is made, so its first visitor already
        gets a cache hit. A miss reads the link in a read-only transaction and caches it.
      </p>

      <h2>Eviction</h2>
      <ul>
        <li>Turning a link off or on, or editing it, evicts its entry.</li>
        <li>Deleting a link clears the whole cache, since deletes are rare.</li>
        <li>When the click that uses up a visit limit goes through, the entry is evicted.</li>
        <li>
          When a link is blocked, its entry is evicted once the block is saved, and again shortly after, so a click
          that read the link just before can't put the old answer back.
        </li>
        <li>
          Expired links aren't evicted by the job that turns them off. Their entries fail the expiry check on the next
          hit instead.
        </li>
      </ul>

      <h2>Graceful degradation</h2>
      <p>
        The cache is not a hard dependency. A custom <code>CacheErrorHandler</code> logs every failed cache read, write
        and eviction and lets the request carry on, so with Redis down, redirects read links from the database.
        While its connection is down, the Redis client refuses commands at once instead of waiting for a timeout.
      </p>
      <p>
        The other way round also works: with PostgreSQL unreachable, cached links keep redirecting, except links with
        a visit limit, which need the database to count the click.
      </p>

      <h2>What isn't cached</h2>
      <p>
        The redirects themselves. Cloudflare never caches them, so every click reaches the API and is counted.
      </p>

      <h2>Watching it</h2>
      <p>
        Cache statistics are on, and the admin's System tab shows the cache's hits, misses and hit rate, and how long
        redirects take from the cache and from the database.
        <a href="/blog/how-we-built-it">How hrva.cc is built</a> puts this in context with the rest of the API.
      </p>
    `,
  },
  {
    slug: "safe-browsing-at-scale",
    title: "Google Safe Browsing in a URL Shortener: When Links Are Checked",
    shortTitle: "Google Safe Browsing: When Links Are Checked",
    date: "2026-05-20",
    updated: "2026-11-01",
    excerpt:
      "When hrva.cc asks Google Safe Browsing about a link, what it sends, and what happens to a link that Safe Browsing marks as harmful, when it's made and later.",
    author: "Karlo Hrvačić",
    tags: ["security", "safe browsing", "automation", "google"],
    content: `
      <p class="lead">
        Google Safe Browsing is a list Google keeps of sites known for phishing, malware and unwanted software.
        hrva.cc asks it about links at several points in their life, not only when they are made. This post covers
        when it asks, what it sends, and what happens when the answer is yes.
      </p>

      <h2>Why once isn't enough</h2>
      <p>
        A destination that is clean today can be harmful tomorrow: a site gets hacked, or a page is replaced with a
        scam after the link has been shared. A list holds a site only once it is known to be harmful, so the check
        when the link is made is only the first one.
      </p>

      <h2>When hrva.cc asks</h2>
      <ul>
        <li>
          <strong>When a link is made</strong>, or its destination is changed, before it is saved.
        </li>
        <li>
          <strong>Where it redirects.</strong> After a link is made, hrva.cc follows the destination's redirects and
          asks about every address along the way.
        </li>
        <li>
          <strong>While the link is active.</strong> Active links are checked again, so a site that turns harmful
          later is still caught.
        </li>
        <li>
          <strong>For a custom domain.</strong> The address of a domain someone applies for is checked too.
        </li>
      </ul>
      <p>
        Safe Browsing is one check among several. The <a href="/security">security page</a> lists the others, such
        as the blocklists every click is checked against.
      </p>

      <h2>What it sends</h2>
      <p>
        hrva.cc uses the Safe Browsing API's URL search (version 5) and sends only the addresses: the destination,
        and the addresses it redirects to. Nothing about the person who made the link or the people who open it is
        sent. Google's terms are in its
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
      </p>

      <h2>When a link is made</h2>
      <p>
        If Safe Browsing marks the destination as harmful, the link is never created. The form, the API and the MCP
        connector get the same answer: "This URL was flagged as unsafe and cannot be shortened".
      </p>

      <h2>When a live link is found</h2>
      <ul>
        <li>The link is blocked and turned off, with Safe Browsing recorded as the reason.</li>
        <li>Its cache entry is removed, so the next click doesn't open the old destination.</li>
        <li>
          Visitors see a hrva.cc page instead: "hrva.cc disabled this link because it led to a site reported for
          phishing, malware or scams."
        </li>
        <li>
          Its owner can't turn it back on. Only an admin can, and doing so clears the block.
        </li>
      </ul>

      <h2>What it can't catch</h2>
      <p>
        A list can miss a site that is not yet known to be harmful, such as a scam on a domain registered the same
        day.
        <a href="/blog/how-hrva-cc-stops-phishing-links">How hrva.cc stops phishing links</a> covers the checks for
        those, and <a href="/blog/safe-browsing-link-sharing">Why Safe Browsing matters for link sharing</a> covers
        what you can do as a visitor.
      </p>
    `,
  },
  {
    slug: "building-audit-log",
    title: "Building an Audit Log with Spring AOP: From a Pointcut List to Annotations",
    shortTitle: "Building an Audit Log with Spring AOP",
    date: "2026-05-20",
    updated: "2026-11-01",
    excerpt:
      "How hrva.cc records admin actions and sign-in method changes: a Spring AOP aspect around annotated controller methods, typed actions with a failed flag, what goes into an entry, and what stays out.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "audit", "spring", "aop"],
    content: `
      <p class="lead">
        hrva.cc keeps an audit log of admin actions and of changes to sign-in methods. Most entries are written by a
        Spring AOP aspect, so a controller method can't forget to log itself. This post covers how the aspect
        started, what it became, and what goes into an entry.
      </p>

      <h2>What the log is for</h2>
      <p>
        Links and accounts change for several reasons: their owner, an admin, or a scheduled job. The audit log
        answers which admin did what, and when. It also records when someone turns Google or GitHub sign-in off or
        back on for their own account, or removes their password. Sign-ins are not in it.
      </p>

      <h2>The first version: a list of methods</h2>
      <p>
        The log arrived in May 2026 as one <code>@Around</code> advice whose pointcut listed seven controller methods
        by name, such as <code>UrlController.revokeUrl</code> and <code>UserController.deleteUser</code>. The action
        was the method's name as text, with <code>_FAILED</code> added when the method threw. Every new admin endpoint
        meant another line in that expression, and a missed line meant an action that was never recorded.
      </p>

      <h2>Now: an annotation and a typed action</h2>
      <p>
        Since October 2026 the pointcut is <code>@annotation(audited)</code>. A method is audited when it carries
        <code>@Audited</code>, and the annotation must name an <code>AuditAction</code>, an enum stored by name, so a
        method can't be audited without one. A test lists every audited method with its action, so adding or removing
        one fails the build until the test is updated.
      </p>
      <p>
        Whether an action failed became its own column. A migration rewrote the old rows: each method name became its
        constant, a <code>_FAILED</code> suffix became the failed flag, and anything it couldn't match became
        <code>UNKNOWN</code>, with the old text copied into the details where they were empty.
      </p>

      <h2>What an entry holds</h2>
      <ul>
        <li>the email address of whoever did it, the action, and whether it failed</li>
        <li>
          the target: its type, taken from the controller's name, and its id, from the method's first argument or
          from the response for something just created
        </li>
        <li>
          the details: only the fields the request actually sent, in alphabetical order. A password is written as
          "changed" or "removed", never its value, and a blocklist's address is left out
        </li>
        <li>when it happened</li>
      </ul>
      <p>
        A failed action keeps the error's message as its details. A request refused by validation never reaches the
        method, so it isn't logged.
      </p>

      <h2>When the aspect can't see enough</h2>
      <p>
        Some actions work on something the controller's arguments don't describe, such as blocking a domain or
        removing a reserved alias, which is gone once removed. The services behind them write their own entries,
        after their transaction ends, so the entry for a failure survives the rollback.
      </p>

      <h2>Who sees it, and for how long</h2>
      <p>
        The admin pages show the log with search and a filter by action; admin pages need two-step sign-in. Entries
        are deleted automatically after 12 months. The <a href="/privacy">privacy policy</a> lists the audit log with
        everything else hrva.cc keeps, and the <a href="/security">security page</a> lists it with the other account
        protections.
      </p>
    `,
  },
  {
    slug: "angular-to-react-rewrite",
    title: "Rewriting an Angular App in React and Next.js",
    date: "2026-05-20",
    updated: "2026-11-01",
    excerpt:
      "hrva.cc's web app was an Angular 14 app until May 2026. What it was, what the Next.js rewrite replaced, how it shipped alongside a reworked API, and what has changed since.",
    author: "Karlo Hrvačić",
    tags: ["engineering", "rewrite", "react", "nextjs", "angular"],
    content: `
      <p class="lead">
        hrva.cc's web app was first written in Angular. In May 2026 it was rewritten in React with Next.js. This
        post covers what the old app was, what replaced it, and how the change shipped. Every
        date here comes from the
        <a href="https://github.com/HrvaLabs/URL-Shortener-FE" target="_blank" rel="noopener noreferrer">web app's repository</a>.
      </p>

      <h2>The Angular app</h2>
      <p>
        The repository started in February 2022. By 2026 the app ran on Angular 14 with Angular Material components
        and RxJS, and its last change before the rewrite was in May 2024. Its README built it with
        <code>ng build</code> into a folder of static files, and its production settings pointed it at the API on
        hrva.cc.
      </p>

      <h2>Why rewrite</h2>
      <p>
        A design document dated May 13, 2026 set out the rewrite. It gives the reason in one line: the Angular app
        "is fully functional but uses outdated tooling". The document then listed every route the new app needed
        and every API call it had to make.
      </p>

      <h2>What replaced what</h2>
      <ul>
        <li>Angular and its modules became Next.js with the App Router and React.</li>
        <li>Angular Material became Radix UI primitives styled with Tailwind CSS.</li>
        <li>RxJS services for server data became TanStack Query.</li>
        <li>Forms moved to React Hook Form with Zod schemas.</li>
        <li>
          Static files became a Cloudflare Worker built with OpenNext, and public pages are prerendered when the
          site is built.
        </li>
      </ul>

      <h2>How it shipped</h2>
      <p>
        The new app landed in one commit on May 13, 2026, the Cloudflare Workers build was added the next day, and
        the Angular files were removed on May 16. The API changed in the same week: its build moved from Gradle to
        Maven on May 13, and on May 16 its endpoints moved to plural resource paths, such as
        <code>/api/v1/urls/{short}/peek</code> instead of <code>/api/v1/url/peek/{short}</code>.
      </p>

      <h2>What changed since</h2>
      <p>
        Bio pages, custom domains, notifications, passkeys, the MCP connector and this blog were all built on the
        rewrite. Since then the app has moved to Tailwind CSS 4, and it now sends a
        content security policy with every page and reloads once when an open tab can't load a file from an older
        build. It is open source under the GPL-3.0 licence.
        <a href="/blog/how-we-built-it">How hrva.cc is built</a> describes the whole stack as it is today.
      </p>
    `,
  },
  {
    slug: "designing-url-shortener-ui",
    title: "Designing a URL Shortener UI for Visitors and Account Holders",
    shortTitle: "Designing a URL Shortener UI",
    date: "2026-05-21",
    updated: "2026-11-01",
    excerpt:
      "How hrva.cc's interface serves someone who wants one short link and someone who manages many: one form that grows with an account, what the result shows, and how the links page is built.",
    author: "Karlo Hrvačić",
    tags: ["design", "ux", "ui", "product"],
    content: `
      <p class="lead">
        A URL shortener has two kinds of user: someone who wants one short link now, and someone who makes links
        every week and wants aliases, limits and stats. hrva.cc gives both the same form and lets it grow with an
        account. This post covers how that works and the decisions behind it.
      </p>

      <h2>Without an account: one field, one button</h2>
      <p>
        The home page opens with an address field and a <strong>Shorten</strong> button. While links can be made
        without an account and sign-ups are open, a line under them says no account is needed and what signing up
        adds: custom aliases, visit limits, expiry dates and analytics. The
        form doesn't show those fields to a visitor without an account, since only an account can use them.
      </p>
      <p>
        When hrva.cc sets an end date or a visit limit for links made without an account, a line under the form says
        so before you shorten. When making links without an account is paused, a notice says so above the form, and
        the field and button stay visible but can't be used.
      </p>

      <h2>The human check stays out of the way</h2>
      <p>
        When the human check is on, it starts only once you focus or type in the form, never when the page opens.
        Usually you see nothing; sometimes a box to tick appears under the field.
      </p>

      <h2>The result</h2>
      <p>
        After shortening, the result shows the short link and the full destination, wrapped rather than cut off, with
        a <strong>Copy</strong> button and a button that opens the destination. Keyboard focus moves to
        <strong>Copy</strong>, so the next key press can copy the link. On wider screens a QR code is shown next to
        it. For a link made without an account, a note says when it stops working, if hrva.cc set an end, and
        whether it opens a warning page first.
      </p>

      <h2>With an account: the same form, more fields</h2>
      <p>
        Signed in, the home page shows the same form with its options always visible: a custom alias (with a
        custom domain picker if you have one), a visit limit with the hint "Every click counts, not counting bots.",
        and an expiry date. Campaign (UTM) tags sit in a section below that you can open. Your six newest links are
        listed beside the form, or under it on narrow screens.
      </p>

      <h2>The links page</h2>
      <p>
        The dashboard lists every link in a table you can search, filter by status or tag, narrow to expired links,
        and sort by visits, creation date or expiry date, with 10 to 100 links per page. Each row shows the short link,
        "3 of 5 clicks used" when it has a visit limit, and a badge when the destination looks dead; on wider screens
        it also shows the destination in full and the link's tags. Its actions are copy, view stats, open the destination, show the QR code, turn off or
        back on, and delete.
      </p>
      <p>
        Sortable column headers tell screen readers which way they are sorted, and actions that can't be undone, such
        as deleting a link, ask first.
      </p>

      <h2>What changed since May</h2>
      <p>
        The first version of the rewrite had a "Show advanced options" toggle on the home page that revealed alias,
        visit limit and expiry fields even to visitors without an account. It was removed in May 2026, three days
        after the rewrite landed, in favour of the layout above.
        <a href="/blog/angular-to-react-rewrite">Rewriting an Angular app in React and Next.js</a> covers the rewrite
        itself.
      </p>
    `,
  },
  {
    slug: "open-source-url-shortener",
    title: "Open Source URL Shortener: What's Public and How to Run It",
    date: "2026-05-21",
    updated: "2026-11-01",
    excerpt:
      "Both parts of hrva.cc are open source under the GPL-3.0 licence. What's in the two repositories, what the licence allows, how the code is checked in public, and what running your own copy takes.",
    author: "Karlo Hrvačić",
    tags: ["open source", "community", "self-hosting", "business"],
    content: `
      <p class="lead">
        hrva.cc is open source: the API and the web app are public on GitHub under the GPL-3.0 licence. This post
        covers what's in the two repositories, what the licence allows, what being public lets you check, and what
        running your own copy takes.
      </p>

      <h2>The two repositories</h2>
      <ul>
        <li>
          <a href="https://github.com/HrvaLabs/url-shortener" target="_blank" rel="noopener noreferrer">The API</a>:
          Java 25 and Spring Boot 4.1, with PostgreSQL (changed through Liquibase migrations) and Redis. It serves
          the short links themselves, the REST API and the MCP connector. Its licence is GPL-3.0.
        </li>
        <li>
          <a href="https://github.com/HrvaLabs/URL-Shortener-FE" target="_blank" rel="noopener noreferrer">The web app</a>:
          Next.js 16 and React 19, deployed on Cloudflare Workers. It is everything at app.hrva.cc, this blog
          included. Its licence is GPL-3.0 too.
        </li>
      </ul>

      <h2>What the licence allows</h2>
      <p>
        GPL-3.0 lets anyone run, study, change and share the code. Whoever distributes a changed version has to share
        its source under the same licence. The full terms are in each repository's <code>LICENSE</code> file.
      </p>

      <h2>What you can check</h2>
      <p>
        The privacy policy and the <a href="/security">security page</a> describe what hrva.cc does with data and
        what it checks; with the code public, those statements can be compared with the code.
        <a href="/privacy-first-url-shortener#check-it">URL shortener without tracking</a> links straight to the
        lines that hash visitors for the unique-visitor count. The <a href="/changelog">changelog</a> lists every
        user-facing change, and it lives in the API's repository next to the code it describes.
      </p>

      <h2>How the code is checked</h2>
      <ul>
        <li>The API is built and tested with Maven on every push and pull request to <code>main</code>.</li>
        <li>The web app is type-checked, linted, checked and built on every push and pull request.</li>
        <li>GitHub CodeQL scans both repositories on every change and every week.</li>
        <li>Dependabot proposes dependency updates for both, and OSV-Scanner checks the API's dependencies for known
        vulnerabilities.</li>
      </ul>

      <h2>Running your own copy</h2>
      <p>
        The API's README has the short version: start PostgreSQL and Redis with the Docker Compose file in
        <code>docker/</code>, then run the app with Maven and the <code>local</code> profile. A push to
        <code>main</code> also builds a Docker image for amd64 and arm64. For production, the README lists what the
        API needs:
      </p>
      <ul>
        <li>PostgreSQL 15 or newer and Redis 6.2 or newer</li>
        <li>two keys it won't start without: one that signs MCP access tokens and one that encrypts notification channels</li>
        <li>an origin that accepts traffic only from Cloudflare, because the per-network rate limits and country counts read Cloudflare's headers</li>
      </ul>
      <p>
        The human check and custom domains need Cloudflare keys of their own; without them the API still starts, with
        no human check and no custom domain approvals. The web app deploys to Cloudflare Workers with
        <code>npm run deploy</code>.
      </p>

      <h2>Questions and reports</h2>
      <p>
        Questions, bugs and feature requests go to GitHub issues. Security problems don't belong in a public issue:
        write to <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a>, as the
        <a href="/security#report">security page</a> describes.
      </p>
    `,
  },
]

export const featuredPosts = blogPosts.slice(0, 3)
