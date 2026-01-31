# Change: Refine Typography UX

## Why
Users have requested better visibility into which fonts are defaults, improved organization (alphabetical sorting), and the ability to preserve custom font choices even when switching base themes.

## What Changes
- **Feature**: Font dropdowns will show the specific font name and size followed by `*` to indicate it matches the current theme default, replacing generic "Default" labels.
- **Feature**: Font family list will be sorted alphabetically.
- **Feature**: When switching themes, if overrides exist, the user will be prompted to either reset fonts to the new theme's defaults or preserve their current overrides.

## Impact
- **Affected specs**: `theme-customization`
- **Affected code**: `SettingsModal.tsx`, `ThemeContext.tsx`, `types.ts`
