---
wave: 2
depends_on: ["01-types-and-client-PLAN.md"]
files_modified: ["src/services/imagekit.service.ts"]
autonomous: true
requirements: ["ARCH-01", "ARCH-02"]
---

# 02 Abstract to Clean Architecture Services

## Overview
Move the scattered auth and upload logic into a unified `src/services/imagekit.service.ts` file, satisfying ARCH-01 and ARCH-02.

## Tasks

<task>
<objective>Consolidate upload operations into imagekit.service.ts</objective>
<read_first>
- src/actions/upload.ts
- src/actions/upload-fix.ts
- src/actions/imagekitAuth.ts
- .planning/phases/01-architectural-foundation/01-RESEARCH.md
</read_first>
<action>
1. Create `src/services/imagekit.service.ts`.
2. Move the `uploadFile` and `uploadUrl` implementations from `src/actions/upload.ts` (and fix equivalents) into this new service.
3. CRITICAL: The exported `uploadFile` and `uploadUrl` functions MUST continue returning `Observable<UploadEvent>` to ensure compatibility with Sanity's `AssetSource` component.
4. Integrate the newly created `ImageKitService` class from `src/clients/imageKitClient.ts` where necessary inside the rx streams.
</action>
<acceptance_criteria>
1. `cat src/services/imagekit.service.ts | grep "export function uploadFile"` succeeds.
2. `cat src/services/imagekit.service.ts | grep "Observable<UploadEvent>"` succeeds.
</acceptance_criteria>
</task>

<task>
<objective>Consolidate auth operations into imagekit.service.ts</objective>
<read_first>
- src/actions/imagekitAuth.ts
- src/services/imagekit.service.ts
</read_first>
<action>
1. Copy the logic from `generateImageKitAuth` (in `src/actions/imagekitAuth.ts`) and append it as an exported `generateAuth` function inside `src/services/imagekit.service.ts`.
2. It must continue to retrieve the secrets via `client.fetch` and initialize the local or class-based `ImageKit` instance to generate authentication parameters (`getAuthenticationParameters()`).
</action>
<acceptance_criteria>
1. `cat src/services/imagekit.service.ts | grep "export async function generateAuth"` succeeds.
</acceptance_criteria>
</task>

## Verification
- Ensure `src/services/imagekit.service.ts` successfully compiles via `npx tsc --noEmit`.

## Must Haves
- The `uploadFile` and `uploadUrl` functions must explicitly retain the `Observable<UploadEvent>` signature as highlighted by the research phase.
