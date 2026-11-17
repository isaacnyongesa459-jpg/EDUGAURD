# EduGuard files and how they connect

## App shell and frontend
- `index.html` is the only dashboard document. It loads Chart.js, Socket.IO's client script, `client/styles.css`, `client/api.js`, `client/demo-api.js`, and `client/app.js` using relative asset paths so project sites work under a GitHub Pages subpath.
- `client/api.js` sends same-origin JSON requests using the HttpOnly session cookie and CSRF token; it defines `window.EduAPI`. `client/demo-api.js` provides fictional static records only for an explicit read-only GitHub Pages demo; it does not authenticate or write records.
- `client/app.js` renders role-aware production dashboards and forms from live REST responses; the optional Pages demo is visibly labeled and read-only.
- `client/register-sw.js` registers the static-shell worker relative to the app base; `client/service-worker.js` caches only static shell assets and never authenticated API responses. `server/test/pages-subpath.test.js` guards GitHub Pages asset/PWA paths; `server/test/demo-api.test.js` checks that demo fixtures are fictional and mutations are rejected.
- `client/styles.css` owns responsive layouts, design tokens, focus visibility and light/dark styling.
- `manifest.webmanifest` and `public/favicon.svg` define app metadata and the vector brand mark; `manus-routes.json` declares the single `/` page.

## Node and PostgreSQL
- `server/src/server.js` loads environment settings and listens on `PORT`.
- `server/src/app.js` creates Express middleware, serves only explicit public frontend files, mounts APIs and creates Socket.IO.
- `server/src/routes/api.js` and `server/src/routes/extension.js` implement cookie-authenticated human and device-token extension routes; `server/src/routes/relationships.js` mounts the school-admin assignment workflow through its controller, transactional service and data-access model.
- `server/src/middleware/security.js` contains JWT, CSRF, role/school scope, validation and audit helpers.
- `server/src/db/index.js` manages the PostgreSQL connection pool; `server/src/db/migrate.js` applies ordered SQL migrations under a PostgreSQL advisory lock so simultaneous service starts do not race.
- `server/migrations/` defines normalized records and constraints. `server/scripts/create-admin.js` provisions the first super administrator and school from private environment values.
- `server/test/` holds health/auth/contract and extension-policy regression checks. `server/README.md` lists endpoint details and setup constraints.

## Browser extension
- `extension/manifest.json` requests the MV3 permissions necessary for domain-level main-frame policy enforcement and navigation metadata. `extension/background.js` installs DNR rules, measures approximate visit duration, and queues only policy-permitted metadata in IndexedDB for retryable sync. `extension/policy-rules.mjs` validates policy domains and builds bounded DNR URL-filter rules.
- `extension/options.html`, `options.js` and `options.css` configure the backend and consume a one-time enrollment code; `blocked.html` and `blocked.js` explain school-policy blocks. `extension/README.md` describes loading, permissions, privacy, supported browser boundaries and tests.

## Root operations
- `package.json` defines npm workspace commands; `package-lock.json` pins the dependency graph.
- `.gitignore` excludes credentials, dependencies and build/test output.
- `.env.example` at `server/.env.example` contains safe setting names/placeholders.
- `render.yaml` is a Render deployment template. It does not create the external PostgreSQL database or configure a domain/secrets.
- `README.md`, `plan.md` and `TODO.md` document deployment, architecture, design, shipped foundations, blockers and incomplete product requirements.
