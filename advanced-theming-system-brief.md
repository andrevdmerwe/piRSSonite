# Advanced Theming System — Developer Brief

## Objective

Add a robust theming system to the application that allows users to:
- Select from predefined, high-quality themes
- Fully customize theme colors
- Customize fonts and font sizes
- Persist, preview, and safely revert theme changes

The system must be **token-based**, **extensible**, and suitable for a power-user web or desktop application.

---

## High-Level Requirements

### Core Capabilities

1. **Predefined Themes**
   - Themes must be selectable from a dropdown menu in the Settings UI
   - Selecting a theme applies it immediately across the application
   - Themes are loaded from a structured theme registry (not hardcoded)

2. **Theme Customization**
   - Every predefined theme must be customizable
   - Users can override individual color tokens
   - Customizations are layered on top of the base theme (non-destructive)

3. **Typography Customization**
   - Users must be able to customize:
     - Primary UI font family
     - Content font family
     - Monospace font family
     - Base font size
     - Optional: density or scale presets

---

## Predefined Themes to Include

The following themes must be included by default:

1. `catppuccin-latte`
2. `catppuccin` (dark / mocha)
3. `nord`
4. `osaka-jade`
5. `kanagawa`
6. `tokyo-night`

Theme palettes and naming should align with commonly accepted definitions, inspired by:

- https://github.com/basecamp/omarchy/tree/master/themes
- https://omarchy.deepakness.com/themes

Exact color values may be normalized into the application's token system.

---

## Theme Architecture (Required)

### Theme Model

Each theme must be represented as a structured object.

Minimum required schema:

```json
{
  "id": "tokyo-night",
  "name": "Tokyo Night",
  "type": "dark",
  "colors": {
    "background.app": "",
    "background.sidebar": "",
    "background.panel": "",
    "background.card": "",
    "border.default": "",
    "border.focus": "",
    "text.primary": "",
    "text.secondary": "",
    "text.muted": "",
    "accent.primary": "",
    "accent.secondary": "",
    "accent.success": "",
    "accent.warning": "",
    "accent.danger": "",
    "badge.unread": "",
    "badge.read": "",
    "hover.card": ""
  },
  "fonts": {
    "ui": "",
    "content": "",
    "monospace": ""
  },
  "fontSizes": {
    "base": 14,
    "small": 12,
    "large": 16
  }
}
```

### Rules
- No hardcoded colors or fonts in components
- All styling must reference theme tokens
- Tokens must be centrally defined and consumed

---

## Settings UI Requirements

### Theme Section
- Add a dedicated **Theme** section in Settings

### Theme Selection
- Dropdown listing all predefined themes
- Selecting a theme applies it instantly
- Optional preview swatches are allowed

### Theme Customization Panel

When a theme is selected:

#### Color Customization
- List all editable color tokens
- Each token provides:
  - Human-readable label
  - Color picker
  - Hex/RGB input
- Changes apply live

#### Font Customization
- Font family selectors for:
  - UI font
  - Content font
  - Monospace font
- Font size controls:
  - Base font size slider or numeric input
  - Optional density preset

### Actions
- Reset theme to defaults
- Revert unsaved changes
- Save custom overrides

---

## Behavior & UX Rules

- Theme changes must apply immediately
- No page reloads
- Hover, focus, and active states must adapt to theme
- Accessibility contrast must remain acceptable

---

## Persistence

### Storage
- Persist theme selection and overrides across sessions
- Storage mechanism may be:
  - Local storage
  - Database
  - Config file

### Override Strategy
- Predefined themes are immutable
- User overrides are stored separately

Example:

```json
{
  "activeTheme": "kanagawa",
  "overrides": {
    "colors.background.card": "#1f1f28",
    "fontSizes.base": 15
  }
}
```

---

## Extensibility

The system must support:
- Adding new themes without code changes
- Loading themes from JSON or a registry
- Future features such as:
  - Import/export themes
  - Community themes
  - Theme sharing

---

## Non-Goals (Out of Scope)

- No animated theme transitions
- No per-component theming overrides
- No automatic OS-based or time-based theme switching

---

## Acceptance Criteria

The feature is complete when:
- All six predefined themes are selectable
- All themes support color customization
- Fonts and font sizes are customizable
- Changes apply live and persist
- Reset and revert functionality works
- No UI element uses hardcoded colors or fonts

---

## Summary

Implement a token-based theming system with predefined Omarchy-style themes, full color and typography customization, live preview, persistent overrides, and a clean Settings UI designed for extensibility and power-user control.
