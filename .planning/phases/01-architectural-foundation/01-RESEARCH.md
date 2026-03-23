# Phase 1: Architectural Foundation - Research

## Objective
Research how to implement Phase 1: Architectural Foundation, specifically understanding what is needed to plan the refactor cleanly without breaking existing Sanity integrations.

## Findings

### 1. The RxJS Observable Constraint (CRITICAL)
The files `src/actions/upload.ts` and `src/actions/upload-fix.ts` are structurally complex because they return RxJS `Observable<UploadEvent>` streams (`switchMap`, `defer`, `concat`).
**Why this matters:** Sanity Studio v3 custom asset sources rely on these observable streams to render the upload progress bar and handle success/error events in the UI natively.
**Impact on Plan:** When we move `uploadFile` into `src/services/imagekit.service.ts` or a hook, the signature **MUST** remain `Observable<UploadEvent>`. A simple `async/await` rewrite will break the entire Sanity upload UI.

### 2. Action Consolidation
- `upload.ts` and `upload-fix.ts` are heavily duplicated. `upload-fix.ts` contains `enhancedUploadFile` and `checkUploadLimits`. These should be merged into `imagekit.service.ts` and the duplicate files deleted.
- `imagekitAuth.ts` and `generateImageKitAuth.ts` (if it exists) do the exact same thing: retrieve Sanity secrets and call `imagekit.getAuthenticationParameters()`.

### 3. The ImageKit Client Class Refactor
Currently, `src/clients/imageKitClient.ts` exports individual functions: `createImageKitClient`, `uploadToImageKit`, `getFileDetails`, `listFiles`.
The user requested a class-based approach:
```ts
export class ImageKitService {
  private client: ImageKit;
  constructor(secrets: ConfiguredSecrets) {
    this.client = new ImageKit({...});
  }
  async getAuth() { ... }
  async upload(file) { ... }
  async deleteAsset(id) { ... }
}
```
If we do this, the RxJS streams in the Sanity action layer will simply call these class methods inside their `defer()` blocks.

### 4. Type Safety Centralization
`src/clients/imageKitClient.ts` currently houses `ImageKitUploadResponse` and `ImageKitFileDetails`. We need to move these, along with `ConfiguredSecrets`, into `src/types/imagekit.ts`.

## Conclusion
The architectural rewrite is highly feasible, but the executing agent must be explicitly warned to preserve the `rxjs/Observable` return types in the service layer when migrating the upload functions, otherwise the integration will fail.

## RESEARCH COMPLETE
