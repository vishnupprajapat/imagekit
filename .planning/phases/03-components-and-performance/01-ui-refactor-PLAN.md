---
wave: 1
depends_on: []
files_modified: ["src/components/Uploader.tsx", "src/hooks/useUploader.ts", "src/components/uploader/index.tsx"]
autonomous: true
requirements: ["UI-01", "UI-02"]
---

# 01 UI Refactor and Custom Hooks

## Overview
Deconsolidate the massive `Uploader.tsx`. Extract all its state management, reducer behaviors, and event listeners into a headless `useUploader.ts` hook. Then move the visual implementation to `src/components/uploader/index.tsx`.

## Tasks

<task>
<objective>Extract the headless state logic into useUploader hook</objective>
<read_first>
- src/components/Uploader.tsx
</read_first>
<action>
1. Create `src/hooks/useUploader.ts`.
2. Move the `State`, `UploadStatus`, `StagedUpload`, and `UploaderStateAction` interfaces and `INITIAL_STATE` from `Uploader.tsx` into this new file.
3. Define and export `useUploader(client: SanityClient, onChange: any)` which instantiates the `useReducer`.
4. Migrate `startUpload`, `handleUpload`, `handlePaste`, `handleDrop`, `handleDragOver`, `handleDragEnter`, and `handleDragLeave` inside `useUploader`.
5. Return exactly what React components need: `{ state, dispatch, handlers: { startUpload, handleUpload, handlePaste, handleDrop, handleDragOver, handleDragEnter, handleDragLeave, dragState } }`.
</action>
<acceptance_criteria>
1. `useUploader.ts` compiles cleanly and encapsulates the reducer and RxJS `startUpload` observable tracking logic.
</acceptance_criteria>
</task>

<task>
<objective>Restructure UI into the new components/uploader/ directory</objective>
<read_first>
- src/components/Uploader.tsx
</read_first>
<action>
1. Create `src/components/uploader/` if it does not exist.
2. Move `src/components/FileInputArea.tsx` and `src/components/UploadPlaceholder.tsx` into `src/components/uploader/`.
3. Rename and move `src/components/Uploader.tsx` to `src/components/uploader/index.tsx`.
4. Refactor `src/components/uploader/index.tsx` to utilize `useUploader` instead of defining local state. Extract the hook properties and pass them to the underlying UI child components.
5. Fix all relative path imports (e.g. `../Player` becomes `../../Player` or appropriate paths).
</action>
<acceptance_criteria>
1. The new `components/uploader/index.tsx` acts purely as a presentation bridge, drastically smaller than its original 460-line monolith definition.
</acceptance_criteria>
</task>

## Verification
- `npm run type-check` to ensure extracting hooks and moving components didn't sever internal links.
- Review components to ensure `useReducer` and structural hooks are entirely encapsulated in `useUploader`.
