# GitHub Pages setup (one-time)

After merging the deploy workflows to `main`, configure the repository once:

## Settings → Pages

1. **Build and deployment** → Source: **Deploy from a branch**
2. **Branch:** `gh-pages` → folder **`/ (root)`** → Save
3. Wait for the `Deploy production` workflow to succeed on `main` (first push creates/updates `gh-pages`)

> **Important:** Do **not** use **GitHub Actions** as the Pages source. The workflows push to the `gh-pages` branch via `peaceiris/actions-gh-pages` (production at `/`, PR previews under `previews/pr-N/`). GitHub only serves those paths when Pages reads from the `gh-pages` branch.

## Settings → Actions → General

1. **Workflow permissions** → **Read and write permissions**
2. Save

## Verify production

- https://johnny-datadope.github.io/smartops-design/
- https://johnny-datadope.github.io/smartops-design/#/events

## Verify PR preview

1. Open a PR to `main` (e.g. `feat/SO-2172-mu1-event-detail-view`)
2. Check the `Deploy PR preview` workflow
3. Open the URL from the bot comment: `…/previews/pr-<N>/#/events`

## Verify cleanup

1. Merge or close the PR
2. Confirm `previews/pr-<N>/` is removed from the `gh-pages` branch

## Troubleshooting: preview URL returns 404

If `…/previews/pr-<N>/` shows GitHub’s “404 File not found” but the workflow succeeded:

1. Confirm **Pages → Source** is **`gh-pages` / `(root)`**, not **GitHub Actions** or **`main`**.
2. On the `gh-pages` branch, confirm `previews/pr-<N>/index.html` exists (repo **Code** tab → branch `gh-pages`).
3. After changing Pages source, re-run **Deploy PR preview** on the PR (or push an empty commit) and wait ~1 minute for the CDN.
