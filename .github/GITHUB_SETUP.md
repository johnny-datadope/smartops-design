# GitHub Pages setup (one-time)

After merging the deploy workflows to `main`, configure the repository once:

## Settings → Pages

1. **Build and deployment** → Source: **GitHub Actions**
2. Wait for the `Deploy production` workflow to succeed on `main`

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
