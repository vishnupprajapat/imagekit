# Codebase Testing

## Testing Infrastructure
- **Currently Missing**: There is no dedicated unit or integration testing framework (like Vitest or Jest) installed in the `package.json`.
- **Static Analysis**: The `test` command (`npm run test`) relies entirely on static analysis tools:
  1. `npm run lint` (ESLint)
  2. `npm run type-check` (TypeScript)
  3. `npm run build` (@sanity/pkg-utils)

## Recommendations for Improvement
- Setting up a test runner like `Vitest` along with `@testing-library/react` would be highly beneficial for testing the custom input components and the ImageKit API client logic.
- Adding tests for `hooks/` and `clients/` would help ensure the upload process and token management logic remains stable.
