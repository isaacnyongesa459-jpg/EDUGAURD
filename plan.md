# EduGuard implementation plan

## Product and implementation

EduGuard is a privacy-first digital-safety and device-management platform for Kenyan schools. The user-selected stack is plain HTML5/CSS3/vanilla JavaScript, Node.js/Express, PostgreSQL, Socket.IO, JWT+bcrypt, Chart.js, and a Chrome/Edge Manifest V3 extension. Static files are served by the Node app; REST endpoints and authenticated Socket.IO connections live under the same origin. SQL migrations define durable school, user, student, guardian/teacher, device, policy, activity, notification, audit and subscription records. The extension receives school policy, enforces main-frame website allow/block rules within the browser profile where it is installed, and retains a UUID-keyed IndexedDB outbox for retryable offline sync.

Authentication uses password hashes, an HttpOnly JWT cookie, a separate CSRF double-submit token, rate limits, validation, role gates, school scoping and audit records. Parent and teacher access depends on explicit student relationships, not device ownership. No demo user, activity, analytics, app telemetry, URL content or secret is inserted. The first administrator is provisioned out-of-band from environment variables. Access and event data collection remains disclosed and deliberately limited to domain/application labels and policy-related timestamps/status/duration; passwords, keystrokes, messages, files, microphone and camera are excluded.

The requested scope is larger than the initial implementation. README and TODO identify shipped foundations, incomplete user-facing workflows and production prerequisites. A browser extension cannot enforce policies on other browsers, native applications, the operating system, DNS/network traffic, or devices where it is disabled/removed. Browser-managed deployment needs high-impact host permissions and school authorization; OS/MDM/DNS enforcement remains a distinct integration. Live email, subscription billing, account invitation/password activation, guardian/teacher assignment workflows, retention/export/deletion, and legal review must not be represented as completed unless separately implemented and verified.

## Visual direction

The requested blue, white and dark-navy SaaS direction is applied as a **calm school-operations console**: confident contrast, compact but readable information, and explicit privacy/service states. Layout uses a persistent workspace rail on desktop, a compact top bar and responsive collapsible navigation on mobile, with low-noise cards and tables. Motion is brief and functional (focus, hover, and modal transitions only) and respects reduced-motion preferences. Use Manrope for display headings and DM Sans for interface/body text, with system fallbacks. The signature brand color is a clear electric blue against deep navy, balanced by cool white and restrained green/amber/red status colors. The EduGuard mark is a geometric E contained by a soft-corner shield outline, rendered as a simple vector favicon. Voice is calm, direct and transparent: “Your school’s policy, clearly applied.” “No activity is shown until an enrolled device reports it.”

## Project structure

```text
index.html                    Dashboard shell and static metadata
client/api.js                 Same-origin REST client, CSRF and cookie session
client/app.js                 Role-aware pages, forms, tables and chart rendering
client/styles.css             Responsive design system and theme states
client/service-worker.js       Offline caching for static shell only; never API data
public/favicon.svg            Vector EduGuard mark
manifest.webmanifest          PWA metadata
manus-routes.json             Platform route declaration
server/src/app.js             Express app, safe static serving, middleware, Socket.IO
server/src/server.js          Node entry point and PORT binding
server/src/routes/            REST route registration and extension API
server/src/controllers/       Request/response controllers
server/src/services/          Policy, auth, reporting and activity domain logic
server/src/middleware/        JWT, CSRF, role/school authorization, validation
server/src/db/                PostgreSQL pool and ordered SQL migration runner
server/migrations/            Relational schema and incremental migrations
server/scripts/               Out-of-band first administrator bootstrap
server/test/                  API contract/security tests
extension/                    Manifest V3 enforcement, transparent options and offline queue
render.yaml                   Render Node/PostgreSQL deployment instructions
```

## Serving and external requirements

Use one Node service (`npm start`), listening on `PORT`/3000 and serving only explicit public frontend directories and API routes; do not expose server source, `.env`, migrations or repository files as static content. PostgreSQL must be provisioned separately and `DATABASE_URL` supplied privately. Apply sorted migrations before use. Render configuration is a deployment template, not proof a service/database has been provisioned. Configure the exact public app origin, verified secure-cookie settings, provider domains and backups before production. Extension enrollment codes are one-use and expire; device tokens are hashed server-side and revocable. Socket events are limited to authenticated school administration or assigned student scopes.
