# Change: Update Typography Settings

## Why
Users requested the ability to change fonts and sizes globally across all elements at once, rather than adjusting each element individually. Additionally, the font selection is limited, and users requested a specific set of modern Google Fonts.

## What Changes
- **New Feature**: "Change All" font/size control in Typography settings.
- **New Feature**: Added 10 new fonts:
  - Source Sans 3
  - IBM Plex Sans
  - Roboto
  - DM Sans
  - Manrope
  - Nunito
  - Lato
  - IBM Plex Mono
  - Roboto Mono
  - Space Mono
- **Refactor**: Support bulk updates in `ThemeContext`.

## Impact
- **Affected specs**: `theme-customization`
- **Affected code**: `SettingsModal.tsx`, `ThemeContext.tsx`, `globals.css`, `types.ts`
