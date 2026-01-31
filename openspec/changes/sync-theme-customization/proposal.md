# Change: Sync Theme Customization Specs

## Why
Advanced theme customization features (individual color reset, custom theme saving, typography control) were recently implemented but are not yet reflected in the project specifications. This change rectifies that by creating a formal spec for the existing implementation.

## What Changes
- Add `specs/theme-customization/spec.md` to document:
  - Theme switching (Light/Dark/Custom).
  - Granular color overrides with reset capability.
  - Custom theme persistence (save/delete).
  - Typography customization (per-element font family and size).
- Update `openspec/project.md` to reflect the enhanced customization capabilities.

## Impact
- **Affected specs**: `theme-customization` (new capability).
- **Affected code**: `SettingsModal.tsx`, `ThemeContext.tsx`, `tailwind.config.js` (No code changes required; this is a documentation sync).
