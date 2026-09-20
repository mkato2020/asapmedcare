# ASAP MedCare Uganda Limited — website

Single-page, production-ready marketing site. No build step, no dependencies, no framework.

```
index.html              markup + inline SVG icon sprite and hero artwork
assets/css/styles.css   design tokens and all page styles
assets/js/main.js       nav, scroll reveal, scrollspy, form validation
assets/img/logo-mark.svg
favicon.svg
```

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. To deploy, upload the directory as-is to any static host.

## Brand tokens

Defined at the top of `assets/css/styles.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--navy-900` | `#091A2C` | Contact band, footer |
| `--navy-700` | `#0F2A47` | Headings, primary buttons |
| `--teal-500` | `#14B8A6` | Accent, CTAs on dark grounds |
| `--teal-700` | `#0E8C7F` | Accent on light grounds (large text only) |
| `--teal-ink` | `#0B7568` | Small uppercase labels — AA-compliant on all light grounds |
| `--off-white` | `#FAFAF7` | Page ground |
| `--sand` | `#F1EFE9` | Alternating tile and section ground |

Headings use Space Grotesk, body text uses Inter, loaded from Google Fonts with a system fallback stack.

`--teal-ink` exists because `--teal-700` measures 3.6–4.1:1 at label sizes, below the WCAG AA 4.5:1
threshold for small text. Use it for anything small and uppercase; keep `--teal-700` for large display text.

## Before going live

1. **Enquiry form — already wired to Netlify Forms.** The form is declared with
   `data-netlify="true"` and a hidden honeypot; `assets/js/main.js` validates, then POSTs it
   back to the page, which Netlify intercepts at the edge. No backend or API key needed.
   Submissions appear in the Netlify dashboard — turn on email notifications there so they
   reach a person. If the POST fails, the form keeps the user's text and offers a mailto
   fallback rather than losing the enquiry.
2. **Contacts are live.** Telephone and WhatsApp are `+256 743 577 838`; registered address is
   Plot 2026, Block 122, Kasangati, Wakiso.
   Email addresses are live and routed by department:
   `sales@` (partnerships & supply, also the address in the contact band), `admin@` (general),
   `accounts@` (billing). `charles@` is deliberately not published — it is a personal mailbox.
   These need the `asapmedcare.co.ug` domain registered and mail hosting configured before they
   will receive anything.
3. **Add the NDA registration number.** The footer currently reads "details available on request".
4. Optionally swap the abstract hero composition (inline SVG in `index.html`) for commissioned
   photography — it is a single `<svg class="hero-art">` block.

## Accessibility

Skip link; landmark elements; visible focus rings on every interactive element; `aria-expanded` on
the mobile nav with Escape-to-close; form errors linked via `aria-describedby` and `aria-invalid`,
with focus moved to the first invalid field; live region for submit status; full
`prefers-reduced-motion` fallback. All text pairs measure at or above 4.8:1.

Verified in-browser at 375px and 1280px: no horizontal overflow at either width.
