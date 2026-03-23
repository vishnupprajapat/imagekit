# Codebase Stack

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
