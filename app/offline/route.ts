export const dynamic = "force-static"

const OFFLINE_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b">
<title>You're offline &mdash; hrva.cc</title>
<style>
:root{--background:#ffffff;--foreground:#0e0e11;--muted:#67676f;--primary:#0e0e11;--on-primary:#ffffff;--brand:#2251ff}
@media (prefers-color-scheme:dark){:root{--background:#09090b;--foreground:#f5f5f5;--muted:#a1a1aa;--primary:#f5f5f5;--on-primary:#131316;--brand:#708fff}}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;background:var(--background);color:var(--foreground);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:28rem;text-align:center}
svg{display:block;margin:0 auto 24px}
.mark{fill:var(--foreground)}
.bar{fill:var(--background)}
.dot{fill:var(--brand)}
h1{margin:0;font-size:1.5rem;line-height:2rem;font-weight:650;letter-spacing:-0.02em}
p{margin:8px 0 0;color:var(--muted);line-height:1.5rem}
button{margin-top:24px;height:44px;padding:0 20px;border:0;border-radius:10px;background:var(--primary);color:var(--on-primary);font:inherit;font-weight:500;cursor:pointer}
button:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
</style>
</head>
<body>
<main>
<svg width="40" height="40" viewBox="0 0 32 32" aria-hidden="true"><rect class="mark" width="32" height="32" rx="8"/><rect class="bar" x="8" y="10.5" width="16" height="3.5" rx="1.75"/><rect class="bar" x="8" y="18" width="7.5" height="3.5" rx="1.75"/><circle class="dot" cx="21.25" cy="19.75" r="2.25"/></svg>
<h1>You're offline.</h1>
<p>hrva.cc needs a connection to make and open links.</p>
<button type="button" onclick="location.reload()">Try again</button>
</main>
</body>
</html>
`

export function GET() {
  return new Response(OFFLINE_PAGE, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
