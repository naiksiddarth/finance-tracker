# Adversarial Authentication Security Review

Date: 2026-10-01
Scope: Public API attacker with no database access. Review covers authentication, session/token handling, authorization, IDOR, password handling, enumeration, race conditions, CSRF, and cookie/header configuration.
Method: Static adversarial review of the current API and browser auth client. No application changes were made.

## Threat Model

The attacker can send arbitrary HTTP requests to the public API, create accounts, attempt login and refresh, observe their own responses, and obtain identifiers exposed to them. The attacker does not have MongoDB access, signing secrets, server filesystem access, or an already-compromised victim device.

The attacker may also:

- Learn or receive a transaction ID through a shared URL, browser history, logs, screenshots, or another application bug.
- Steal a refresh cookie through malware, browser compromise, TLS/proxy misconfiguration, or an XSS issue outside this review.
- Cause concurrent requests from multiple clients or tabs.
- Operate a malicious website, subject to browser SameSite, CORS, and preflight enforcement.

## Risk Summary

| ID   | Issue                                                                                | Severity | Exploitability                                                                  |
| ---- | ------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------- |
| A-01 | Cross-account transaction update/delete IDOR                                         | Critical | Direct with any authenticated account and a victim transaction ID               |
| A-02 | Refresh token is a replayable bearer credential with no rotation                     | High     | Requires token theft; replay is trivial once obtained                           |
| A-03 | No reuse detection, session revocation, or server-side logout                        | High     | Requires token theft or an active session; containment is unavailable           |
| A-04 | Refresh validation has a race-prone single-token model                               | High     | Concurrent refreshes and multi-device use create inconsistent sessions          |
| A-05 | Login account enumeration and unrestricted brute force                               | High     | Direct unauthenticated API abuse                                                |
| A-06 | Authentication accepts tokens from body/cookie and parses headers loosely            | Medium   | Expands credential leakage and request-confusion surface                        |
| A-07 | JWT claims are trusted without explicit claim/algorithm policy or current-user check | Medium   | Enables stale privileges and deleted-account access; escalation is conditional  |
| A-08 | Cookie and CSRF posture is environment-dependent                                     | Medium   | Stronger in production, weaker in development or misconfigured deployments      |
| A-09 | Password and identity normalization policy is weak                                   | Medium   | Enables credential abuse, duplicate identities, and inconsistent login behavior |
| A-10 | Missing authorization boundary on authenticated resources                            | High     | Direct for transaction mutations; broader risk for future endpoints             |

## Detailed Findings and Attack Scenarios

### A-01: Cross-account transaction IDOR

Severity: Critical
Category: Broken object-level authorization / privilege escalation

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [transaction.route.ts](../../apps/api/src/routes/transaction.route.ts)

`PUT /api/transaction` calls `Transaction.findByIdAndUpdate(_id, ...)`, and `DELETE /api/transaction` calls `Transaction.findByIdAndDelete(_id)`. The authenticated user ID is not included in either query. The list and create paths use the current user, but the mutation paths do not enforce ownership.

Realistic attack:

1. Attacker registers a normal account and obtains an access token through login.
2. Attacker learns a victim transaction ID from any exposed client response, shared data, or predictable application integration.
3. Attacker sends `PUT /api/transaction` with `Authorization: Bearer <attacker-token>` and the victim `_id`, replacing the amount/date.
4. Attacker sends `DELETE /api/transaction` with the same ID to remove the victim record.

Impact: cross-account financial data modification/deletion. The transaction model's post-update/post-delete hooks also adjust metric documents for the victim transaction, so the attack can corrupt the victim's cached totals. This is a direct privilege escalation from ordinary user to another user's data administrator.

Fix:

- Use ownership-scoped queries: `{ _id: transactionId, user: authenticatedUserId }`.
- Return the same `404` for missing and non-owned records.
- Prefer `PATCH /api/transactions/:id` and `DELETE /api/transactions/:id`, with a service/repository method that requires the authenticated owner.
- Add tests for read, update, and delete attempts across two users.

### A-02: Refresh token replay and absent rotation

Severity: High
Category: Token theft / session management

Evidence: [user.ts](../../packages/db/src/models/user.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [verifyJwt.middleware.ts](../../apps/api/src/middlewares/verifyJwt.middleware.ts)

The refresh cookie contains the complete signed JWT. The same token is stored in plaintext in the user document and is accepted repeatedly until JWT expiry or until another login overwrites the stored value. `POST /api/auth/refresh` generates a new access token but does not issue a new refresh token.

Realistic attack:

1. A refresh token is copied by a compromised browser extension, endpoint malware, a bad TLS-terminating proxy, a leaked cookie header, or a future XSS path that can trigger an attacker-controlled relay.
2. The attacker sends `POST /api/auth/refresh` with `Cookie: refreshToken=<stolen-token>` from any HTTP client.
3. The API verifies the token and the database copy, then returns a fresh access token.
4. The attacker repeats the request whenever the access token expires, for up to seven days.

Impact: persistent account takeover for the refresh-token lifetime. There is no one-time use property, no evidence that the original token was used, and no user-visible way to terminate the session.

Fix:

- Replace JWT refresh cookies with random opaque tokens or include a unique session/token ID. Store only a hash server-side.
- Rotate the refresh token on every successful refresh.
- Atomically mark the old token as replaced and issue the new token only if the old token is still active.
- Bind the session to a user and expiry, and consider device/session metadata for incident response.

### A-03: Reuse detection, logout, and revocation are absent

Severity: High
Category: Token theft / containment failure

Evidence: [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [AuthContextProvider.tsx](../../apps/web/src/AuthContextProvider.tsx), [auth.route.ts](../../apps/api/src/routes/auth.route.ts)

There is no logout endpoint. The browser `logout` function only clears React state and the in-memory access token; it does not clear the refresh cookie or revoke anything server-side. There is no refresh-token family, replacement marker, reuse alert, or revoke-all operation.

Realistic attack:

1. A victim clicks logout in the application.
2. The browser still retains the HttpOnly refresh cookie because no response clears it.
3. An attacker who obtained the refresh token before logout continues refreshing it. The victim's logout provides no server-side containment.

A second scenario applies after rotation is added incorrectly: if an old token is accepted by a non-atomic lookup followed by a separate update, two concurrent requests can both succeed. Without family reuse detection, a copied old token remains indistinguishable from a legitimate race.

Fix:

- Add `POST /api/auth/logout` that revokes the current session and clears the cookie with matching `path`, `secure`, and `sameSite` attributes.
- Add revoke-current-session and revoke-all-sessions operations for account recovery.
- Persist `tokenId`, `parentTokenId` or family ID, `expiresAt`, `revokedAt`, `replacedBy`, and last-use metadata.
- Treat a request using a replaced token as token reuse: revoke the entire session family and require re-authentication.
- Make refresh compare-and-swap atomic, preferably with a unique token ID and a conditional update.

### A-04: Single stored token and refresh races

Severity: High
Category: Race condition / session integrity

Evidence: [user.ts](../../packages/db/src/models/user.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts)

The user document has one `refreshToken` field. Login replaces it, so a second login invalidates the first device without a deliberate session policy. Current refresh does not mutate the field, so simultaneous refresh requests both pass the equality check and both issue access tokens. If rotation is added by simply saving a new token after the check, two concurrent requests can both observe the old token and both rotate successfully.

Realistic attack and failure mode:

- A stolen token and a victim browser refresh at nearly the same time can both receive valid access tokens.
- Two browser tabs can trigger refresh concurrently, producing inconsistent cookie state if the implementation is changed to rotate without an atomic conditional update.
- A user cannot revoke one device without revoking every device because the data model has no session identity.

Fix:

- Use one session document per login/device, not a field on the user.
- Perform `findOneAndUpdate` with a condition on the current token ID/state and update the replacement state atomically.
- Define the race policy explicitly: one request wins; the loser gets an authentication error unless it is an allowed short grace-window retry with the same replacement token.
- Test concurrent refresh with the same token and assert reuse detection.

### A-05: Account enumeration and unrestricted brute force

Severity: High
Category: Credential attack

Evidence: [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [auth.ts](../../packages/validation/src/auth.ts), [auth.route.ts](../../apps/api/src/routes/auth.route.ts)

Unknown users produce `404 NOT_FOUND`; known users with a wrong password produce `401 INVALID_PASSWORD`. This is an unauthenticated oracle for valid email/username values. Login, registration, and refresh have no rate limiting, progressive delay, account/IP failure tracking, or alerting.

Realistic attack:

1. Attacker submits a list of candidate emails to `POST /api/auth/login` with an invalid password.
2. Attacker records which responses are `404` versus `401`.
3. Attacker runs password spraying against the confirmed accounts without an API throttle.

Impact: targeted credential stuffing and privacy leakage. Registration duplicate responses can provide a second identity oracle for known emails/usernames.

Fix:

- Return one generic `401` response for unknown user and bad password, with similar work/timing.
- Rate-limit by IP and normalized account identifier, with distributed storage in multi-instance deployments.
- Add password spraying detection, bounded backoff, and security notifications.
- Avoid revealing whether registration identifiers already exist; use a consistent response where product requirements allow.

### A-06: Overly permissive access-token extraction

Severity: Medium
Category: Credential exposure / request confusion

Evidence: [verifyJwt.middleware.ts](../../apps/api/src/middlewares/verifyJwt.middleware.ts)

The access middleware accepts a token from `req.body.accessToken`, `Authorization`, or `req.cookies.accessToken`. The Authorization value is split on a space without checking that the scheme is `Bearer` or that there is exactly one token. The application client currently sends the token in an Authorization header, but the additional paths create unnecessary credential locations.

Realistic attack or failure mode:

- A token placed in a JSON body can be logged by middleware, API gateways, debugging tools, or application telemetry that would normally redact Authorization headers.
- A future endpoint that accepts arbitrary JSON may unintentionally become an authentication-token sink.
- A future feature that sets an access cookie can silently introduce CSRF exposure because the middleware already trusts cookies.

Fix:

- Accept only `Authorization: Bearer <token>` after strict parsing, or deliberately adopt an HttpOnly-cookie architecture with CSRF protection.
- Remove body and access-cookie token support.
- Redact Authorization and Cookie values in all logs and error reports.
- Reject malformed schemes and multiple credentials rather than selecting a token by position.

### A-07: JWT claims and current account state are not fully enforced

Severity: Medium
Category: Authorization policy

Evidence: [verifyJwt.middleware.ts](../../apps/api/src/middlewares/verifyJwt.middleware.ts), [user.ts](../../packages/db/src/models/user.ts), [express.d.ts](../../apps/api/src/types/express.d.ts)

`jwt.verify` validates the signature and standard time claims but the code does not specify an allowed algorithm, issuer, audience, or required claim schema. The decoded payload is cast directly to `AuthUserPayload`. Access-token requests do not check that the user still exists, is active, or has current authorization state. The token contains username and email claims that can become stale after account changes.

There is no current admin/role route in the reviewed API, so a direct role-escalation exploit is not demonstrated. The risk becomes material as soon as role-bearing endpoints are added: a long-lived access token can retain claims after a role downgrade or account disablement.

Realistic attack/failure mode:

1. User access is downgraded or the account is deleted.
2. An already-issued 15-minute access token continues to authorize requests because middleware trusts the token alone.
3. A future privileged route that trusts token claims would preserve stale privilege until expiry.

Fix:

- Configure explicit JWT algorithms, issuer, audience, and a strict expiry policy.
- Validate decoded claims with a schema and use a canonical `sub`/`userId` claim.
- Decide whether account disablement and high-risk privilege changes require token version checks or a current-user lookup.
- Keep authorization decisions in server-side policy code, not only in client-visible claims.
- Do not expose role claims without tests for downgrade/revocation behavior.

### A-08: Cookie and CSRF posture depends on deployment environment

Severity: Medium
Category: CSRF / cookie security

Evidence: [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts), [server.ts](../../apps/api/src/server.ts), [.env.example](../../apps/api/.env.example), [client.ts](../../apps/web/src/api/client.ts)

The refresh cookie is HttpOnly and path-scoped to `/api/auth/refresh`, which limits accidental exposure. In production it is `Secure` and `SameSite=Strict`; in non-production it is not Secure and uses `SameSite=Lax`. CORS allows one environment-provided origin with credentials, but startup does not validate that the value is a trusted origin.

The current business API uses an in-memory access token in an Authorization header, so ordinary cross-site requests cannot supply that header without a successful CORS preflight. The refresh endpoint is still cookie-authenticated and has no CSRF token or Origin/Referer validation. `SameSite=Strict` materially reduces cross-site browser submission in production, but the protection can be weakened by a lax development deployment, a same-site attacker origin, a misconfigured reverse proxy, or future cookie/domain changes.

Realistic attack scenarios:

- A malicious page attempts a credentialed `POST /api/auth/refresh`. In a correctly configured production browser context, SameSite may block the cookie; the API still has no explicit CSRF defense if deployment changes the cookie policy.
- A compromised subdomain or same-site application may be able to cause requests depending on the site topology and cookie domain/path configuration.
- If a future access token is placed in a cookie, all state-changing endpoints become directly CSRF-relevant.

Fix:

- Keep refresh tokens in a host-only cookie using a `__Host-` name where compatible: Secure, Path=/, and no Domain; keep the refresh route itself narrow through server routing rather than cookie Domain scope.
- Add an Origin allowlist check and/or a CSRF token for cookie-authenticated state-changing endpoints. Reject unexpected Origin values.
- Validate `CORS_ORIGIN` at startup and never reflect arbitrary request origins with credentials.
- Use HTTPS everywhere outside an explicitly isolated local environment. Set `Secure` based on deployment configuration, not only `NODE_ENV`.
- Document whether frontend and API are same-site or cross-site and test the real browser behavior.

### A-09: Weak password and identity handling

Severity: Medium
Category: Password security / account integrity

Evidence: [auth.ts](../../packages/validation/src/auth.ts), [user.ts](../../packages/db/src/models/user.ts), [auth.controller.ts](../../apps/api/src/controllers/auth.controller.ts)

Passwords require only six characters. Bcrypt is used with cost 10, which is a reasonable baseline but should be benchmarked for the production hardware. Emails and usernames are not trimmed or normalized before lookup/storage. Login chooses email whenever both email and username are supplied, and there is no explicit mutual-exclusion rule.

Realistic attack/failure modes:

- Password spraying becomes more viable against a six-character policy, especially without rate limiting.
- Case or whitespace variants can produce duplicate identities, inconsistent login behavior, and confusing account recovery.
- If a future password update uses `findOneAndUpdate`, the `pre("save")` hook will not hash it, potentially storing a plaintext password. The current code has no password-change endpoint, but the model organization makes this an easy future regression.

Fix:

- Normalize and validate email/username at the boundary, define case sensitivity, and enforce it with database indexes/collation.
- Use a modern password policy, breached-password checks, and a measured bcrypt cost or memory-hard password hash where operationally appropriate.
- Centralize password changes in a credential service that always hashes and invalidates sessions.
- Require exactly one login identifier or define a deterministic, documented precedence with validation.

### A-10: Authorization is local and easy to omit as the API grows

Severity: High
Category: Authorization architecture

Evidence: [transaction.controller.ts](../../apps/api/src/controllers/transaction.controller.ts), [metrics.controller.ts](../../apps/api/src/controllers/metrics.controller.ts), [verifyJwt.middleware.ts](../../apps/api/src/middlewares/verifyJwt.middleware.ts)

The API has authentication middleware but no explicit authorization layer or ownership abstraction. Controllers directly construct Mongoose queries with optional `req.user?._id`. This makes correct tenant scoping a convention rather than an enforced boundary; the transaction mutation defect demonstrates that the convention has already failed.

Realistic attack path:

1. A new endpoint is added by copying the existing controller style.
2. The developer validates the access token but queries by a client-provided ID or omits the user predicate.
3. Every authenticated user gains access to another user's resource, even though authentication tests pass.

Fix:

- Introduce an authenticated request type that guarantees a validated user ID after middleware.
- Add service/repository methods whose signatures require `ownerId` and never accept an unscoped resource lookup for user-owned data.
- Review all endpoints with an authorization matrix: anonymous, authenticated self, authenticated other-user, and privileged roles.
- Add negative cross-user tests as a release gate.

## Token and Cookie Lifecycle Assessment

| Lifecycle point         | Current behavior                                                                        | Security result                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Register/login          | Signed refresh JWT is written to an HttpOnly cookie and stored raw in the user document | Cookie JavaScript theft is reduced, but token theft remains account takeover material |
| Access request          | Token is accepted from body, header, or access cookie; signature/expiry only            | Multiple credential sinks; stale account state remains valid until expiry             |
| Refresh                 | Cookie JWT is verified and compared with the stored raw token                           | Validates possession but does not rotate or detect reuse                              |
| Concurrent refresh      | Both requests can pass the same equality check                                          | Replay/race succeeds; no one-time-use guarantee                                       |
| Logout                  | Client clears memory only                                                               | Server cookie and session remain valid                                                |
| Password/security event | No password-change or revoke-all flow                                                   | No reliable containment mechanism                                                     |
| Expiry                  | Refresh JWT and cookie are both seven days                                              | Replay window is up to seven days; no idle timeout                                    |

## Recommended Remediation Order

### P0: Immediately block unauthorized access

1. Fix transaction update/delete queries to include the authenticated owner and add two-user negative tests.
2. Audit every authenticated endpoint for owner scoping, including future metrics and profile operations.
3. Remove body and cookie access-token extraction; enforce strict Bearer parsing.
4. Add generic login errors and rate limits before exposing the API to real users.

### P1: Replace the session model

1. Create a server-side session/token collection with hashed opaque refresh tokens, expiry, family ID, replacement state, and revocation timestamps.
2. Implement atomic rotation and refresh-token reuse detection.
3. Add logout, revoke-current-session, revoke-all-sessions, password-change invalidation, and security-event logging.
4. Validate JWT algorithm, issuer, audience, subject, expiry, and payload shape.
5. Add current-user/active-session checks where immediate revocation is required.

### P1: Close browser and credential abuse paths

1. Validate CORS origins at startup and add Origin checks or CSRF tokens for cookie-authenticated requests.
2. Use a host-only Secure refresh cookie in all non-local environments and clear it with exact matching attributes.
3. Normalize account identifiers and strengthen password policy.
4. Redact cookies and Authorization headers in logs and telemetry.

### P2: Make authorization durable

1. Introduce authenticated-request types, authorization policy functions, ownership-scoped repositories, and an endpoint authorization matrix.
2. Add integration tests for token expiry, tampering, wrong issuer/audience/algorithm, deleted users, disabled users, cross-user IDs, concurrent refresh, logout, and cookie behavior in a real browser.
3. Add CI security gates for these tests, dependency auditing, and secret/config validation.

## Verification Targets

The fixes should be considered complete only when the following are demonstrated:

- A user cannot update or delete another user's transaction, even with a valid ID and access token.
- An old refresh token fails after successful rotation, and its reuse revokes the affected session family.
- Two concurrent refresh requests have one defined winner and do not both mint independent valid sessions.
- Logout invalidates the server-side session and clears the browser cookie.
- Login responses do not reveal whether an account exists, and repeated attempts are throttled.
- Access tokens with invalid algorithm, issuer, audience, subject shape, or stale/disabled identity are rejected according to policy.
- Cross-site requests cannot use the refresh session to perform protected state changes.
- Cookies and Authorization headers are absent from application logs and error telemetry.
