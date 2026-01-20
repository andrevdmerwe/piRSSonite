Feature Brief: Advanced Theming System
Objective

Add a robust theming system to the application that allows users to:

Select from predefined, high-quality themes

Fully customize theme colors

Customize fonts and font sizes

Persist, preview, and safely revert theme changes

The theming system must be extensible, token-based, and UI-driven, suitable for a power-user desktop/web application.

High-Level Requirements
Core Capabilities

Predefined Themes

Users can select a theme from a dropdown menu in the Settings UI

Themes are loaded from a structured theme registry

Selecting a theme immediately applies it across the application

Theme Customization

Every predefined theme must be editable

Users can override individual color tokens

Customizations persist per theme (non-destructive to base theme)

Typography Customization

Users can change:

Primary UI font family

Monospace/content font family

Base font size

Optional: density scaling (compact / normal / relaxed)

Predefined Themes to Include

The following themes must be included by default, matching their widely accepted palettes and naming:

catppuccin-latte

catppuccin (Mocha / dark)

nord

osaka-jade

kanagawa

tokyo-night

These themes are conceptually based on:

Basecamp Omarchy themes (structure reference)

Omarchy theme gallery (visual reference)

Exact color values should be sourced from canonical definitions where available, but may be normalized into the app’s token system.

Theme Architecture (Critical)
Theme Model (Required)

Each theme must be represented as a structured object, not ad-hoc CSS.

Minimum required tokens:

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


Rules

No hardcoded colors outside the theme system

All UI styling must reference tokens

Tokens must be centrally defined and consumed

Settings UI Requirements
Location

Add a “Theme” section under Settings

Theme Selection

Dropdown menu listing all predefined themes

Shows theme name (optionally with preview swatch)

Changing selection applies theme instantly (no reload)

Theme Customization Panel

When a theme is selected:

Color Customization

Display a list of editable color tokens

Each token:

Label (human-readable)

Color picker

Hex/RGB input

Changes apply live

Font Customization

Font family selectors:

UI font

Content font

Monospace font

Font size controls:

Base font size (slider or numeric input)

Optional: line-height or density preset

Actions

Reset theme to defaults

Revert unsaved changes

Save custom overrides

Behavior & UX Rules

Theme changes must apply immediately

No page reloads

All panels update consistently

Hover, focus, and active states must adapt to theme

Accessibility contrast must remain acceptable

Persistence
Storage

Theme selection and overrides must persist across sessions

Use:

Local storage, database, or config file (implementation dependent)

Override Strategy

Predefined themes are immutable

User customizations are stored as overrides layered on top of base theme

Example:

{
  "activeTheme": "kanagawa",
  "overrides": {
    "colors.background.card": "#1f1f28",
    "fontSizes.base": 15
  }
}

Extensibility (Important)

The system must support:

Adding new themes without code changes

Loading themes from JSON files or registry

Future support for:

Import/export themes

Community themes

Theme sharing

Non-Goals (Explicitly Out of Scope)

No animated theme transitions

No per-component theming overrides

No automatic theme switching (e.g. time-based)

No theming tied to OS appearance (for now)

Acceptance Criteria

The feature is complete when:

All six predefined themes are selectable

Users can modify individual colors for any theme

Users can customize fonts and font sizes

Changes apply live and persist

Reset and revert actions work correctly

No UI element uses hardcoded colors or fonts