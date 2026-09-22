# DwelLogs.com — marketing site

Project rules for the public site. The parent `CLAUDE.md` (how we work)
still applies. Product decisions, data model, and backlog context live in the
private `DwelLogs/App` repo — not here.

## This repo is public

Everything committed here, including history, is visible to anyone.

- No keys, tokens, or credentials. A form service's public site key is fine;
  anything marked secret is not.
- No internal notes: competitor research, rejected names, personal property
  details, and seed data stay in the App repo.
- A mistake in history is public even after it's deleted. Check before pushing.

## How it's built

- Plain static HTML/CSS served by **GitHub Pages** from `main`. No build step
  until there's a reason for one.
- Custom domain: `dwellogs.com` (the `CNAME` file GitHub creates — don't
  delete it). `dwelllogs.com` is forwarded to it at Porkbun, not served here.
- Enforce HTTPS is on in Pages settings once the certificate issues.

## Git workflow

**Defined in the parent `CLAUDE.md`** — `main` = released, `release/vN`,
`<card#>-short-name` work branches, `feature/<name>` for multi-card work,
`hotfix/` from `main` merged both ways, `--no-ff`, semver on `0.x`. Not
restated here: two copies drift, and the drifted copy is the one someone
follows.

Site-specific:

- Currently on **`release/v0`** — the pre-launch coming-soon page. `release/v1`
  is the real launch, and runs behind the App repo's `release/v1`.
- **GitHub Pages deploys from `main`**, so merging to `main` *is* publishing.
  There is no separate deploy step to think twice during. Preview on the branch
  locally before opening the PR.

## Brand

- Always written **DwelLogs** (capital L), matching SaasyLogs.
- For anyone who holds the keys: owners, renters, condos, ranches.
- No gender or household stereotypes in copy or imagery (no "honey-do",
  no "nag"). Tone is proactive and informed, never scolding.
- Free. Don't promise features that aren't built; say "coming" or leave it out.
- No invented numbers (savings, user counts, "X% of homeowners...").
- **Visual identity lives in [`brand/README.md`](brand/README.md)**: Blueprint
  palette, Space Grotesk, the heart-monitor mark, and which file goes where.
  Change colors there and in `index.html` together.
- **No third-party requests.** Fonts are self-hosted (never Google Fonts), no
  CDNs, no analytics or embeds without a deliberate decision. The product's
  stance on customer data starts with the site.
- Emails and link previews use `/og-image.png`. Regenerate it if the headline
  or palette changes.

## Known gaps

- Protect `main` in repo Settings → Rules (free for public repos): require a
  PR, no direct pushes.
- Email sign-up not wired up yet — needs a form service or backend.
- No analytics, by choice so far. Decide before adding any tracking; the
  product's stance on customer data starts with the site.
