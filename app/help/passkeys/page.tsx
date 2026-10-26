import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const description =
  "How to add a passkey or security key to hrva.cc, sign in with it, use it as your second step, and what to do if you lose one."

export const metadata: Metadata = {
  title: "Passkeys and security keys",
  description,
  alternates: { canonical: "https://app.hrva.cc/help/passkeys" },
  openGraph: {
    url: "https://app.hrva.cc/help/passkeys",
    title: "Passkeys and security keys — hrva.cc",
    description,
  },
}

export default function PasskeysHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Passkeys and security keys</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: add a passkey in Settings, then sign in with your fingerprint, face, screen lock
                or security key instead of your password. A passkey can also be your second step after
                your password, Google or GitHub sign-in.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="what-passkeys-are">What passkeys are</h2>
              <p>
                A passkey replaces your password with your device&apos;s screen lock, fingerprint or
                face, or with a security key. It is made for hrva.cc only, so it can&apos;t be phished.
                A passkey can live on your phone or computer, in a password manager, or on a hardware
                key.
              </p>

              <h2 id="add-a-passkey">Add a passkey or security key</h2>
              <ol>
                <li>
                  Sign in and open <strong>Dashboard → Settings</strong>.
                </li>
                <li>
                  Under <strong>Passkeys and security keys</strong>, select{" "}
                  <strong>Add a passkey or security key</strong>.
                </li>
                <li>
                  Enter a <strong>Name</strong>, for example <code>MacBook</code>, <code>iPhone</code> or{" "}
                  <code>YubiKey</code>. If you leave it empty, it&apos;s called <code>Passkey</code>.
                  If you sign in with a password, also enter your <strong>Current password</strong>. If you
                  sign in with Google or GitHub and your last sign-in was more than 15 minutes ago, you&apos;ll
                  be asked to sign in again first. Select <strong>Continue</strong>. It reads{" "}
                  <strong>Waiting for your passkey…</strong> while the prompt is open.
                </li>
                <li>Choose where to save it in the prompt that opens. The four places are below.</li>
              </ol>

              <h3>On this phone or computer</h3>
              <p>This covers iCloud Keychain, Google Password Manager and Windows Hello.</p>
              <ol>
                <li>Choose this phone or computer in the prompt.</li>
                <li>Confirm with your fingerprint, face or device PIN.</li>
              </ol>

              <h3>In a password manager</h3>
              <p>This covers password managers such as Bitwarden, Proton Pass and 1Password.</p>
              <ol>
                <li>The password manager&apos;s extension shows its own prompt. Choose to save the passkey there.</li>
                <li>
                  If the browser&apos;s prompt opens instead, pick the password manager, or the
                  &quot;another device&quot; option.
                </li>
              </ol>

              <h3>On your phone, from a computer</h3>
              <ol>
                <li>Choose the phone or QR code option.</li>
                <li>Scan the code with your phone&apos;s camera.</li>
                <li>Confirm on the phone.</li>
              </ol>

              <h3>On a security key (YubiKey)</h3>
              <ol>
                <li>Plug the key into USB or Lightning, or hold it to your phone for NFC.</li>
                <li>Enter the key&apos;s PIN if asked.</li>
                <li>Touch the key.</li>
              </ol>
              <p>
                An older key, or one whose passkey storage is full, is added as{" "}
                <strong>Security key (second step only)</strong>. It works after your password, but it
                can&apos;t sign you in on its own.
              </p>

              <ol start={5}>
                <li>
                  You&apos;ll get an email, &quot;A passkey was added to your account&quot;. If you
                  didn&apos;t add it, remove it in Settings, then change your password, or secure your
                  Google or GitHub account if you sign in with one.
                </li>
              </ol>

              <h3>What the labels in Settings mean</h3>
              <ul>
                <li>
                  <strong>Synced passkey</strong>: works on your devices that share this password manager or
                  account.
                </li>
                <li>
                  <strong>Device-bound passkey</strong>: only on this device or key.
                </li>
                <li>
                  <strong>Security key (second step only)</strong>: use it after your password; it can&apos;t
                  sign you in alone.
                </li>
                <li>
                  <strong>Passkey or security key</strong>: try <strong>Sign in with a passkey</strong>. If it
                  isn&apos;t offered, use it after your password.
                </li>
              </ul>

              <h2 id="sign-in">Sign in with a passkey</h2>
              <ol>
                <li>
                  On the sign-in page, select <strong>Sign in with a passkey</strong>, or select the{" "}
                  <strong>Email</strong> field and pick your passkey from the suggestions.
                </li>
                <li>Confirm on your device, or touch your security key.</li>
              </ol>
              <p>
                A passkey sign-in counts as two-step verification on its own, so no second step follows.
                A <strong>Security key (second step only)</strong> can&apos;t be used here: sign in with your
                password, then use the key at the second step.
              </p>

              <h2 id="two-step">Two-step verification with passkeys</h2>
              <ol>
                <li>Add at least one passkey or security key.</li>
                <li>
                  In <strong>Settings → Two-step verification</strong>, select{" "}
                  <strong>Turn on with my passkeys</strong>.
                </li>
                <li>
                  Save the 10 recovery codes: select <strong>Copy codes</strong> or{" "}
                  <strong>Download (.txt)</strong> and keep them somewhere safe, such as your password
                  manager. Tick <strong>I&apos;ve saved these codes</strong>, then select{" "}
                  <strong>I&apos;ve saved them</strong>.
                </li>
              </ol>
              <p>
                Settings then shows <strong>Your second step</strong>: how many passkeys or security keys
                you have, and whether an authenticator app is set up. You can add an authenticator app as
                well with <strong>Set up an authenticator app</strong>. If two-step verification is off,
                setting one up also turns it on.
              </p>
              <p>
                From then on, after your password, Google or GitHub sign-in, the{" "}
                <strong>Two-step verification</strong> screen asks for one of these:
              </p>
              <ul>
                <li>
                  <strong>Use a passkey or security key</strong>. It reads{" "}
                  <strong>Waiting for your passkey…</strong> while the prompt is open.
                </li>
                <li>
                  Under <strong>or enter a code</strong>, a code from your authenticator app or a recovery
                  code, then <strong>Verify &amp; sign in</strong>.
                </li>
              </ul>
              <p>
                <strong>Use a different account</strong> takes you back to the sign-in form with your email
                filled in. After a Google or GitHub sign-in, <strong>Back to sign in</strong> returns to the
                sign-in page. <strong>Lost your passkey or codes?</strong> opens this guide at{" "}
                <a href="#lost-device">If you lose a device or security key</a> in a new tab.
              </p>

              <h2 id="recovery-codes">Recovery codes</h2>
              <p>
                You see the 10 recovery codes once, when you turn two-step verification on.{" "}
                <strong>Copy codes</strong> copies all of them, and <strong>Download (.txt)</strong> saves
                them as <code>hrva-cc-recovery-codes.txt</code>. Keep them outside hrva.cc, for example in
                your password manager or on paper.
              </p>
              <p>
                Each recovery code works once, in the <strong>Authenticator code</strong> or{" "}
                <strong>Recovery code</strong> field of the second step. Upper or lower case, spaces and the
                dash don&apos;t matter.
              </p>
              <p>
                Settings shows how many are left. With 2 or fewer it says{" "}
                <strong>Running low on recovery codes</strong>, and with none{" "}
                <strong>No recovery codes left</strong>. To get 10 new ones, turn two-step verification off
                and on again. Turning it off deletes the old ones.
              </p>

              <h2 id="lost-device">If you lose a device or security key</h2>
              <ol>
                <li>Sign in with another passkey, your authenticator app or a recovery code.</li>
                <li>
                  In <strong>Settings → Passkeys and security keys</strong>, select <strong>Remove</strong>{" "}
                  next to the lost one. If you sign in with Google or GitHub and your last sign-in was more
                  than 15 minutes ago, you&apos;ll be asked to sign in again first. If it&apos;s your only
                  two-step method, turn off two-step verification first, or add another passkey, security
                  key or authenticator app.
                </li>
                <li>Turning two-step verification off needs one of those as well.</li>
              </ol>
              <p>
                If you have none of them, email{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a> from your account&apos;s
                address. Removing a passkey on hrva.cc doesn&apos;t delete it from your device or password
                manager, so delete it there too.
              </p>

              <h2 id="privacy">Passkeys and your privacy</h2>
              <p>
                hrva.cc stores the passkey&apos;s public key and a few details, such as its name, when it
                was added and last used, and whether it&apos;s synced. Your fingerprint, face and PIN never
                leave your device. The <Link href="/privacy">Privacy Policy</Link> describes everything
                hrva.cc stores.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
