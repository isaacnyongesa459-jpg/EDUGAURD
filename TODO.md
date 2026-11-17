# EduGuard delivery status

Status: **Implemented**, **Partial**, **Blocked**, **Not started**. A code foundation is not equivalent to production readiness. Do not mark external or device-dependent features complete without actual integration testing.

## 1. Stack, app architecture, and deployment — Partial
- Frontend uses HTML5, CSS3 and Vanilla JavaScript; backend uses Node.js/Express.js; database uses PostgreSQL; real-time channel uses Socket.IO; authentication uses JWT and bcrypt; charts use Chart.js; monitoring browser add-on uses Chrome/Edge Manifest V3; offline extension data uses IndexedDB; API uses REST; deployment template targets Render-compatible Node.js.
- Keep HTML, CSS, JavaScript in separate files. Organize backend using controllers, routes, middleware, services and database models.
- Maintain a working app throughout development and document exact filenames, their locations and connections.
- Do not replace implementation with pseudocode; explain limits requiring native software, OS permissions, MDM, or external infrastructure.
- Status: plain frontend and modular server foundations exist; some API handlers remain concentrated in route modules; end-to-end live database/hosting validation remains open.

## 2. Roles, school boundaries, and access workflows — Partial
- Implement Super Administrator: manage multiple schools; register schools and administrators; view overall system statistics; manage subscriptions and billing; platform-wide settings; monitor system health.
- Implement School Administrator: register students and teachers; register/assign devices; view student device activity; block/allow applications and websites; set school-wide restrictions; create learning allowlists; generate reports; manage teachers and parents.
- Implement Parent Dashboard: view only linked child's digital activity and timestamps/application usage; receive alerts about restricted access attempts; see daily/weekly reports; configure approved schedules only where school policy permits; receive unusual-activity notices.
- Implement Teacher Dashboard: view assigned students/devices; monitor learning sessions; view compliance; report inappropriate activity; restrict access during supervised lessons only according to school policy.
- Implement secure invitation/account activation, assignment management and least-privilege roles. No public signup or default credentials.
- Status: four-role navigation, session and school/relationship query restrictions, and a school-admin same-school assignment workflow exist in the foundation; account activation, broader user administration, super-admin settings, subscription/billing workflows and independent role review remain incomplete.

## 3. Website/application restrictions and managed enforcement — Partial / MDM prerequisites
- Implement default-deny access; only school-approved websites/apps accessible on managed devices. Educational defaults include Google Search/Classroom/Docs/Drive, ChatGPT, Gemini, Microsoft Copilot, YouTube with appropriate educational restrictions, Khan Academy, Wikipedia and administrator-approved sites. Restricted categories include pornography, gambling, Facebook, TikTok, Instagram, Messenger, Snapchat, unapproved games and other inappropriate/distracting sites.
- Administrators can add, remove and modify website and application rules in both categories; support domain/subdomain matching, URL filtering and category policies.
- Do not rely on the dashboard alone. Enforce through a managed extension, device policies, DNS filtering or supported MDM integrations. Provide a clear school-policy blocked-access page.
- Status: extension's DNR engine uses validated URL-filter syntax, fails closed, blocks main-frame HTTP(S) by default, applies domain allow/block rules, and has a disclosed blocked page. Extension only applies in supported Chrome/Edge profiles with broad host permission. It is not removal-resistant and does not control other apps/browsers/OS/network. MDM/DNS/OS deployment, YouTube provider controls, supervised lessons/schedules, safer rule administration and device enforcement tests remain incomplete.

## 4. Transparent activity, audit, and child privacy — Partial
- On properly authorized school-managed devices, record student/device IDs, website domain, page URL only when policy permits, application name where available, date/time, measurable duration, allowed/blocked status, restricted attempts, and device online/offline status; provide chronological activity timeline.
- Work offline by storing only permitted event metadata locally and synchronizing securely when connectivity returns; prevent duplicates, retry failures, resolve conflicts, and use reliable timestamps.
- Never collect passwords, keystrokes, private messages, personal files, microphone recordings or webcam footage. Disclose monitoring to students/parents and enforce school authorization/access controls.
- Status: extension stores an IndexedDB outbox with UUID deduplication and retry, and records allowed/blocked domain/timestamp plus approximate visit duration. Activity timeline and school/relationship scoping are foundational. Application names are unavailable to this extension; browser closed/disabled/offline means no fresh events. Full URL is disabled and not stored by API. Activity sync rejects unassigned or ambiguously multi-assigned devices instead of silently misattributing events. Conflict resolution beyond idempotent dedupe, parent/child notices/consent evidence, retention/deletion, data export, DPIA/legal review, encryption-at-rest strategy, incident response and lawful-basis governance remain required. No compliance certification is claimed.

## 5. Analytics, trends, and policy alerts — Partial
- Show total device usage hours, educational website usage percentage, restricted attempts, most-visited sites/apps, time on learning platforms, daily/weekly/monthly trends and compliance.
- Categorize activity as educational, recreational, restricted or unknown. Base alerts on defined policies, not unsupported assumptions.
- Notify on repeated blocked attempts, unapproved apps, outside-schedule device use, missed synchronization, and unusual patterns requiring admin review; support dashboard and email.
- Status: database-backed counts/trends and Chart.js display are implemented where data exists; empty data remains empty, not invented. Alert generation, schedule evaluation, email delivery, reliable app-usage measures, compliance semantics, total-usage calculations, monthly views, and report export are not complete.

## 6. Device management and offline synchronization — Partial / native and MDM prerequisites
- Each device has unique ID, assigned student, school ID, OS, status, last sync, applied policy and enrollment date; support enrollment, policy assignment, remote updates and deactivation.
- Clearly distinguish browser extension capability from native agent or MDM integration.
- Status: single-use expiring enrollment code, hashed device token, school assignment, status and last-seen fields, extension policy sync, event batching and deactivation primitives exist. Complete device inventory workflows, revocation delivery, assignment UI, recovery/re-enrollment UX, native agents and MDM deployment remain open.

## 7. Security and privacy engineering — Partial
- Implement RBAC, secure authentication, password hashing, API authorization, input validation, rate limiting, secure session handling, audit logs, encrypted communication, secure sensitive-data storage, retention policies and parent/school access permissions.
- Design with Kenya's Data Protection Act, 2019 and children's personal data protections in mind. Do not implement covert surveillance.
- Status: JWT/bcrypt, HttpOnly cookies, CSRF, Zod checks, rate limiting, Helmet, explicit school/role checks, hashed device tokens, audit foundations and TLS deployment guidance exist. Require a professional security assessment, key rotation, CSP review, DB TLS/backup validation, CSRF/proxy production tests, retention/access workflows, monitoring/incident response and legal review before production.

## 8. PostgreSQL data model and migrations — Partial
- Create PostgreSQL tables for schools, users, students, parents, teachers, devices, device_assignments, website_categories, website_rules, application_rules, activity_logs, restriction_policies, notifications, audit_logs and subscriptions.
- Implement relationships, foreign keys, indexes, constraints and ordered database migrations.
- Status: initial SQL plus relationship migration exists; concurrent migration runs are serialized with a PostgreSQL advisory lock. Verify every migration against a real disposable PostgreSQL instance and define rollback/backup/retention procedures before production.

## 9. REST API and documentation — Partial
- Create and document REST endpoints for authentication, school registration, students, parents, devices, device synchronization, website/application restrictions, activity logging, analytics, notifications, reports and user management.
- Implement appropriate authorization, validation, errors and relationship constraints.
- Status: health, sign-in, school/student/device/rule/list/report/notification, parent/teacher relationship provisioning and extension sync endpoints exist. Complete CRUD, password activation/recovery, subscriptions/billing, policy category UI, alert generation, reports/export and email integrations remain open. API details in `server/README.md`.

## 10. Render and production readiness — Blocked / Not verified
- Provide deployment instructions and configuration, migrate intended PostgreSQL, test security and policy behavior, verify Render runtime, and do not claim enforcement on unsupported platforms.
- Status: `render.yaml` and setup documentation are provided. No production Render service or PostgreSQL database is provisioned; no live student data or credentials have been configured. Chrome/Edge extension requires browser load and managed-profile integration testing. Maintain all gates before launch.
