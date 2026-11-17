# EduGuard Managed Browser (Chrome / Edge MV3)

This folder is a standalone Manifest V3 extension. It is intentionally scoped to transparent monitoring and website enforcement within the supported Chrome/Edge profile where it is installed, enabled, and granted host permissions. It is not an OS agent, network filter, general-purpose surveillance tool, or removal-resistant control.

## Load for development

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `extension` directory.
4. Open the extension's **Details → Extension options** (or the extension action) and configure the school backend origin.
5. Enter the one-time enrollment code issued by an administrator, device name, and check each disclosure acknowledgement before enrolling.
6. Review the requested permissions in the browser's install prompt. For iteration, use the extension page's **Reload** after changing files.

Use HTTPS for the backend. `http://localhost` and loopback development origins are permitted only for local testing. Configure the server's CORS policy and TLS for the actual browser origin. Never put an administrator credential in the extension; the one-time enrollment code exchanges for a device token, which is stored in `chrome.storage.local`.

## Backend contract

- `POST /api/extension/enroll` JSON `{ "code": "…", "device": { "name": "…", "os": "…", "extensionVersion": "1.0.0" } }`; expects `{ "deviceToken": "…" }`.
- `GET /api/extension/policy` with `x-device-token` header.
- `POST /api/extension/activities/sync` with `x-device-token` and `{ "events": [...] }`.

Policy response: the current server returns `{ "revision": "…", "defaultAction": "deny", "captureFullUrl": false, "websiteRules": [{ "id": "…", "domain": "example.org", "action": "allow", "category": "learning", "urlMatch": "path" }], "applicationRules": [] }`. `urlMatch` is included only when its value is `path`; this label does not mean exact or prefix URL rules are implemented. The backend does not send path patterns, and URL values sent by the extension are not persisted. Website rules match at the domain level. `applicationRules` is currently always empty and this browser extension does not enforce applications. The extension's stated policy response is implemented; do not claim exact/prefix URL matching or application enforcement. A packaged static DNR rule blocks main-frame HTTP(S) navigation from first install/offline until policy is fetched; dynamic server-provided allow/block rules use higher priorities. The extension applies deny-by-default behavior and domain rules received from the server.

Activity events have `eventId` (UUID), `domain`, optional `url`, `occurredAt` ISO timestamp, `durationSeconds`, `accessStatus`, and `category`. Full URLs are omitted unless the fetched backend policy explicitly sets `captureFullUrl: true`; any user preference alone cannot enable transmission. The current backend sync SQL stores domain and activity metadata but not the supplied URL. Blocked main-frame attempts are observed at `webNavigation.onBeforeNavigate`, before DNR redirects them, and logged without page contents; visit duration for allowed pages remains approximate. Application names are not available to this browser extension and are not fabricated. Credentials, keystrokes, private messages, page contents, personal files, microphone and webcam are not collected. IndexedDB is an offline outbox; successful batch sync removes acknowledged UUID-keyed rows. Retries use bounded exponential backoff and alarms, and are attempted when the browser is online/running. Device-token transport uses HTTPS outside localhost.

## Permissions and disclosure

`<all_urls>` is a high-impact host permission. It enables enforcement for arbitrary site navigations and browser navigation event observation. It is disclosed in setup and used to implement the school-approved-site policy and the limited activity reporting above; the extension does not scrape website contents. `declarativeNetRequest`, `webNavigation`, and `tabs` support main-frame decisions and duration measurement. Duration is approximate and only measured while the browser can observe a tab's navigation/lifetime; it is not a precise measure of attention or active use. Do not represent it as such.

Monitoring and blocked-page disclosure are explicit. The extension does not control other apps, browsers, operating systems, network access, or removable-extension behavior. Users may be able to disable/remove it unless separate, disclosed device-management controls apply. Ask a school administrator about the policy or a blocked site.

## School deployment and limitations

For managed Chromebooks/Chrome or Edge deployments, administrators can use the browser's supported enterprise extension policy / MDM tooling to install, configure, update, and restrict removal according to applicable law and school policy. This extension itself does not configure MDM, DNS, OS controls, network filtering, or native software; those are separate integrations and need their own disclosure and review. Test policy rules and exception ordering in a non-production profile first. Keep enrollment codes one-time/short-lived, device tokens revocable, policy responses authenticated, and server-side sync idempotent by `eventId`.

## Development checks

Run `node --check background.js`, `node --check options.js`, and `node --check blocked.js`. Load the unpacked directory in Chrome/Edge to validate browser-specific DNR rule acceptance and the end-to-end enrollment/policy flow against a test backend. Do not commit or publish secrets, device tokens, or enrollment codes.
