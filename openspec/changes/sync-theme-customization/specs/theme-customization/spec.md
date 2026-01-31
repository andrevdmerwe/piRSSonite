## ADDED Requirements

### Requirement: Theme Selection
The system SHALL allow users to select a visual theme for the application.

#### Scenario: Select built-in theme
- **WHEN** the user opens the theme settings
- **THEN** a list of built-in themes (e.g., Light, Dark) is displayed
- **AND** selecting a theme applies it immediately

#### Scenario: Select custom theme
- **WHEN** the user has saved custom themes
- **THEN** they are listed separately from built-in themes
- **AND** selecting one applies its saved colors and fonts

### Requirement: Color Customization
The system SHALL allow users to override specific color tokens of the active theme and reset them individually.

#### Scenario: Override color
- **WHEN** the user changes a specific color (e.g., "App Background") in the customization panel
- **THEN** the application UI updates immediately to reflect the new color
- **AND** the override is persisted

#### Scenario: Reset individual color
- **WHEN** a color has been overridden
- **THEN** a reset button (↺) is displayed next to it
- **AND** clicking it reverts that specific color to the active theme's default

### Requirement: Custom Theme Persistence
The system SHALL allow users to save their current configuration (base theme + overrides) as a new custom theme.

#### Scenario: Save custom theme
- **WHEN** the user clicks "Save as Custom Theme" and enters a name
- **THEN** the current state is saved as a new theme
- **AND** it appears in the theme selection list

#### Scenario: Delete custom theme
- **WHEN** a custom theme is active or selected
- **THEN** a delete option is available
- **AND** confirming deletion removes it from the list

### Requirement: Typography Customization
The system SHALL allow users to customize the font family and size for specific UI elements.

#### Scenario: Customize element font
- **WHEN** the user selects a UI element (e.g., "Folder Names") in the typography settings
- **AND** changes the font family or size
- **THEN** only that specific element type updates in the UI
