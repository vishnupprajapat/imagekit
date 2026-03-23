# Codebase Concerns

## Technical Debt & Fragile Areas
1. **Lack of Automated Testing**: As noted in `TESTING.md`, there are no unit tests. Any refactoring of the upload flow or API client relies entirely on manual testing and type checking.
2. **Commented-out Schema Code**: `src/schema.ts` contains blocks of commented-out code (e.g., `imageKitVideoMetadata`, privacy fields). This should either be cleaned up or implemented fully to reduce confusion.
3. **Documentation Debt**: The `README.md` file still contains generic placeholders from the Sanity plugin template (e.g., `yourusername/sanity-plugin-imagekit-plugin`, URLs to non-existent forks on Codesandbox).
4. **Scope Limitation**: The plugin currently only provides support for videos (`imagekit.video`). It might be expected by users to also support images.

## Security Considerations
- The plugin handles ImageKit API tokens. These are appropriately stored as private `secrets.imagekit` documents in Sanity, which is the correct pattern. However, any modification to how these tokens are fetched or passed to the frontend must be handled with care to prevent leaks in the Studio UI network tabs.
