## MODIFIED Requirements

### Requirement: Typography Customization
The system SHALL allow users to customize the font family and size for the application, both globally and for specific UI elements.

#### Scenario: Customize element font
- **WHEN** the user selects a UI element (e.g., "Folder Names") in the typography settings
- **AND** changes the font family or size
- **THEN** only that specific element type updates in the UI

#### Scenario: Global font update
- **WHEN** the user changes the "Global Font Family" or "Global Font Size"
- **THEN** all customizable UI elements update to use the selected font/size
- **AND** any existing specific element overrides are replaced by the global selection

#### Scenario: Extended font selection
- **WHEN** opening the font family dropdown
- **THEN** the following fonts are available:
  - Source Sans 3, IBM Plex Sans, Roboto, DM Sans, Manrope
  - Nunito, Lato, IBM Plex Mono, Roboto Mono, Space Mono
  - Plus existing system fonts
