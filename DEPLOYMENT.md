# ASAP MedCare — deployment runbook

Final architecture, in the order it must be executed.

## The stack

| Layer | Provider | Cost | Why |
| --- | --- | --- | --- |
| Domain `asapmedcare.co.ug` | Truehost | $29.99/yr | Registered 20 Sept 2026 |
| DNS | Cloudflare | Free | Truehost's bundled DNS returned SERVFAIL — no zone was ever created |
| Site | Netlify | Free | Already have it; `netlify.toml` is committed |
| Email (1 mailbox + 3 aliases) | Zoho Mail Lite | ~$12/yr | Free tier is webmail-only — unusable on a phone |

**≈ $29.99/yr + ~$12/yr for email.**

No hosting plan was bought — the site lives on Netlify's free tier. Truehost provides
the domain and its bundled DNS only.

**Migrating to Cloudflare later** (for DNS-level reliability and API automation) is a
10-minute job with no downtime: add the domain to Cloudflare, recreate these two records,
then switch nameservers. Nothing in the site assumes either provider.

## Order of operations

Nameservers stay at Truehost, so there is no long propagation wait. The whole sequence
is a single sitting.

### 1. Register the domain — Truehost ✅ DONE
- `asapmedcare.co.ug` registered 20 Sept 2026, renews **20 Sept 2027**.
- Set a personal calendar reminder for mid-July 2027. Do not rely on registrar email —
  a Gmail filter was already routing Truehost mail to Trash.

### 2. Deploy the site — Netlify via GitHub

Continuous deployment: every push to `main` redeploys. Netlify keeps every previous
deploy, so rollback is one click.

1. Create an **empty** repo on github.com (no README, no .gitignore — this repo
   already has both). Private is the sensible default.
2. Connect and push:
   ```
   git remote add origin https://github.com/<you>/asapmedcare.git
   git push -u origin main
   ```
3. app.netlify.com → **Add new site → Import an existing project → GitHub**,
   authorise, pick the repo.
4. Build settings — Netlify reads `netlify.toml`, so leave them alone:
   - Build command: *(empty)*
   - Publish directory: `.`
5. Deploy. Note the generated `<site>.netlify.app` address — step 3 needs it.

**Deploying changes afterwards** is just `git push`. Netlify rebuilds in seconds.
Pull requests get their own preview URL automatically, so changes can be reviewed on a
real URL before they reach the live site.

### 3. DNS — Cloudflare

Truehost activated the domain but never created a DNS zone on its nameservers, so the
domain resolved SERVFAIL (delegated, but nothing answering). Cloudflare creates a real
zone immediately. Truehost remains the registrar; only DNS moves.

1. dash.cloudflare.com → **Add a site** → `asapmedcare.co.ug` → **Free** plan.
2. Copy the two nameservers Cloudflare issues.
3. Truehost → **Domains → asapmedcare.co.ug → Nameservers** → custom → paste both.
4. Add the records below in Cloudflare.

| Type | Name | Content | Proxy | Priority |
| --- | --- | --- | --- | --- |
| CNAME | `www` | `asapmedcare.netlify.app` | **DNS only** | — |
| CNAME | `@` | `apex-loadbalancer.netlify.com` | **DNS only** | — |
| TXT | `@` | `zoho-verification=zb71272922.zmverify.zoho.com` | — | — |
| MX | `@` | `mx.zoho.com` | — | 10 |
| MX | `@` | `mx2.zoho.com` | — | 20 |
| MX | `@` | `mx3.zoho.com` | — | 50 |
| TXT | `@` | `v=spf1 include:zoho.com ~all` | — | — |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:charles@asapmedcare.co.ug` | — | — |

Plus the DKIM TXT that Zoho generates later (Admin Console → Email Configuration → DKIM).

**The proxy must be OFF (grey cloud) on both Netlify records.** Cloudflare defaults new
A/CNAME records to proxied (orange). Proxying in front of Netlify breaks Let's Encrypt
provisioning and stacks two CDNs. Cloudflare is doing DNS here, not proxying.

Cloudflare flattens the apex CNAME automatically, so no hardcoded IP is needed. If it
rejects the apex CNAME, fall back to `A @ → 75.2.60.5`.

### 4. Custom domain — Netlify
- Domain management → add `www.asapmedcare.co.ug` and set it as the **primary** domain.
- Add the apex; Netlify redirects it to `www`.
- Netlify recommends `www` as primary on external DNS — apex records miss full CDN routing.
- SSL provisions automatically via Let's Encrypt once DNS resolves. Nothing to configure.

### 5. Email — Zoho
- Add the domain, verify with the TXT record Zoho supplies.
- Create **one user**: `charles@asapmedcare.co.ug`. That is the only billed seat.
- Add `sales@`, `admin@` and `accounts@` as **aliases** on that user, not as users.
  Aliases are free and unlimited; they deliver into the same inbox.
- Enable send-as on the aliases so replies to an enquiry go out from `sales@`,
  not from `charles@`.
- Set up filters so mail to each alias auto-labels — invoices to `accounts@` stay
  separate from enquiries to `sales@` without needing separate accounts.
- Add to Cloudflare DNS: Zoho's **MX** records, plus **SPF**, **DKIM** and **DMARC**.
  Do not skip the last three — without them, mail to Gmail lands in spam.

**Converting an alias later:** when someone is hired to run sales, delete the alias and
create `sales@` as a real user. Nothing printed, published or indexed has to change.

### 6. Verify
- `https://www.asapmedcare.co.ug` loads over HTTPS.
- Apex redirects to `www`.
- Send a test message to a Gmail address and confirm it reaches the inbox, not spam.
- Check the security headers land: `curl -sI https://www.asapmedcare.co.ug | grep -i content-security`

## Still outstanding

Placeholders in `index.html` that need real values before launch:
- ~~Telephone and WhatsApp~~ — done: `+256 743 577 838`
- ~~Registered address~~ — done: Plot 2026, Block 122, Kasangati, Wakiso
- **NDA registration number** in the footer — still outstanding, the last placeholder
## Enquiry form — done

Wired to Netlify Forms. Nothing to configure at deploy time: Netlify parses the form out of
the HTML on first deploy. After that, in the Netlify dashboard go to **Forms → enquiry →
Notifications** and add an email notification to `sales@asapmedcare.co.ug`, otherwise
submissions sit in the dashboard unread.

The form will only work once deployed to Netlify. Opened from disk or another host the POST
fails, and the page falls back to offering the sales mailto — deliberately, so an enquiry is
never silently lost.
