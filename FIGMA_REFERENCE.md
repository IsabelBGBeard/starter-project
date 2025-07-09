# Figma Quick Reference

## Current CSS Variables (from index.css)

### Colors
```css
/* Primary Colors */
--primary: oklch(0.21 0.006 285.885)
--primary-foreground: oklch(0.985 0 0)

/* Background Colors */
--background: oklch(1 0 0)
--foreground: oklch(0.141 0.005 285.823)
--card: oklch(1 0 0)
--card-foreground: oklch(0.141 0.005 285.823)

/* Neutral Colors */
--muted: oklch(0.967 0.001 286.375)
--muted-foreground: oklch(0.552 0.016 285.938)
--border: oklch(0.92 0.004 286.32)
--input: oklch(0.92 0.004 286.32)

/* Chart Colors */
--chart-1: oklch(0.646 0.222 41.116)
--chart-2: oklch(0.6 0.118 184.704)
--chart-3: oklch(0.398 0.07 227.392)
--chart-4: oklch(0.828 0.189 84.429)
--chart-5: oklch(0.769 0.188 70.08)

/* Sidebar Colors */
--sidebar: oklch(0.985 0 0)
--sidebar-foreground: oklch(0.141 0.005 285.823)
--sidebar-primary: oklch(0.21 0.006 285.885)
--sidebar-primary-foreground: oklch(0.985 0 0)
--sidebar-accent: oklch(0.967 0.001 286.375)
--sidebar-accent-foreground: oklch(0.21 0.006 285.885)
--sidebar-border: oklch(0.92 0.004 286.32)
--sidebar-ring: oklch(0.705 0.015 286.067)
```

### Spacing & Layout
```css
--radius: 0.625rem (10px)
--radius-sm: calc(var(--radius) - 4px) (6px)
--radius-md: calc(var(--radius) - 2px) (8px)
--radius-lg: var(--radius) (10px)
--radius-xl: calc(var(--radius) + 4px) (14px)
```

## Current Component Examples

### 1. Sidebar Header
```html
<div className="p-4 border-b border-gray-200 text-left">
  <h1 className="text-lg font-bold text-gray-900">Magic Insights</h1>
  <p className="text-sm text-gray-600">Data analysis simulator</p>
</div>
```

### 2. File Upload Zone
```html
<div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-colors">
  <div className="text-center text-gray-600">
    <div className="text-4xl mb-4">📁</div>
    <h3 className="text-lg font-medium mb-2">Upload your data</h3>
    <p className="text-sm mb-4">Drag and drop CSV files here, or click to browse</p>
  </div>
</div>
```

### 3. File Card (Active State)
```html
<div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200 cursor-pointer">
  <div className="flex items-center space-x-3">
    <div className="text-lg">📊</div>
    <div>
      <div className="font-medium text-sm">sales_data.csv</div>
      <div className="text-xs text-gray-500">5 columns, 100 rows</div>
    </div>
  </div>
  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
</div>
```

### 4. Prompt Input
```html
<div className="space-y-3">
  <label className="block text-sm font-medium text-gray-700">Ask Magic Insights</label>
  <textarea 
    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
    placeholder="e.g., What are the key trends in my sales data?"
  />
  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
    Analyze Data
  </button>
</div>
```

### 5. Loading State
```html
<div className="p-4 bg-white border border-gray-200 rounded-lg text-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
  <h3 className="text-sm font-semibold text-gray-800 mb-1">Analyzing your data...</h3>
  <p className="text-xs text-gray-600">Magic Insights is processing your request</p>
</div>
```

### 6. Insight Card
```html
<div className="bg-blue-50 border border-blue-100 rounded p-3">
  <div className="font-medium text-blue-900 mb-1">Strong upward trend detected</div>
  <div className="text-sm text-blue-800 mb-1">Sales have increased by 23% over the last quarter</div>
  <div className="text-xs text-blue-700">Value: <span className="font-semibold">+23%</span></div>
  <div className="text-xs text-gray-500 mt-1">Calculation: Quarter-over-quarter growth</div>
</div>
```

## Key Measurements

### Layout
- **App Container**: 1360px × 778px
- **Sidebar Width**: 368px
- **Canvas Width**: 992px (calculated)

### Typography Scale
- **Large Title**: 18px, font-bold
- **Medium Title**: 16px, font-semibold
- **Small Title**: 14px, font-medium
- **Body**: 14px, normal
- **Small Body**: 12px, normal
- **Caption**: 11px, normal

### Spacing
- **Container Padding**: 16px (p-4)
- **Component Spacing**: 12px (p-3)
- **Small Spacing**: 8px (p-2)
- **Large Spacing**: 24px (p-6)

### Border Radius
- **Small**: 6px (rounded)
- **Medium**: 8px (rounded-lg)
- **Large**: 12px (rounded-xl)

## Color Mapping

### Current → Canva Colors
- `blue-600` → `#00C4CC` (Canva Blue)
- `blue-50` → `#E6F7F8` (Light Canva Blue)
- `blue-100` → `#CCEFF1` (Lighter Canva Blue)
- `blue-700` → `#0099A3` (Dark Canva Blue)

### Gray Scale
- `gray-50` → `#F9FAFB`
- `gray-100` → `#F3F4F6`
- `gray-200` → `#E5E7EB`
- `gray-300` → `#D1D5DB`
- `gray-400` → `#9CA3AF`
- `gray-500` → `#6B7280`
- `gray-600` → `#4B5563`
- `gray-700` → `#374151`
- `gray-800` → `#1F2937`
- `gray-900` → `#111827`

## Figma Setup Recommendations

### 1. Create Design Tokens
- Set up color styles for all Canva colors
- Create text styles for typography scale
- Define spacing and radius as component properties

### 2. Component Structure
- Create master components for reusable elements
- Use auto-layout for responsive behavior
- Set up proper constraints for different screen sizes

### 3. Chart Components
- Create separate frames for each chart type
- Use consistent padding (24px) around charts
- Implement proper color schemes for accessibility

### 4. Interactive States
- Create hover, focus, and active states
- Use consistent animation timing (200ms)
- Implement proper focus indicators

This reference should help you create accurate Figma designs that match the current implementation and can be easily translated back to code. 