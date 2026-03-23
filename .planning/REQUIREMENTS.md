# v1 Requirements

### High-Level Architecture
- [ ] **ARCH-01**: Implement clean architecture by moving logic into `services/`, `controllers/`, `routes/`, `clients/`, `components/`, `utils/`, and `types/` directories.
- [ ] **ARCH-02**: Consolidate scattered logic from `imagekitAuth.ts`, `generateImageKitAuth.ts`, `upload.ts`, and `upload-fix.ts` into centralized `services/` (e.g., `imagekit.service.ts`).
- [ ] **ARCH-03**: Remove any duplicated logic (like unused auth files and duplicated upload configurations).

### Components & UI
- [ ] **UI-01**: Split `Uploader.tsx`, `FileInputArea.tsx`, and `UploadPlaceholder.tsx` into a `components/uploader/` folder.
- [ ] **UI-02**: Create a custom hook `useUploader.ts` to separate business logic from the UI components.

### Security & Validation
- [ ] **SEC-01**: Add input validation using Zod for uploads and auth routes.
- [ ] **SEC-02**: Ensure ImageKit API secrets (private keys) are strictly handled server-side and only return `token`, `expire`, and `signature` to the client.

### Client Integration & Types
- [ ] **SDK-01**: Refactor `imageKitClient.ts` into an injected `ImageKitService` class to improve testability.
- [ ] **TYPE-01**: Centralize TypeScript interfaces into a `types/` folder (e.g., `imagekit.ts`, `api.ts`).

### Performance
- [ ] **PERF-01**: Temporarily cache auth tokens to avoid repeated backend API calls.
- [ ] **PERF-02**: Debounce active upload triggers where applicable.

### Documentation & Testing
- [ ] **DOCS-01**: Update all placeholder templates in `README.md` to reflect actual URLs.
- [ ] **QUAL-01**: Install an automated testing framework (Vitest).
- [ ] **QUAL-02**: Write unit tests for services (especially the unified `imagekit.service.ts` and `ImageKitService` class).

---

## Out of Scope
- **Complex Asset Editing in Sanity**: Advanced modifications to assets (cropping, trimming, filtering).
- **Image Assets Support**: Explicitly deferred per user request.

## Traceability
<!-- Filled by roadmap -->
