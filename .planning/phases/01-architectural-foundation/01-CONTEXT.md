# Phase 1: Architectural Foundation - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** User-provided architectural review

<domain>
## Phase Boundary

Restructuring the project into a clean architecture with centralized logic and strong typing, without adding new UI features or changing the core ImageKit video asset management flow.
</domain>

<decisions>
## Implementation Decisions

### High-Level Architecture
- Implement clean architecture by moving logic into `src/services/`, `controllers/`, `routes/`, `clients/`, `components/`, `utils/`, and `types/` directories.
- Separation of concerns: Controller -> request/response, Service -> business logic, Client -> external API.

### Actions Consolidation
- Merge `imagekitAuth.ts`, `generateImageKitAuth.ts`, `upload.ts`, and `upload-fix.ts` into a centralized `services/imagekit.service.ts`.
- Unified exports must include: `generateAuth`, `uploadFile`, `deleteAsset`.
- Delete the old, unused/duplicated action files (e.g., `upload-fix.ts`).

### ImageKit Client Refactor
- Refactor the current tightly-coupled `imageKitClient.ts`.
- Move to a class-based injectible service: `class ImageKitService { constructor(private client) {} upload(file) {} delete(fileId) {} getAuth() {} }`.

### Type Safety Centralization
- Add a central `types/` folder.
- Create `imagekit.ts` and `api.ts` within this folder.
- Export interfaces such as `UploadResponse { url: string; fileId: string; }`.

### the agent's Discretion
- The exact implementation details of adapting the new controllers to Sanity's specific plugin architecture.
- Any implicit imports or minor utility extractions needed to make the code compile cleanly.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.
</canonical_refs>
