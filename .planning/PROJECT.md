# Sanity ImageKit Plugin

## What This Is

A custom input component and plugin for Sanity Studio v3 that integrates seamlessly with the ImageKit.io video encoding and hosting service. It allows editors to natively upload, manage, and preview ImageKit video assets within Sanity.

## Core Value

Provide a seamless, reliable way for Sanity editors to upload and manage ImageKit videos without leaving their studio environment.

## Requirements

### Validated

- ✓ Manage ImageKit Video Assets within custom schema (`imagekit.video`) — existing
- ✓ Authenticate securely via a private Sanity document (`secrets.imagekit`) — existing
- ✓ Display video thumbnail/previews inside the Sanity Studio UI — existing
- ✓ Directly upload assets from the browser to ImageKit — existing

### Active

- [ ] Update README template placeholders with actual repository information
- [ ] Add an automated testing framework (e.g., Vitest) to run unit/integration tests
- [ ] Expand plugin support to include ImageKit image assets (`imagekit.image`)

### Out of Scope

- Complex video editing features inside Sanity — Users should use the ImageKit dashboard for advanced transformations and edits.

## Context

- The project is a TypeScript-based Sanity v3 plugin built with React and `@sanity/ui`.
- It currently operates correctly for videos, but lacks unit tests and documentation polish.

## Constraints

- **Tech stack**: Must remain compatible with Sanity Studio v3 (React 18/19, `@sanity/ui`).
- **Security**: ImageKit API keys must not be exposed to unauthorized users or leaked to the client unencrypted.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implement Tests | `npm test` currently only lints. Tests are needed for stability. | — Pending |
| Expand to Images | Users naturally expect an ImageKit plugin to support images. | — Pending |

---
*Last updated: 2026-03-23 after project initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
