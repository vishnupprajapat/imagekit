# Codebase Conventions

## Code Style & Formatting
- **Prettier**: Enforces strict code formatting. Run via `npm run format`.
- **ESLint**: Uses `@sanity/eslint-config` which is the standard linting setup for Sanity v3 plugins.
- **Import Sorting**: Uses `eslint-plugin-simple-import-sort` to ensure consistent import ordering across all files.
- **TypeScript**: Strict mode is enabled (`tsc --noEmit`), ensuring type safety across the plugin.

## React Patterns
- **Functional Components & Hooks**: Modern React patterns are used (no class components).
- **Styling**: `styled-components` is used to style custom UI elements alongside `@sanity/ui` primitives.
- **State Management**: Uses `RxJS` (`react-rx`) and `SWR` for handling asynchronous data fetching and reactivity.

## Naming Conventions
- React components use `PascalCase` (e.g., `StudioTool`, `VideoThumbnail`).
- Utility functions, schema structures, and hooks use `camelCase` (e.g., `imageKitVideoCustomRendering`, `useErrorBoundary`).
- Schema names are heavily namespaced to avoid collisions (e.g., `imagekit.video`, `imagekit.videoAsset`).
