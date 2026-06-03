# Smart Ops Design

Static design prototype for the SmartOps UI, aligned with [Apolo](../chia/src/apolo) (Datadope tokens, Events dashboard, admin shell).

Published at https://johnny-datadope.github.io/smartops-design/

## Deployment

| Environment | URL | Trigger |
|-------------|-----|---------|
| **Production** | https://johnny-datadope.github.io/smartops-design/ | Push to `main` |
| **PR preview** | `https://johnny-datadope.github.io/smartops-design/previews/pr-<N>/` | Open/update PR to `main` |

- Production deploys via [`.github/workflows/deploy-production.yml`](.github/workflows/deploy-production.yml) to the `gh-pages` branch root (`keep_files: true` preserves active previews).
- Each PR gets a public preview at `previews/pr-<number>/` via [`deploy-preview.yml`](.github/workflows/deploy-preview.yml); the workflow comments the URL on the PR (open mock at `…/previews/pr-<N>/#/events`).
- When a PR closes, [`cleanup-preview.yml`](.github/workflows/cleanup-preview.yml) removes `previews/pr-<number>/` from `gh-pages`.

**GitHub repo settings (one-time):** Pages → source **GitHub Actions**; Actions → workflow permissions **Read and write**.

## Run locally

```sh
npx live-server --port=5173
```

Open http://127.0.0.1:5173 — sign in with any credentials (mock auth).

## Routes (hash-based)

| URL | View |
|-----|------|
| `#/login` | Login |
| `#/events` | Events dashboard |
| `#/events/:index` | Event detail modal |
| `#/admin/users` | Manage Users |
| `#/admin/usage` | Usage & Costs |

## Layout

```
index.html         # entry — Datadope CSS vars, Open Sans, Recharts 2.15.4 (Apolo), script tags
uploads/           # smartops-logo.svg, smartops-logo-white.svg
src/
  theme.js         # severity / status / KPI metadata, badge class maps
  i18n.js          # en-GB / es-ES strings
  badges.jsx       # Apolo-aligned badge components (shared)
  app.jsx          # shell, routing, auth, theme (light/dark)
  chrome.jsx       # TopBar + UserMenu (Apolo-style)
  login.jsx
  events.jsx       # Events dashboard (KPIs, filters, table, pagination)
  event_detail.jsx # full-page event detail modal, split-pane detail + AI chat
  chat_markdown.jsx # AI analysis markdown rendering (Apolo-aligned)
  breakpoints.js     # 640/768/1024/1280 (sync with Apolo)
  use-mobile.js      # useIsMobile / useIsTablet / useIsDesktop
  form_select.jsx    # Apolo Select (forms + compact rows picker)
  table_pagination.jsx
  alert-mobile-card.jsx
  users.jsx
  administration.jsx
  usage.jsx
  data.jsx         # mock ALERTS seed data
  icons.jsx
```

## CSS utility classes (`index.html`)

| Class | Purpose |
|-------|---------|
| `.layout-page` | Page padding + vertical rhythm |
| `.layout-header` / `.layout-header-inner` | Sticky app header |
| `.card` | Surface with border + radius |
| `.stat-card` / `.stat-card--active` | KPI cards (hover scale, active ring) |
| `.btn` + variants | Primary, outline, ghost, sm, icon |
| `.badge` + variants | Datadope tints (severity, status, muted, etc.) |
| `.input` / `.input-wrap` | Form fields |
| `.avatar` / `.avatar-stack` / `.avatar--empty` | Assignee avatars (`primary/10`) |
| `.table-pagination` | Apolo-style table footer |
| `.active-filters` / `.filter-chip` | Removable filter chips |
| `.modal-overlay` / `.modal-dialog` | Alert detail modal (90vw × 80vh) |
| `.user-avatar` | Header user menu avatar |

## Visual checklist (Apolo sync)

- [x] KPI cards: ring on active filter, hover scale
- [x] Filters popover + active filter chips (Customer/Project/Environment)
- [x] Table: Event Status, Customer, Time columns; assignee avatars; empty state
- [x] Pagination: page numbers + rows selector
- [x] Responsive: mobile nav drawer (&lt;768px), Events card list, Apolo breakpoints
- [x] Modal: investigation timeline, Overview (Description + Additional Info), Comments tab, Activity tab, CaseManagement, ChatPanelHeader
- [x] Admin Users / Usage: i18n, Password column, Cases KPI
- [x] User menu: theme Light / Dark only (no System); logout copy; footer version
- [x] Default locale es-ES; login i18n

## Legacy

`investigation.jsx` and `usage_v2.jsx` were removed; their script tags are not loaded from `index.html`.

Legacy field aliases in `data.jsx` (`alertRow`) remain for backward compatibility with `usage.jsx` drilldown mocks.
