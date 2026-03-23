---
wave: 1
depends_on: []
files_modified: ["package.json", "src/util/validation.ts", "src/services/imagekit.service.ts"]
autonomous: true
requirements: ["SEC-01", "SEC-02"]
---

# 01 Zod Authentication and Settings Validation

## Overview
Install `zod` and implement strict runtime validation for the parameters fed into the services layer. This hardens the plugin against malformed inputs and satisfies SEC-01 and SEC-02.

## Tasks

<task>
<objective>Install Zod and prepare validation schema definitions</objective>
<read_first>
- src/util/types.ts
</read_first>
<action>
1. Run `npm install zod`.
2. Create `src/util/validation.ts`.
3. Import `zod` and define `ImageKitSettingsSchema` which validates parameters mapped to `ImageKitNewAssetSettings` (e.g. `fileName` as optional string, `tags` as optional array of strings, `isPrivate` as optional boolean, `folder` as optional string, `useUniqueFileName` as optional boolean).
4. Export the schema.
</action>
<acceptance_criteria>
1. `cat package.json | grep zod` succeeds.
2. `src/util/validation.ts` exports `ImageKitSettingsSchema` correctly.
</acceptance_criteria>
</task>

<task>
<objective>Inject Zod runtime validation into the service layer execution paths</objective>
<read_first>
- src/util/validation.ts
- src/services/imagekit.service.ts
</read_first>
<action>
1. In `src/services/imagekit.service.ts`, import `ImageKitSettingsSchema` from `../util/validation`.
2. Locate the exported `uploadFile` and `uploadUrl` functions.
3. Before proceeding with the core logic block (e.g. inside `switchMap` or `defer`), validate the `settings` argument via `ImageKitSettingsSchema.parse(settings)`.
4. If validation throws a `ZodError` during parsing, it should be gracefully caught within the RxJS stream pipeline and propagated as a `throwError(() => new Error(\`Validation Error: \${err.message}\`))` to elegantly fail the observable with the validation details rather than throwing an unhandled JS exception.
</action>
<acceptance_criteria>
1. `src/services/imagekit.service.ts` imports and invokes `ImageKitSettingsSchema.parse()` during uploads.
</acceptance_criteria>
</task>

## Verification
- Run `npm run type-check` to verify no types are broken.
- Verify `npm run lint` passes successfully.

## Must Haves
- The observable must emit a controlled error via RxJS throwing mechanism rather than a raw Node exception if validation fails.
