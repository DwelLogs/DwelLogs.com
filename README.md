# DwelLogs — website

Public landing page for [dwellogs.com](https://dwellogs.com). Served by GitHub
Pages from the repository root. **Keep a pulse on your home.**

**The app is not in this repository.** It lives in a separate private repo. See
[Repository layout](#repository-layout).

---

## Contents

```
index.html          Landing page. No build step, no dependencies.
css/
  tokens.css        Font + Blueprint palette as CSS variables. The only place colors live.
  site.css          Page styles. Uses var(--…) only, never hex values.
CNAME               Custom domain for GitHub Pages (dwellogs.com). Don't delete.
LICENSE             All rights reserved. See the file.
favicon.svg         Heart-monitor house mark (same as brand/logo-mark.svg).
favicon.ico         16/32 fallback for browsers that ignore SVG icons.
apple-touch-icon.png  180px home-screen icon.
og-image.png        1200×630 link preview.
fonts/
  SpaceGrotesk.woff2  Self-hosted variable font. SIL OFL, see fonts/OFL.txt.
brand/
  README.md         Brand guide: concept, palette, type, mark, which file goes where.
  logo-mark.svg     Source mark.
  logo-light-bg.png Mark + wordmark for light backgrounds.
  avatar-512.png    GitHub org avatar and profile pictures.
  github-social-preview.png  1280×640, repo social preview and org profile banner.
  github-profile-README.md   Source for the org profile (DwelLogs/.github).
```

### Changing an icon or the link preview

Bump the `?v=` on every icon URL and on `og:image` in `index.html`. Browsers
and link-preview services cache these for a long time; without the bump,
anyone who has seen the old one keeps it. (Lesson carried over from SaasyLogs.)

---

## Local preview

No toolchain required.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Paths in `index.html` are root-absolute (`/css/...`, `/fonts/...`), so opening
the file directly with `file://` loads no styles or logo. Use the server.

---

## Repository layout

| Repo | Visibility | Contents |
|---|---|---|
| `DwelLogs/DwelLogs.com` | public | this site |
| `DwelLogs/App` | **private** | the app |
| `DwelLogs/.github` | public | org profile page |

The site can be public because it is marketing. Nothing about the app, its
data model, or anyone's property goes in this repo.

---

## Deployment

Work goes on `<card#>-name` branches into the current release branch; the site
only updates when a release merges into `main` (see the parent `CLAUDE.md`).
GitHub Pages serves the root of `main`. `CNAME` holds the custom domain; HTTPS
is provisioned by GitHub.

DNS lives at Porkbun:

- four `A` records on `@` → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- four `AAAA` records on `@` → `2606:50c0:8000::153` through `2606:50c0:8003::153`
- one `CNAME` on `www` → `dwellogs.github.io`

**dwelllogs.com** (double L, the likely typo) is not served here. Porkbun URL
forwarding sends it to `https://dwellogs.com` with a permanent 301, path
included, wildcard on.

---

## Licence

All rights reserved. See [LICENSE](LICENSE). Space Grotesk is licensed
separately under the SIL Open Font License (`fonts/OFL.txt`).
