# Project Roadmap

## Phase 1: DX and Testing Infrastructure
**Goal:** Fix documentation placeholders and lay the foundation for automated testing.
**Requirements:** DOCS-01, DOCS-02, QUAL-01
**Depends on:** None

**Plans:**
- Ensure `.planning` directory and `gsd` are correctly tracked.
- Add Vitest and `@testing-library/react` to `devDependencies`.
- Update `package.json` test scripts to use Vitest.
- Update `README.md` to point to the correct GitHub URLs.

**Success Criteria:**
1. Running `npm run test` natively executes the Vitest test runner instead of just linting.
2. The GitHub Readme has no placeholder URLs.

---

## Phase 2: Core Test Coverage
**Goal:** Add unit tests to the most critical paths (schema definitions and Custom Rendering components).
**Requirements:** QUAL-02
**Depends on:** Phase 1

**Plans:**
- Write test files for `src/schema.ts` ensuring schema types are defined properly.
- Write component tests for `<Input />` and `<VideoThumbnail />` (in `src/components/`).
- Write tests for `imageKitVideoCustomRendering` in `src/plugin.tsx`.

**Success Criteria:**
1. At least 3 passing unit tests for the core logic.
2. Code coverage indicates the core components are tested.

---

## Phase 3: Image Assets Support
**Goal:** Expand the plugin to support another ImageKit type: `image`.
**Requirements:** FEAT-01, FEAT-02
**Depends on:** Phase 2

**Plans:**
- Add `imagekit.image` and `imagekit.imageAsset` schema definitions to `src/schema.ts`.
- Expand the frontend component to gracefully handle and preview `image` types as well as `video` types.
- Ensure the plugin configuration accepts defaults suitable for images.

**Success Criteria:**
1. A new `imagekit.image` schema field type is available for developers using the plugin.
2. Uploading an Image component triggers ImageKit upload properly and stores an `imagekit.imageAsset` document in Sanity.
