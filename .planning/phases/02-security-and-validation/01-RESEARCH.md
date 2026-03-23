# Phase 2: Security & Validation - Research

## Overview
This phase requires installing `zod` and implementing strict runtime validation schemas for the plugin.

## Findings: Zod Integration Strategy
1. **Target Parameters**:
   - The primary payload vulnerable to incorrect data types is `settings: ImageKitNewAssetSettings` across `uploadFile`, `uploadUrl`, and `enhancedUploadFile` in `src/services/imagekit.service.ts`.
2. **Schema Location**:
   - `src/schema/validation.ts` or `src/utils/validation.ts` should house the Zod schemas.
3. **Execution**:
   - During `uploadFile`, before deferring to the upload observable, we will parse the `settings` object using `ImageKitSettingsSchema.parse(settings)`.
   - If validation fails, `zod` will throw an error, which we catch and emit as an `Observable` error (`throwError(() => new Error(...))`) so it integrates cleanly with the Sanity UI instead of breaking the app.

## Findings: SEC-02 Audit
I have audited `src/services/imagekit.service.ts`. The `generateAuth` function:
- Retrieves `privateKey` from Sanity or env.
- Initializes the server-side SDK.
- Explicitly destructured returns exactly 4 properties: `{ token, expire, signature, publicKey }`.
- The `privateKey` is successfully walled-off. No refactoring needed here as it strictly complies with SEC-02.

## Actionable Plan
1. `npm install zod`.
2. Create `src/util/validation.ts`.
3. Add `ImageKitSettingsSchema` Zod validation to `uploadFile`, `uploadUrl`, and `enhancedUploadFile` within `src/services/imagekit.service.ts`.

## RESEARCH COMPLETE
