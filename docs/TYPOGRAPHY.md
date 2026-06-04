# Typography — Apolo ↔ smartops-design

Reference for visual fidelity. Base: **16px root**, Open Sans, tokens in `index.html` `:root`.

## Token scale

| Token | px | Apolo equivalent |
|-------|-----|------------------|
| `--type-2xs` | 8 | avatar initials |
| `--type-xs` | 10 | mobile badges, timestamps |
| `--type-2sm` | 11 | meta, labels uppercase, assignees |
| `--type-sm` | 12 | `text-xs`, badges |
| `--type-base` | 13 | chat, comments |
| `--type-md` | 14 | `text-sm`, tables, body |
| `--type-lg` | 18 | alert title / empty state |
| `--type-xl` | 20 | alert title @container lg |
| `--type-2xl` | 24 | page titles, KPI |
| `--type-3xl` | 30 | KPI desktop |

## Matrix (status: ok)

| screen | element | apolo_source | smartops_target | size_px | weight | status |
|--------|---------|--------------|-----------------|---------|--------|--------|
| event-detail | severity badge | alert-header.tsx `text-xs font-semibold` | `.modal-alert-badge--severity` | 12 | 600 | ok |
| event-detail | status badge | alert-header.tsx `text-xs font-medium` | `.modal-alert-badge--status` | 12 | 500 | ok |
| event-detail | alert title | alert-header `text-lg @lg:text-xl font-bold` | `.modal-alert-header__title` | 18→20 | 700 | ok |
| event-detail | meta line | alert-header `text-[11px] @lg:text-sm` | `.modal-alert-header__meta` | 11→14 | 400 | ok |
| event-detail | tabs | alert-left-panel `text-xs @lg:text-sm` | `.detail-tab` | 12→14 | 500 | ok |
| event-detail | overview section title | overview-description-card `text-sm font-semibold` | `.overview-card__head-title` | 14 | 600 | ok |
| event-detail | overview labels | `text-[11px] uppercase tracking-wider` | `.overview-label` | 11 | 500 | ok |
| event-detail | overview body | `text-sm leading-relaxed` | `.overview-body` | 14 | 400 | ok |
| event-detail | label chips | alert-labels `text-[11px] font-medium` | `.alert-label-chip` | 11 | 500 | ok |
| event-detail | stepper | investigation-stages-timeline | `.investigation-stages__*` | 9–12 | varies | ok |
| event-detail | case title | case-management `text-sm font-semibold` | `.case-mgmt__title-text` | 14 | 600 | ok |
| event-detail | assignee name | case-management `text-[11px]` | `.assignee-chip__name` | 11 | 400 | ok |
| event-detail | chat header title | chat-panel-header `text-xs md:text-sm` | `.chat-panel-header__title` | 12→14 | 600 | ok |
| event-detail | chat bubble | chat-message-bubble `text-[13px]` | `.chat-prose` | 13 | 400 | ok |
| event-detail | comments | case-comments-section `text-[13px]` | `.case-comments__*` | 13/10 | varies | ok |
| event-detail | activity | alert-activity.tsx | `.activity-card__*` | 11/14 | 500/400 | ok |
| event-detail | raw JSON | alert-raw-data `text-xs font-mono` | `.json-payload-card__body` | 12 | 400 | ok |
| event-detail | empty case | empty-case-state `text-lg` + `text-sm` | `.empty-case-state__*` | 18/14 | 600/400 | ok |
| events | page title | alerts-dashboard `text-2xl md:text-3xl` | `.events-page-title` | 24→30 | 700 | ok |
| events | table | table `text-sm` | `.events-table` | 14 | 400 | ok |
| events | mobile card badges | alert-mobile-card `text-[10px]` | `.alert-mobile-card__*` | 10 | 500 | ok |
| login | title | login-form `text-xl md:text-2xl` | `.login-card__title` | 20→24 | 600 | ok |
| login | subtitle | CardDescription `text-sm` | `.login-card__subtitle` | 14 | 400 | ok |
| chrome | nav | app-header `text-sm font-medium` | `.header-nav-btn` | 14 | 500 | ok |
| admin-users | page title | manage-users-page | `.users-title` | 24→30 | 700 | ok |
| admin-users | table | users-table-row | `.users-table` | 14 | 400 | ok |
| admin-usage | KPI | kpi-cards | `.usage-kpi__*` | 24/14/12 | varies | ok |

## Breakpoints

| Context | Apolo | smartops |
|---------|-------|----------|
| Alert left panel | `@container` `@lg` = 512px | `@container alert-left (min-width: 32rem)` |
| Chat bubble width | `@container` 400px | `.chat-panel__scroll` |
| Page / KPI | viewport `md:` 768px | `@media (min-width: 768px)` |

## Rules

- No `fontSize` / `fontWeight` in JSX `style={{}}` (except Recharts `axisTickStyle`).
- Run `node scripts/audit-typography.mjs` before commit.
