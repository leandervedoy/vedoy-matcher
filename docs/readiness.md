# Matcher release readiness

Scope: Shopify merchant app and theme extension. Current source: local working tree, not a published release. Reviewed 2026-10-18.

| Requirement | Component | Owner | Next task | Acceptance |
| --- | --- | --- | --- | --- |
| P1 Consistent Vedoy interface | C1 Lantern 0.2.0 CSS + React editor | Vedoy development | Desktop/mobile visual review | Styles load; controls readable; keyboard focus and dialog Escape work |
| P2 Merchant identity | C2 Shopify SDK | Vedoy app owner | Register/link real Shopify app and development store | Install, login, token refresh and uninstall verified on store |
| P3 Shared durable database | C3 Supabase private matcher schema | Vedoy infrastructure | Set restricted server database credentials; generate Postgres client and baseline migration | db:verify:postgres plus multi-shop integration tests against dedicated project |
| P4 Public backend | C4 Node hosting | Vedoy infrastructure | Select HTTPS host and configure server secrets | Public callbacks, app proxy and webhook endpoints pass checks |
| P5 Reliable recommendations | C5 Product sync + theme block | Vedoy development | Install extension on test theme, sync actual tagged products | Answers yield correct available products and current NOK prices; deleted products disappear |
| P6 Safe operational release | C6 Release process | Vedoy owner | Backup/restore, monitoring, support/privacy details and distribution review | Recovery drill and real merchant acceptance complete |

Verified: 14 local automated tests pass; TypeScript and production build pass. Separate Supabase project `grwtbnvoatlnigmmhrqb` is ACTIVE_HEALTHY; five private tables were provisioned and database-level restrictions verified in the previous step. No app-to-Supabase runtime connection has been proven. Shopify client_id is blank; application_url is local. No app .env exists in this checkout. Browser automation blocked local preview access during this revision, so new Lantern visual and interactive checks remain pending.

Lantern additions: original base/components CSS vendored unchanged with provenance hashes; React keeps ownership of state. The share/install modal uses native dialog for focus containment and Escape. Merchant quiz accent stays independent of the gold administration theme. No gallery JavaScript is injected.

Do not add Supabase Auth for merchant login unless a separate web-login product requirement is approved. Do not deploy the SQLite Docker image as the Postgres release. Do not treat a Supabase account-management token as a database password. No GitHub publication or production deployment was performed in this revision.

Recovery: revert the Lantern stylesheet imports and editor class changes to restore the previous UI. Database schema was not modified in this revision.

[Explore Plan & Ship in Codelit](https://codelit.io/plan-and-ship)
