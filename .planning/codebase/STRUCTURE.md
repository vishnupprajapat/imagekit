# Codebase Structure

## Directory Layout
- `src/` - All plugin source code
  - `_exports/` - Contains the public API surface of the plugin (`index.ts`).
  - `actions/` - Likely contains state management actions.
  - `clients/` - API clients, probably for communicating with ImageKit APIs or Sanity clients.
  - `components/` - The React components for the studio UI.
    - `Input/` - The custom input component for the `imagekit.video` schema type.
    - `StudioTool/` - The custom studio tool interface.
    - `VideoThumbnail/` - Component for rendering video previews in Sanity lists.
  - `context/` - React Context providers for global state management.
  - `hooks/` - Custom React hooks (e.g., for fetching auth tokens, managing uploads, etc).
  - `routes/` - Routing logic for the custom studio tool.
  - `sanity/` - Sanity-specific utilities.
  - `util/` - Helper functions and TypeScript type definitions (`types.ts`).

## Entry Points
- `src/_exports/index.ts` - Main entry point that consumers of the `sanity-plugin-imagekit-plugin` package import.
- `src/plugin.tsx` - Wires up the React components (`Input`, `VideoThumbnail`) to the Sanity schema via `components` and `preview` overrides.
- `src/schema.ts` - Central location for all Sanity schema definitions provided by the plugin.
