# EduGuard files and how they connect

## App shell and frontend
- `index.html` is the only dashboard document. It loads Chart.js, Socket.IO's client script, `client/styles.css`, `client/api.js`, and `client/app.js`.
- `client/api.js` sends same-origin JSON requests using the HttpOnly session cookie and CSRF token; it defines `window.EduAPI`.
- `client/app.js` renders role-aware dashboards and forms from live REST responses; it does not seed/sample analytics.
- `client/register-sw.js` registers the root-scope static-shell worker; `client/service-worker.js` caches only the static shell and never authenticated API responses.
- `client/styles.css` owns responsive layouts, design tokens, focus visibility and light/dark styling.
- `manifest.webmanifest` and `public/favicon.svg` define app metadata and the vector brand mark; `manus-routes.json` declares the single `/` page.

## Node and PostgreSQL
- `server/src/server.js` loads environment settings and listens on `PORT`.
- `server/src/app.js` creates Express middleware, serves only explicit public frontend files, mounts APIs and creates Socket.IO.
- `server/src/routes/api.js` and `server/src/routes/extension.js` implement cookie-authenticated human and device-token extension routes; `server/src/routes/relationships.js` mounts the school-admin assignment workflow through its controller, transactional service and data-access model.
- `server/src/middleware/security.js` contains JWT, CSRF, role/school scope, validation and audit helpers.
- `server/src/db/index.js` manages the PostgreSQL connection pool; `server/src/db/migrate.js` applies ordered SQL migrations.
- `server/migrations/` defines normalized records and constraints. `server/scripts/create-admin.js` provisions the first super administrator and school from private environment values.
- `server/test/` holds health/auth/contract checks. `server/README.md` lists endpoint details and setup constraints.

## Browser extension
- `extension/manifest.json` requests the MV3 permissions necessary for domain-level main-frame policy enforcement and navigation metadata. `extension/background.js` installs DNR rules, measures approximate visit duration, and queues consented metadata in IndexedDB for retryable sync.
- `extension/options.html`, `options.js` and `options.css` configure the backend and consume a one-time enrollment code; `blocked.html` and `blocked.js` explain school-policy blocks. `extension/README.md` describes loading, permissions, privacy, supported browser boundaries and tests.

## Root operations
- `package.json` defines npm workspace commands; `package-lock.json` pins the dependency graph.
- `.gitignore` excludes credentials, dependencies and build/test output.
- `.env.example` at `server/.env.example` contains safe setting names/placeholders.
- `render.yaml` is a Render deployment template. It does not create the external PostgreSQL database or configure a domain/secrets.
- `README.md`, `plan.md` and `TODO.md` document deployment, architecture, design, shipped foundations, blockers and incomplete product requirements.
