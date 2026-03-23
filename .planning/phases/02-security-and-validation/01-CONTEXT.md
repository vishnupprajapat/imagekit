# Phase 2: Security & Validation - Context

## Objective
Firm up the security of backend handlers by authenticating payloads strictly and preventing secret exposure.

## Requirements Covered
- **SEC-01**: Add input validation using Zod for uploads and auth routes.
- **SEC-02**: Ensure ImageKit API secrets (private keys) are strictly handled server-side and only return `token`, `expire`, and `signature` to the client.

## Contextual Notes
- The plugin provides `generateAuth(client)` via `src/services/imagekit.service.ts` which is intended to be used by the consumer's server-side API (e.g. Next.js Route Handler at `/api/imagekit/auth`).
- `generateAuth(client)` currently never returns the `privateKey`. It only returns `token`, `expire`, `signature`, and `publicKey`. The `publicKey` is required by the client SDK and is safe to expose. Therefore, SEC-02 is essentially architecturally sound, but must be strictly enforced via types.
- We need to introduce `zod` to validate inputs to `uploadFile()`, `uploadUrl()`, and `generateAuth()`.
