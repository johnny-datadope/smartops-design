# Smart Ops Design

Design prototype for the Smart Ops UI.

Published at https://johnny-datadope.github.io/smartops-design/

## Run locally

```sh
npx live-server --port=5173
```

## Layout

```
index.html         # entry — styles + script tags
src/
  app.jsx          # App shell, routing, global state
  chrome.jsx       # TopBar, user menu, language switcher
  login.jsx
  events.jsx       # Events dashboard (default route)
  event_detail.jsx
  investigation.jsx
  users.jsx        # /users route
  administration.jsx # /admin route (Admin role only)
  data.jsx         # mock data
  icons.jsx        # shared SVG icon set
uploads/           # static image assets
```
