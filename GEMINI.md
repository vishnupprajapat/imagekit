<!-- GSD:project-start source:PROJECT.md -->

## Project

**Sanity ImageKit Plugin**

A custom input component and plugin for Sanity Studio v3 that integrates seamlessly with the ImageKit.io video encoding and hosting service. It allows editors to natively upload, manage, and preview ImageKit video assets within Sanity.

**Core Value:** Provide a seamless, reliable way for Sanity editors to upload and manage ImageKit videos without leaving their studio environment.

### Constraints

- **Tech stack**: Must remain compatible with Sanity Studio v3 (React 18/19, `@sanity/ui`).
- **Security**: ImageKit API keys must not be exposed to unauthorized users or leaked to the client unencrypted.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- **TypeScript** (`5.7.3`): Primary language for all source code.
- **JavaScript** (ES6+): For configuration files (e.g., eslint, husky hooks).

## Frameworks & Libraries

- **React** (`^18.3 || ^19`): Core UI library for Sanity Studio components.
- **Sanity Studio v3** (`^3.42.0`): The base CMS framework this plugin extends.
- **Styled Components** (`^5 || ^6`): Used for component styling.
- **RxJS** (`^7.8.1`): Used for reactive state management and event streams, potentially alongside `react-rx`.
- **SWR** (`^2.2.5`): React hooks for data fetching.

## Build & Tooling

- **@sanity/pkg-utils**: Tooling used to build the plugin (`npm run build`).
- **TypeScript Compiler (`tsc`)**: Used for type checking (`npm run type-check`).
- **ESLint & Prettier**: For code formatting and linting (`npm run lint`, `npm run format`).
- **Husky & lint-staged**: Git hooks for pre-commit checks.
- **Semantic Release**: For automated versioning and package publishing.

## Key Configuration Files

- `package.json`: Contains scripts for build, lint, and publish, along with all dependencies.
- `sanity.config.ts`: Base configuration for running the local Sanity dev studio to test the plugin.
- `tsconfig.json` & `tsconfig.dist.json`: TypeScript compiler options.
- `package.config.ts`: Configuration for `@sanity/pkg-utils`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

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
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Design

- **Entry Point**: `src/_exports/index.ts` exports the main `imageKitPlugin` definition.
- **Plugin Definition**: Uses `definePlugin` to register custom schema types and a studio tool.
- **Data Flow**:

## Key Components

- **Input Component**: Renders the UI for selecting, uploading, and managing videos.
- **Studio Tool**: A custom Sanity tool (located in `src/components/StudioTool`) likely used for managing configuration or browsing uploaded assets.
- **Schema Layer**: `src/schema.ts` defines the `imagekit.video` object type (used in user schemas) and the `imagekit.videoAsset` document type (used to store the actual metadata).
- **Custom Rendering**: `src/plugin.tsx` acts as the bridge that connects the React components to the Sanity schema definitions.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
