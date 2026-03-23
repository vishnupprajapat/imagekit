# Codebase Architecture

## System Design
The codebase follows a standard Sanity v3 plugin architecture.
- **Entry Point**: `src/_exports/index.ts` exports the main `imageKitPlugin` definition. 
- **Plugin Definition**: Uses `definePlugin` to register custom schema types and a studio tool.
- **Data Flow**: 
  - An editor uploads a video via the custom input component in the Studio.
  - The component authenticates with ImageKit using a private Sanity token document (`secrets.imagekit`).
  - The video is uploaded directly from the browser to ImageKit.
  - A reference document of type `imagekit.videoAsset` is created in Sanity to store the ImageKit file ID, URL, and metadata.
  - The custom input component (`src/components/Input/index.tsx`) renders the video player or thumbnail in the studio based on this data.

## Key Components
- **Input Component**: Renders the UI for selecting, uploading, and managing videos.
- **Studio Tool**: A custom Sanity tool (located in `src/components/StudioTool`) likely used for managing configuration or browsing uploaded assets.
- **Schema Layer**: `src/schema.ts` defines the `imagekit.video` object type (used in user schemas) and the `imagekit.videoAsset` document type (used to store the actual metadata).
- **Custom Rendering**: `src/plugin.tsx` acts as the bridge that connects the React components to the Sanity schema definitions.
