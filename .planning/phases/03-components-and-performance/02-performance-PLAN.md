---
wave: 2
depends_on: ["01-ui-refactor-PLAN.md"]
files_modified: ["src/util/directUpload.ts", "package.json"]
autonomous: true
requirements: ["PERF-01", "PERF-02"]
---

# 02 Caching and Debouncing

## Overview
Implement an in-memory cache directly inside `directUpload.ts` to intercept redundant `/api/imagekit/auth` validation requests. Then introduce debounce for rapid UI triggers using pure JS or lodash.

## Tasks

<task>
<objective>Add Server Auth Response Caching</objective>
<read_first>
- src/util/directUpload.ts
</read_first>
<action>
1. In `src/util/directUpload.ts`, declare a singleton variable representing local scope cache:
   `let cachedAuth: { token: string, signature: string, expire: number } | null = null;`
2. Update the `directUploadToImageKit` function. Before calling `fetch('/api/imagekit/auth')`, check if `cachedAuth` exists *and* the current Unix timestamp (`Date.now() / 1000`) is strictly less than `cachedAuth.expire - 60` (allowing a 1-minute buffer before expiration).
3. If criteria is met, skip the network request entirely and use `cachedAuth` logic instead.
4. If criteria is missed or `cachedAuth` is null, perform the `fetch` and update `cachedAuth` using `authResponse`.
</action>
<acceptance_criteria>
1. Successive uploads within 30 minutes no longer spam the `fetch('/api/imagekit/auth')` endpoint.
</acceptance_criteria>
</task>

<task>
<objective>Debounce file stage triggers</objective>
<read_first>
- src/hooks/useUploader.ts
</read_first>
<action>
1. Install lodash bindings via `npm install lodash.debounce` and `npm install -D @types/lodash.debounce`.
2. In `src/hooks/useUploader.ts`, import the new libraries.
3. Wrap intensive URL validation or upload actions (e.g., `handlePaste` triggering) inside `debounce(..., 300)` closures so that rapid user activity doesn't accidentally branch duplicate file staging flows.
</action>
<acceptance_criteria>
1. The `package.json` contains `lodash.debounce`.
2. `useUploader.ts` guards the core events with 300ms delays where necessary.
</acceptance_criteria>
</task>

## Verification
- Ensure `npm run lint` and `npm run type-check` both succeed over the modified utilities.
- Confirm theoretically via logs or review that `cachedAuth` maintains integrity and applies gracefully to `reactUpload` parameter mapping.
