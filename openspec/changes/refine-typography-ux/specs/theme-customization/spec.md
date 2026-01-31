## MODIFIED Requirements

### Requirement: Theme Selection
The system SHALL allow users to select a visual theme for the application.

#### Scenario: Select theme with existing overrides
- **WHEN** the user selects a different theme
- **AND** they have customized fonts or colors
- **THEN** they are prompted to either "Reset to Defaults" or "Keep Customizations"
- **AND** the chosen action is applied along with the new theme

### Requirement: Typography Customization
The system SHALL allow users to customize the font family and size for the application, both globally and for specific UI elements.

#### Scenario: Display default font
- **WHEN** viewing the font family or size dropdown
- **THEN** the currently active font/size is shown
- **AND** if it is the default for the current theme, it is marked with an asterisk `*`
- **AND** the option "Default" is NOT displayed as a separate abstract item

#### Scenario: Sorted font list
- **WHEN** viewing the font family dropdown
- **THEN** all available fonts are listed in alphabetical order
