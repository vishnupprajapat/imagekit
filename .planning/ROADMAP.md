# Project Roadmap

## Phase 1: Architectural Foundation
**Goal:** Restructure the project into a clean architecture with centralized logic and strong typing.
**Requirements:** ARCH-01, ARCH-02, ARCH-03, TYPE-01, SDK-01
**Depends on:** None

**Plans:**
- Create clean architecture directories (`services/`, `controllers/`, `types/`, etc.).
- Consolidate all standalone upload and auth functions into `services/imagekit.service.ts`.
- Refactor the singleton `imageKitClient` into a testable `ImageKitService` class.
- Provide strong, centralized TypeScript models in `types/`.

**Success Criteria:**
1. The `src/actions/` folder is reduced or eliminated in favor of unified `services/`.
2. Duplicated logic files (like `upload-fix.ts`) are completely removed from the project.

---

## Phase 2: Security & Validation
**Goal:** Firm up the security of backend handlers by authenticating payloads strictly and preventing secret exposure.
**Requirements:** SEC-01, SEC-02
**Depends on:** Phase 1

**Plans:**
- Install Zod and write validation schemas for auth endpoints and upload parameters.
- Audit the metadata auth endpoint to ensure the ImageKit private key is absolutely not exposed in the client network response.

**Success Criteria:**
1. Invalid payloads are rejected early by Zod.
2. The UI client only receives `token`, `expire`, and `signature`.

---

## Phase 3: Components & Performance Optimization
**Goal:** Separate UI from business logic and improve client performance via caching and debouncing.
**Requirements:** UI-01, UI-02, PERF-01, PERF-02
**Depends on:** Phase 2

**Plans:**
- Restructure `components/` into `components/uploader/` containing `FileInput`, `Preview`, and a new `useUploader.ts` custom hook.
- Implement token caching (SWR/context) to avoid excessive backend auth requests.
- Add debouncing for file selection or metadata triggers.

**Success Criteria:**
1. The UI components are purely presentational and rely on `useUploader.ts` for state logic.
2. Network tabs show reduced volume of auth requests for identical tokens.

---

## Phase 4: DX, Testing, and Cleanup
**Goal:** Add test coverage, update out-of-date documentation, and enforce code quality.
**Requirements:** DOCS-01, QUAL-01, QUAL-02
**Depends on:** Phase 1

**Plans:**
- Install Vitest and `@testing-library/react`.
- Write unit tests for the newly created `services/imagekit.service.ts` and the `ImageKitService` class.
- Clean up `README.md` templates.
- Enforce ESLint/Prettier rules locally.

**Success Criteria:**
1. `npm test` runs successfully with at least 3 high-value tests.
2. The GitHub Readme has correct URLs and clean guidelines.
