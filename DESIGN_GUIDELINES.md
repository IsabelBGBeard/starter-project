# Magic Insights Design Guidelines

## Overview
This document outlines the design system for the Magic Insights simulator, based on Canva's design standards and optimized for data visualization and analysis.

## Brand Foundation

### Typography
- **Primary Font**: Canva Sans (fallback: Inter, system-ui)
- **Display Font**: Canva Sans Display (fallback: Inter, system-ui)
- **Monospace**: JetBrains Mono (for data/code)

### Color Palette

#### Primary Colors (Canva Brand)
```css
--canva-blue: #00C4CC
--canva-purple: #7B61FF
--canva-pink: #FF6B9D
--canva-orange: #FF9A3C
--canva-yellow: #FFD93D
--canva-green: #6BCF7F
```

#### Neutral Colors
```css
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827
```

#### Semantic Colors
```css
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

## Layout System

### Container Dimensions
- **Main App**: 1360px × 778px (fixed)
- **Sidebar**: 368px width
- **Canvas**: 992px width (flex-1)

### Spacing Scale
```css
--space-xs: 0.25rem (4px)
--space-sm: 0.5rem (8px)
--space-md: 1rem (16px)
--space-lg: 1.5rem (24px)
--space-xl: 2rem (32px)
--space-2xl: 3rem (48px)
```

### Border Radius
```css
--radius-sm: 0.375rem (6px)
--radius-md: 0.5rem (8px)
--radius-lg: 0.75rem (12px)
--radius-xl: 1rem (16px)
```

## Component Design

### 1. Sidebar (Magic Insights Panel)

#### Header
- Background: White
- Border: Bottom border (gray-200)
- Padding: 16px
- Typography: 
  - Title: 18px, font-bold, gray-900
  - Subtitle: 14px, gray-600

#### Content Area
- Background: White
- Scroll: Vertical only
- Padding: 16px

### 2. Data Upload Components

#### File Upload Zone
- Border: 2px dashed, gray-300
- Background: gray-50
- Hover: gray-100
- Active: blue-50, blue-200 border
- Border radius: 12px
- Padding: 32px
- Text: Center aligned, gray-600

#### File Cards
- Background: White
- Border: 1px solid, gray-200
- Border radius: 8px
- Padding: 12px
- Hover: gray-50
- Active: blue-50, blue-200 border

### 3. Prompt Input

#### Input Field
- Border: 1px solid, gray-300
- Border radius: 8px
- Padding: 12px 16px
- Focus: blue-500 border, blue-50 background
- Placeholder: gray-400

#### Submit Button
- Background: Canva blue (#00C4CC)
- Text: White, 14px, font-medium
- Padding: 12px 24px
- Border radius: 8px
- Hover: Darker blue
- Disabled: gray-300 background, gray-500 text

### 4. Loading States

#### Spinner
- Size: 32px × 32px
- Color: Canva blue
- Animation: Spin
- Border: 2px solid, transparent
- Border-top: 2px solid, current color

#### Loading Text
- Primary: 14px, font-semibold, gray-800
- Secondary: 12px, gray-600

### 5. Insights Display

#### Insight Cards
- Background: blue-50
- Border: 1px solid, blue-100
- Border radius: 8px
- Padding: 12px
- Margin: 8px 0

#### Insight Typography
- Title: 14px, font-medium, blue-900
- Description: 12px, blue-800
- Value: 12px, blue-700, font-semibold
- Calculation: 12px, gray-500

## Chart Design System

### Chart Colors (Canva Palette)
```css
--chart-1: #00C4CC (Canva Blue)
--chart-2: #7B61FF (Canva Purple)
--chart-3: #FF6B9D (Canva Pink)
--chart-4: #FF9A3C (Canva Orange)
--chart-5: #FFD93D (Canva Yellow)
--chart-6: #6BCF7F (Canva Green)
```

### Chart Typography
- **Title**: 16px, font-semibold, gray-900
- **Axis Labels**: 12px, gray-600
- **Data Labels**: 11px, gray-700
- **Legend**: 12px, gray-700

### Chart Spacing
- **Container Padding**: 16px
- **Chart Padding**: 24px
- **Legend Spacing**: 8px

### Chart Types & Best Practices

#### Line Charts
- Line thickness: 2px
- Point size: 6px
- Grid: Light gray, 1px
- Area fill: 20% opacity

#### Bar Charts
- Bar spacing: 20% of bar width
- Bar border radius: 4px
- Grid: Light gray, 1px

#### Pie Charts
- Donut hole: 60% of radius
- Label distance: 120% of radius
- Stroke width: 2px

#### Scatter Plots
- Point size: 8px
- Point opacity: 80%
- Grid: Light gray, 1px

#### Histograms
- Bar spacing: 1px
- Bar border radius: 2px
- Grid: Light gray, 1px

## Interactive States

### Hover Effects
- Scale: 1.02 (subtle)
- Shadow: 0 4px 12px rgba(0,0,0,0.1)
- Transition: 0.2s ease

### Focus States
- Outline: 2px solid, Canva blue
- Outline offset: 2px

### Active States
- Scale: 0.98
- Background: Slightly darker

## Accessibility

### Color Contrast
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- UI elements: 3:1 minimum

### Focus Indicators
- Visible focus rings on all interactive elements
- High contrast focus indicators

### Screen Reader Support
- Proper ARIA labels
- Semantic HTML structure
- Alt text for charts and images

## Animation Guidelines

### Micro-interactions
- Duration: 200-300ms
- Easing: ease-out
- Scale: 1.02-1.05

### Page Transitions
- Duration: 300-500ms
- Easing: ease-in-out

### Loading Animations
- Duration: 1-2s
- Easing: linear (for spinners)

## Responsive Considerations

### Breakpoints
- Desktop: 1360px (fixed)
- Tablet: 768px-1024px
- Mobile: 320px-767px

### Mobile Adaptations
- Sidebar becomes overlay
- Touch-friendly button sizes (44px minimum)
- Simplified chart interactions

## Implementation Notes

### CSS Variables
All colors and spacing should be defined as CSS custom properties for easy theming and maintenance.

### Component Structure
- Use semantic HTML
- Implement proper ARIA attributes
- Follow BEM or similar naming convention

### Performance
- Optimize chart rendering
- Lazy load components
- Minimize re-renders

## Figma Organization

### Suggested File Structure
```
Magic Insights Design System/
├── 🎨 Design Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Components
├── 📱 Components
│   ├── Sidebar
│   ├── Data Upload
│   ├── Charts
│   └── Interactive Elements
├── 📊 Chart Examples
│   ├── Line Charts
│   ├── Bar Charts
│   ├── Pie Charts
│   └── Scatter Plots
└── 🖥️ Screens
    ├── Main Interface
    ├── Upload Flow
    └── Analysis Results
```

### Component Naming Convention
- Use descriptive names: `Button/Primary`, `Chart/LineChart`
- Include states: `Button/Primary/Hover`, `Button/Primary/Active`
- Version control: `Button/Primary/v1`

This document should serve as the foundation for creating comprehensive Figma designs that accurately represent the Magic Insights interface and ensure consistency across all components. 