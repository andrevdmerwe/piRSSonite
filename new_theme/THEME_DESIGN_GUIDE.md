# RSS Reader Theme Design Guide

## Overview
This theme features a sophisticated dark mode RSS reader with a "glassy morphism" aesthetic. The design uses a dark blue-gray palette with vibrant accent colors for interactive elements and unread counters.

---

## Color Palette

### Primary Colors
- **Background (Dark)**: `#2a2e3e` - Primary dark blue-gray for main surfaces
- **Sidebar Background**: `#2a2e3e` - Matches main background for consistency
- **Card Background (Glassy)**: `rgba(45, 50, 65, 0.4)` - Semi-transparent with frosted glass effect

### Accent Colors
- **Unread Counter Badge**: `#FFD700` / `#FFC107` - Vibrant golden yellow
- **Read Status Badge**: `#00D084` / `#1ECB7F` - Bright lime green
- **Links & Metadata**: `#4AADC1` / `#00BCD4` - Teal/cyan accent
- **Hover Accent**: `#6BB8D6` - Lighter blue on hover states

### Text Colors
- **Primary Text**: `#E8E8E8` / `#D0D0D0` - Light gray for main content
- **Secondary Text**: `#8B8B9E` / `#8E8E9E` - Muted gray for metadata
- **Dimmed Text**: `#646478` - Very dim gray for inactive elements
- **Status Text**: `#4AADC1` - Teal for status indicators

### Borders & Glass
- **Card Border**: `rgba(106, 184, 214, 0.3)` - Subtle teal border with transparency
- **Glass Blur Effect**: `backdrop-filter: blur(10px)` - Creates frosted glass appearance

---

## Sidebar (Left Pane)

### Layout
- **Width**: Approximately 300-350px
- **Structure**: Fixed left panel with scrollable feed list
- **Divider**: Right border in teal (`rgba(106, 184, 214, 0.2)`)

### Section Headers
- **Text**: "VIEWS", "FEEDS" in uppercase
- **Color**: `#8B8B9E` - Muted gray
- **Font**: Monospace, 11-12px, letter-spaced
- **Font Weight**: 600 (semi-bold)
- **Margin Bottom**: 12px

### Feed Items
- **Font**: Monospace, 13px
- **Text Color**: `#D0D0D0` - Light gray
- **Line Height**: 1.6
- **Padding**: 8px 12px
- **Hover State**: Background subtle fade to `rgba(255, 255, 255, 0.05)`

### Unread Counter Badges
- **Background**: `#FFD700` - Golden yellow
- **Text Color**: `#2a2e3e` - Dark background color (high contrast)
- **Font Size**: 11-12px
- **Font Weight**: 700 (bold)
- **Padding**: 4px 8px
- **Border Radius**: 4px
- **Position**: Right-aligned on same line as feed name
- **Font Family**: Monospace

### Expandable Sections
- **Arrow Indicator**: `#8B8B9E` - Muted gray
- **Rotation**: 90° when expanded
- **Transition**: Smooth 200ms

---

## Article Cards (Right Pane)

### Card Structure
- **Layout**: Vertical stack of article cards
- **Background**: `rgba(45, 50, 65, 0.4)` - Semi-transparent dark with frosted effect
- **Backdrop Filter**: `blur(10px)` - Creates glassy/frosted glass appearance
- **Border**: `1px solid rgba(106, 184, 214, 0.3)` - Subtle teal border
- **Border Radius**: `12px` - Rounded corners
- **Padding**: 16px
- **Margin Bottom**: 12px
- **Box Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)` - Soft shadow for depth
- **Transition**: All properties 200ms ease-out

### Card Hover State
- **Background**: `rgba(45, 50, 65, 0.6)` - More opaque on hover
- **Border Color**: `rgba(106, 184, 214, 0.5)` - More visible border
- **Box Shadow**: `0 12px 48px rgba(0, 0, 0, 0.4)` - Enhanced shadow
- **Cursor**: pointer

### Card Header (Status & Metadata)
- **Display**: Flex, space-between
- **Margin Bottom**: 12px
- **Align Items**: center

### Read Badge
- **Background**: `#1ECB7F` - Bright green
- **Text Color**: `#2a2e3e` - Dark text
- **Font Size**: 11px
- **Font Weight**: 700
- **Padding**: 4px 10px
- **Border Radius**: 4px
- **Font Family**: Monospace

### Folder/Category Info
- **Font Size**: 12px
- **Color**: `#8B8B9E` - Muted gray
- **Font**: Monospace
- **Text Background**: None (inline)

### Timestamp
- **Font Size**: 12px
- **Color**: `#646478` - Dim gray
- **Font**: Monospace
- **Position**: Right-aligned in header

### Star Icon
- **Color**: `#646478` - Dim gray
- **Hover Color**: `#FFD700` - Yellow on hover
- **Size**: 16-18px
- **Transition**: Color 150ms ease

---

## Article Title
- **Font Size**: 16-18px
- **Font Weight**: 400-500 (normal to medium)
- **Color**: `#E8E8E8` - Light gray
- **Line Height**: 1.5
- **Margin Bottom**: 8px
- **Font Family**: Monospace or geometric sans-serif
- **Letter Spacing**: Normal to slightly increased

---

## Article Preview Text
- **Font Size**: 13-14px
- **Color**: `#B8B8C8` - Light-medium gray
- **Line Height**: 1.6
- **Margin Bottom**: 12px
- **Font Family**: Monospace
- **Opacity**: 0.9

---

## Tags & Category Labels
- **Font Size**: 11px
- **Color**: `#4AADC1` - Teal
- **Background**: None (inline text)
- **Font Family**: Monospace
- **Font Weight**: 400
- **Margin Right**: 8px

---

## Metadata Row
- **Display**: Flex, space-between
- **Align Items**: center
- **Font Size**: 11px
- **Color**: `#4AADC1` - Teal for status
- **Font Family**: Monospace

### RSS Indicator
- **Text**: "rss" in teal
- **Color**: `#4AADC1`
- **Font Size**: 11px

### Unread Indicator
- **Text**: "mark_as_unread" in very dim
- **Color**: `#3D3D4D` - Very dim gray
- **Font Size**: 11px

---

## Thumbnail Images
- **Border Radius**: 6px
- **Width**: 80-100px
- **Height**: 60-80px (maintain aspect ratio)
- **Object Fit**: cover
- **Position**: Bottom-right or inline with text
- **Box Shadow**: `0 2px 8px rgba(0, 0, 0, 0.4)`

---

## Typography

### Font Family
- **Primary**: `'Courier New', 'Monaco', 'Menlo', monospace` - For that terminal/code aesthetic
- **Fallback**: System monospace fonts

### Font Weights
- **Regular**: 400
- **Semi-Bold**: 600
- **Bold**: 700

### Font Sizes
- **Section Headers**: 11-12px
- **Feed Items**: 13px
- **Badges**: 11-12px
- **Article Title**: 16-18px
- **Preview/Body**: 13-14px
- **Metadata**: 11-12px

### Line Heights
- **Compact**: 1.4
- **Normal**: 1.5
- **Relaxed**: 1.6

---

## Effects & Transitions

### Glass Morphism
- **Backdrop Filter**: `blur(10px)` for cards
- **Semi-Transparency**: 40-60% opacity on cards
- **Border Subtlety**: Very faint teal borders

### Hover Effects
- **Transition Duration**: 200ms
- **Easing**: ease-out or cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **Properties Animated**: background-color, border-color, box-shadow, color

### Button/Badge States
- **Hover**: Slight brightness increase, more saturated
- **Active**: Border becomes more visible, shadow increases

---

## Spacing & Layout

### Gaps & Margins
- **Card Margin**: 12px 0
- **Internal Card Padding**: 16px
- **Section Spacing**: 16px
- **Item Line Height**: 1.6

### Border Radius
- **Cards**: 12px
- **Badges**: 4px
- **Thumbnails**: 6px

### Shadows
- **Card Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)`
- **Card Hover Shadow**: `0 12px 48px rgba(0, 0, 0, 0.4)`
- **Thumbnail Shadow**: `0 2px 8px rgba(0, 0, 0, 0.4)`

---

## Responsive Considerations

- **Sidebar**: Collapses on mobile or becomes a drawer
- **Cards**: Scale padding appropriately on smaller screens
- **Font Sizes**: May reduce by 1-2px on mobile
- **Thumbnails**: Smaller on mobile (60px width)

---

## Accessibility Notes

- **Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Focus States**: Add visible focus indicators for keyboard navigation
- **Hover States**: Include both color and other visual feedback
- **Icons**: Ensure proper alt text for thumbnails
