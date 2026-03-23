# Codebase Integrations

## Core Integrations

### 1. Sanity Studio (v3)
- **Purpose**: The plugin provides a custom input component for Sanity Studio to handle video assets.
- **Integration Points**: 
  - `definePlugin` API in `src/_exports/index.ts`.
  - Custom schema types (`imagekit.video`).
  - Studio UI components using `@sanity/ui` and `@sanity/icons`.

### 2. ImageKit.io
- **Purpose**: Video processing, encoding, hosting, and delivery.
- **Libraries Used**: 
  - `imagekit` (Node SDK)
  - `imagekitio-react` & `@imagekit/react` (React SDKs for frontend video rendering).
- **Integration Points**: 
  - API token validation and authenticating uploads (likely using `crypto-js` and `jsonwebtoken-esm`).
  - Direct video uploads to ImageKit from the Sanity Studio interface.
  - Signed URLs support for private video assets.

## Authentication & Security
- **JWT (`jsonwebtoken-esm`)**: Used for creating or verifying signed tokens for ImageKit authentication.
- **Crypto-JS (`crypto-js`)**: Used for cryptographic operations required by the ImageKit API (e.g., generating signatures).
- **Sanity Secrets**: The plugin expects ImageKit API keys to be stored in a private Sanity document (`secrets.imagekit`), keeping them hidden from unauthorized editors.
