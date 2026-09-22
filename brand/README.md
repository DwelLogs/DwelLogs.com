# DwelLogs brand

## Concept: the pulse of the home

DwelLogs is a monitor for your home's vital signs. The heart-monitor mark and
background line are the concept, not decoration.

- **Tagline:** "Keep a pulse on your home." Supporting line: "Everything your
  home needs, before it needs it."
- **Language:** check-ups (not chores or tasks), readings (gauge and level
  checks), vital signs. Status reads as healthy, due soon, or needs attention,
  never "overdue" or "failed."
- **Tone:** a monitor informs, it doesn't scold. Same rule as the rest of the
  brand: no nagging, no stereotypes.

## Mark

A heart-monitor line that traces a house, then beats. The home's vital signs.
`logo-mark.svg` is the source of truth (it's also `/favicon.svg`). Navy rounded
square `#15243a`, orange line `#f0a257`, stroke 4 on a 64-unit grid.

## Wordmark

**DwelLogs** in Space Grotesk Bold: "Dwel" in ink, "Logs" in accent, no space.
Always written with a capital L, matching SaasyLogs.

## Palette: Blueprint

In code: `/css/tokens.css`. Change a color there and in this table together.

| Token    | Light     | Dark      | Use                         |
|----------|-----------|-----------|-----------------------------|
| bg       | `#eef3f7` | `#0e1726` | page background             |
| ink      | `#15243a` | `#e9f0f8` | text, "Dwel"                |
| muted    | `#52627a` | `#9fb0c6` | secondary text              |
| accent   | `#1f5fa8` | `#6aa8ee` | "Logs", links, badges       |
| card     | `#ffffff` | `#152236` | cards                       |
| line     | `#d6e0ea` | `#233450` | borders                     |
| trace    | `#e0893a` | `#f0a257` | heart-monitor line, mark    |

## Type

- **Space Grotesk** (SIL Open Font License, `/fonts/OFL.txt`) for the wordmark,
  headings, and labels. Self-hosted variable font, `/fonts/SpaceGrotesk.woff2`.
  Never loaded from Google Fonts: the site makes no third-party requests.
- System UI font for body text.

## Background line

One continuous path: blip, house with chimney, heartbeat, castle, blip, barn,
big beat, apartment block. Every kind of dwelling. Fixed behind the content;
draws in over 5s, static for reduced-motion users.

## Files

| File | Where it goes |
|---|---|
| `/css/tokens.css` | Palette + font as CSS variables. The code copy of this guide |
| `logo-mark.svg` | Source mark, site favicon |
| `avatar-512.png` | GitHub org avatar, other profile pictures |
| `github-social-preview.png` (1280×640) | Repo Settings → Social preview |
| `logo-light-bg.png` | Mark + wordmark on light backgrounds (transparent PNG) |
| `/og-image.png` (1200×630) | Link previews for dwellogs.com |
