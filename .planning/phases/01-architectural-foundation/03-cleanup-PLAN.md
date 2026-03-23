---
wave: 3
depends_on: ["02-services-PLAN.md"]
files_modified: []
autonomous: true
requirements: ["ARCH-03"]
---

# 03 Cleanup and Redirect Imports

## Overview
Delete the old duplicate files and point existing components/utils to the new `services/` and `clients/` paths context, satisfying ARCH-03.

## Tasks

<task>
<objective>Delete deprecated actions and point old imports to new services</objective>
<read_first>
- src/components/Input/index.tsx
- src/plugin.tsx
</read_first>
<action>
1. Search the `src/` directory for any imports pointing to `../actions/upload`, `../actions/upload-fix`, or `../actions/imagekitAuth`.
2. Update those imports to point to their new location in `../services/imagekit.service.ts`.
3. Search for any imports pointing to `createImageKitClient` and update them to use the `new ImageKitService(secrets)` pattern from `../clients/imageKitClient.ts`.
4. Using bash `rm`, delete the following files entirely:
   - `src/actions/upload.ts`
   - `src/actions/upload-fix.ts`
   - `src/actions/imagekitAuth.ts`
   - `src/actions/generateImageKitAuth.ts` (if it exists)
</action>
<acceptance_criteria>
1. Code search for `import .* from '../actions/upload'` returns zero results.
2. `ls src/actions/upload.ts` returns an error (file no longer exists).
</acceptance_criteria>
</task>

## Verification
- The codebase must compile completely without the deleted files: `npm run type-check`
- `npm run lint` must pass.

## Must Haves
- The legacy `upload.ts` and `upload-fix.ts` action files must be completely removed.
