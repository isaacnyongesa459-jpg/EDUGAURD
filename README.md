# EduGuard

**School digital safety, applied transparently.** EduGuard is a Kenyan-school platform foundation for approved website access, enrolled browser reporting and role-scoped review. It uses the requested plain HTML/CSS/JavaScript frontend with a modular Node/Express backend and PostgreSQL schema.

## Start locally

Requirements: Node.js 20+ and PostgreSQL 14+.

1. Copy `server/.env.example` to `server/.env` or export its settings in your shell; npm workspace scripts run the server from its workspace directory, so a root `.env` is not automatically loaded. Set a strong `JWT_SECRET` (32+ random bytes), `DATABASE_URL`, and allowed origins. Never commit `.env`.
2. Install dependencies from the repository root: `npm install`.
3. Apply migrations to the intended database: `npm run db:migrate`.
4. Provision the initial super administrator and first school from a trusted terminal. Set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_NAME`, `SUPER_ADMIN_PASSWORD`, `SCHOOL_NAME`, and `SCHOOL_SLUG` in the shell environment, then run `npm run admin:create`. Password must be at least 12 characters. The script does not print credentials and is idempotent for the selected administrator/school. Remove those temporary variables from shell history/environment after use.
5. Start the app with `npm run dev` (watch mode) or `npm start`; open `http://localhost:3000`. Run checks with `npm test`.

The app serves the static shell at `/`, browser files only under `/client/`, the favicon under `/public/`, and JSON at `/manus-routes.json`. It does not expose arbitrary filesystem content. `/api/health` checks database availability and is suitable as a deployment health path.

## Interactive demo preview

The demo opens on a clearly labeled login screen. Enter any non-empty username/email and password to continue; the frontend-only demo adapter does not validate or transmit either value and stores only a local demo-session flag. This is strictly a development convenience, not authentication or a security boundary. The production Node API's database-backed authentication is unchanged. Sign out returns to the demo login. The existing demo includes fictional school, student, device, website, application, activity, notification and analytics records; role-inspired administrator, teacher and parent views; responsive navigation; search and filters; charts; website approval/block controls; device status controls; CSV report export; local persistence; reset demo data; light/dark themes; and service-worker shell caching. Demo changes are stored only in the current browser's local storage and are never sent to the backend.

The interface clearly labels sample records as demonstration data. It does not claim to monitor enrolled devices: actual monitoring and enforcement require the separately documented browser extension, a native device agent, supported MDM or another authorized integration. GitHub Pages can serve the static demo, while the API, database, Socket.IO updates and extension backend still require the Node.js/PostgreSQL deployment described below.

## Included foundations

- Role-aware sign-in and dashboard pages for super administrators, school administrators, parents and teachers; production UI/API values come from service responses. GitHub Pages has a separate, opt-in, read-only demo with fictional sample records.
- PostgreSQL migrations for schools, users, students, parents, teachers, explicit guardian/teacher-to-student links, devices/assignments, categories, website/application rules, restriction policies, activity logs, notifications, audit logs, and subscriptions.
- JWT session cookie, bcrypt password hashes, CSRF double-submit checks, validation, rate limits, security headers, school/role gates, audit events, and authenticated Socket.IO rooms.
- Admin-created student/device/rule/user/school forms where supported. Device enrollment codes are short-lived and single-use; the resulting extension token is stored hashed on the server.
- A separate Chrome/Edge Manifest V3 extension with a default-deny main-frame website policy, blocked-access explanation, disclosed onboarding, approximate visit duration, and an IndexedDB UUID-deduplicated retry queue.
- A static PWA shell. The root service-worker endpoint serves only the approved client worker and grants scope `/`; it caches shell assets only, never authenticated API responses or personal records.

School administrators can assign active same-school parents or teachers to students through the relationship API and dashboard form. Account invitation and secure password activation, report exports, email delivery, billing, subscription lifecycle, automated policy alerts, full CRUD, and retention/export/deletion controls are not complete. No default login is shipped.

## Browser extension setup and enforcement limits

Load `extension/` unpacked at `chrome://extensions` or `edge://extensions`, configure the HTTPS backend origin, and enroll with a one-time code created by an authorized school administrator. Review the broad `<all_urls>` host permission before installation. The extension enforces only top-level website navigation in the supported browser profile while installed and active. YouTube remains denied by default until the school configures a separate supported provider/browser restricted-mode integration; URL rules do not enforce it. Application blocking is not implemented and requires a separate management integration. A static default-deny navigation rule redirects to the policy explanation from installation; server-provided domain rules use validated DNR URL filters and override it at higher priority once fetched. A device must be assigned to exactly one student for activity sync; ambiguous multi-student assignments are rejected rather than misattributed. The first-school bootstrap utility seeds a domain-only allowlist for learning/AI sites; API-created schools start with no rules. School administrators should review and test each approved domain before enrollment. This is not a guarantee that every learning workflow works.

This extension is not an operating-system agent, application blocker, network/DNS filter, MDM manager or removal-resistant device lock. It cannot control other browsers/apps or provide reliable visibility when closed, disabled, offline or removed. Managed browser deployment/permission policy, native-device agents, OS policies, DNS filtering and MDM are separate integrations requiring school authority and clear notice. YouTube Restricted Mode and other embedded service restrictions need the provider's supported admin controls; a URL allow rule alone cannot enforce those behaviors.

Monitoring is intended only for properly authorized school-managed devices and must be disclosed to students and parents. The system does not collect passwords, keystrokes, private messages, page contents, personal files, camera or microphone recordings. Full URL capture is disabled in the extension policy response and URLs are not retained by the API. Establish purpose limitation, access control, retention/deletion, incident response, parental notices/consent where applicable, and an independent Kenyan Data Protection Act, 2019 review before real student data is collected. This is engineering documentation, not legal advice or a compliance certification.

## Offline and online behavior

- The extension can queue the permitted navigation metadata in IndexedDB while offline and retry when the browser is running and network connectivity returns; UUID event IDs prevent duplicate inserts.
- Browser policy updates, server-backed sign-in, current reports, administrator actions, Socket.IO updates and enrollment require a reachable backend.
- The installed PWA shell can load cached static files, but does not cache account pages, reports or personal API results. Parent/teacher assignment relationships must exist server-side before data is visible.
- Device online state is inferred from server synchronization/last-seen timestamps, not from continuous tracking.

## API overview

The main REST surface is under `/api`: `/health`, `/auth/*`, `/dashboard/summary`, `/activity`, `/students`, `/devices`, `/rules`, `/notifications`, `/reports/trends`, `/users`, `/relationships`, `/schools`. Extension endpoints are `/api/extension/enroll`, `/policy`, and `/activities/sync`. Exact JSON fields, roles and limitations are in [`server/README.md`](server/README.md). Unsafe cookie-authenticated requests require a CSRF token from `GET /api/auth/csrf`. There is no public account signup route.

## Render deployment

`render.yaml` provides a Node web-service template. Create a PostgreSQL database and set its private connection string as `DATABASE_URL`; set `ALLOWED_ORIGINS` to the exact HTTPS origin; keep `COOKIE_SECURE=true`; provide the database and app with TLS; and set `COOKIE_SAME_SITE=lax` for ordinary same-origin deployment. Local HTTP development uses `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax`. If a supported embedded cross-site Preview needs login, configure `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` explicitly and account for third-party-cookie restrictions. The migration runner serializes concurrent starts with a PostgreSQL advisory lock, but still test migrations against a disposable database and retain backups before production rollouts. Apply migrations with `npm run db:migrate` before serving production traffic. Keep JWT/bootstrap credentials out of the repository and rotate them using managed secret storage. Run extension tests in a managed test profile and stage rule deployments before enrolling student devices.

Render hosting, PostgreSQL provisioning, migrations against a live database, email, MDM, DNS, payment/billing, and production policy enforcement have not been performed by this repository commit. Review `TODO.md` for scope and completion status.
