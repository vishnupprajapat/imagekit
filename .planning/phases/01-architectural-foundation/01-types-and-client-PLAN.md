---
wave: 1
depends_on: []
files_modified: ["src/types/imagekit.ts", "src/types/api.ts", "src/clients/imageKitClient.ts"]
autonomous: true
requirements: ["TYPE-01", "SDK-01"]
---

# 01 Types and Client

## Overview
Extract inline TypeScript interfaces into centralized definitions and refactor the `ImageKitClient` into an injected `ImageKitService` class to satisfy TYPE-01 and SDK-01.

## Tasks

<task>
<objective>Create centralized types for the application</objective>
<read_first>
- src/clients/imageKitClient.ts
</read_first>
<action>
1. Create `src/types/imagekit.ts`.
2. Move `ImageKitUploadResponse` and `ImageKitFileDetails` interfaces from `src/clients/imageKitClient.ts` into `src/types/imagekit.ts` and export them.
3. Update any imports in `src/clients/imageKitClient.ts` to consume the interfaces from the new `types` folder.
</action>
<acceptance_criteria>
1. `cat src/types/imagekit.ts | grep "export interface ImageKitUploadResponse"` succeeds.
2. `src/clients/imageKitClient.ts` correctly imports types from `../types/imagekit`.
</acceptance_criteria>
</task>

<task>
<objective>Refactor imageKitClient.ts into a class-based ImageKitService</objective>
<read_first>
- src/clients/imageKitClient.ts
- src/types/imagekit.ts
</read_first>
<action>
1. Refactor `src/clients/imageKitClient.ts` so that it exports an `ImageKitService` class.
2. The class constructor must accept a `secrets: ConfiguredSecrets` argument and initialize `this.client = new ImageKit({...})`.
3. Add class methods `testCredentials()`, `getFileDetails(fileId: string)`, and `listFiles(options: Record<string, unknown>)` that internally call the instance `this.client`.
4. Preserve the `directUploadToImageKit` structure, either moving it to the class or adapting the service to call it reliably.
</action>
<acceptance_criteria>
1. `cat src/clients/imageKitClient.ts | grep "export class ImageKitService"` succeeds.
</acceptance_criteria>
</task>

## Verification
- Run `npx tsc --noEmit` to ensure types resolve correctly.

## Must Haves
- The `ImageKitService` must be a class structure instead of standalone exported functions.
