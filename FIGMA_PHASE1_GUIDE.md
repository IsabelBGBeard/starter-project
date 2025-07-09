# Figma Phase 1: Design Tokens Setup Guide

## Overview
This guide will walk you through setting up the foundational design tokens for the Magic Insights design system in Figma.

## Step 1: Create Color Styles

### 1.1 Canva Brand Colors
Create these as **Color Styles** in Figma:

#### Primary Canva Colors
```
🎨 Canva Blue: #00C4CC
🎨 Canva Purple: #7B61FF  
🎨 Canva Pink: #FF6B9D
🎨 Canva Orange: #FF9A3C
🎨 Canva Yellow: #FFD93D
🎨 Canva Green: #6BCF7F
```

#### Neutral Gray Scale
```
⚪ Gray 50: #F9FAFB
⚪ Gray 100: #F3F4F6
⚪ Gray 200: #E5E7EB
⚪ Gray 300: #D1D5DB
⚪ Gray 400: #9CA3AF
⚪ Gray 500: #6B7280
⚪ Gray 600: #4B5563
⚪ Gray 700: #374151
⚪ Gray 800: #1F2937
⚪ Gray 900: #111827
```

#### Semantic Colors
```
✅ Success: #10B981
⚠️ Warning: #F59E0B
❌ Error: #EF4444
ℹ️ Info: #3B82F6
```

### 1.2 Color Organization
**Figma Setup:**
1. Go to **Assets** panel → **Local styles**
2. Create a **Color** style collection called "Magic Insights"
3. Create sub-collections:
   - `Brand/Canva`
   - `Neutral/Gray`
   - `Semantic/Status`

**Naming Convention:**
- `Brand/Canva/Blue`
- `Brand/Canva/Purple`
- `Neutral/Gray/50`
- `Neutral/Gray/100`
- `Semantic/Success`
- `Semantic/Error`

## Step 2: Create Typography Styles

### 2.1 Font Setup
**Primary Font:** Canva Sans (fallback: Inter)
**Display Font:** Canva Sans Display (fallback: Inter)

### 2.2 Typography Scale
Create these as **Text Styles** in Figma:

#### Headings
```
📝 Heading/Large: 18px, Bold, Gray 900
📝 Heading/Medium: 16px, Semibold, Gray 900  
📝 Heading/Small: 14px, Medium, Gray 900
```

#### Body Text
```
📝 Body/Regular: 14px, Regular, Gray 700
📝 Body/Small: 12px, Regular, Gray 600
📝 Body/Caption: 11px, Regular, Gray 500
```

#### Interactive Elements
```
📝 Button/Primary: 14px, Medium, White
📝 Button/Secondary: 14px, Medium, Gray 700
📝 Input/Placeholder: 14px, Regular, Gray 400
```

### 2.3 Typography Organization
**Figma Setup:**
1. Create a **Text** style collection called "Magic Insights Typography"
2. Create sub-collections:
   - `Typography/Headings`
   - `Typography/Body`
   - `Typography/Interactive`

## Step 3: Create Spacing Components

### 3.1 Spacing Scale
Create these as **Component Properties**:

```
📏 Spacing/XS: 4px (0.25rem)
📏 Spacing/SM: 8px (0.5rem)
📏 Spacing/MD: 16px (1rem)
📏 Spacing/LG: 24px (1.5rem)
📏 Spacing/XL: 32px (2rem)
📏 Spacing/2XL: 48px (3rem)
```

### 3.2 Border Radius
```
🔲 Radius/SM: 6px
🔲 Radius/MD: 8px
🔲 Radius/LG: 12px
🔲 Radius/XL: 16px
```

### 3.3 Spacing Organization
**Figma Setup:**
1. Create a **Component** collection called "Magic Insights Spacing"
2. Create sub-collections:
   - `Spacing/Scale`
   - `Spacing/Radius`

## Step 4: Create Layout Components

### 4.1 Container Dimensions
Create these as **Frame Components**:

```
📐 Layout/App: 1360px × 778px
📐 Layout/Sidebar: 368px width
📐 Layout/Canvas: 992px width (calculated)
```

### 4.2 Common Layouts
```
📐 Layout/Card: Auto-layout, 16px padding, Gray 50 background
📐 Layout/Section: Auto-layout, 24px padding, White background
📐 Layout/Container: Auto-layout, 16px padding, Gray 100 background
```

## Step 5: Create Effect Styles

### 5.1 Shadows
Create these as **Effect Styles**:

```
🌫️ Shadow/SM: 0 1px 2px rgba(0,0,0,0.05)
🌫️ Shadow/MD: 0 4px 6px rgba(0,0,0,0.07)
🌫️ Shadow/LG: 0 10px 15px rgba(0,0,0,0.1)
🌫️ Shadow/XL: 0 20px 25px rgba(0,0,0,0.15)
```

### 5.2 Focus Rings
```
💍 Focus/Primary: 2px solid Canva Blue, 2px offset
💍 Focus/Secondary: 2px solid Gray 300, 2px offset
```

## Step 6: Organize Design System

### 6.1 File Structure
Create this hierarchy in your Figma file:

```
🎨 Magic Insights Design System
├── 🎨 Design Tokens
│   ├── Colors
│   │   ├── Brand/Canva
│   │   ├── Neutral/Gray
│   │   └── Semantic/Status
│   ├── Typography
│   │   ├── Headings
│   │   ├── Body
│   │   └── Interactive
│   ├── Spacing
│   │   ├── Scale
│   │   └── Radius
│   └── Effects
│       ├── Shadows
│       └── Focus
└── 📐 Layout
    ├── Containers
    └── Grids
```

### 6.2 Documentation
Add descriptions to each style:
- **Usage notes**: When to use each color/typography
- **Accessibility**: Contrast ratios
- **Variants**: Different states (hover, active, disabled)

## Step 7: Test Your Design Tokens

### 7.1 Quick Test Components
Create these to verify your tokens work:

```
🧪 Test/Color Palette: All colors in a grid
🧪 Test/Typography Scale: All text styles
🧪 Test/Spacing Scale: All spacing values
🧪 Test/Effects: All shadows and focus states
```

### 7.2 Validation Checklist
- [ ] All colors have proper contrast ratios
- [ ] Typography scales consistently
- [ ] Spacing follows 8px grid
- [ ] Effects work on different backgrounds
- [ ] Components are properly named
- [ ] Styles are organized logically

## Pro Tips for Figma

### 7.3 Auto Layout Best Practices
- Use **Auto Layout** for all components
- Set **Spacing** to use your design tokens
- Use **Fill** and **Stroke** from your color styles
- Apply **Effects** from your effect styles

### 7.4 Component Properties
- Set up **Boolean** properties for states (hover, active, disabled)
- Use **Text** properties for labels and content
- Create **Instance Swap** properties for variants

### 7.5 Naming Convention
- Use **PascalCase** for component names
- Use **kebab-case** for property names
- Include **category/type/variant** in names

## Next Steps After Phase 1

Once you've completed Phase 1, you'll have:
- ✅ Consistent color palette
- ✅ Typography scale
- ✅ Spacing system
- ✅ Effect library
- ✅ Layout foundations

This will make Phase 2 (Core Components) much faster and more consistent!

## Time Estimate
- **Setup**: 30-45 minutes
- **Testing**: 15-20 minutes
- **Total**: 45-65 minutes

Let me know when you've completed Phase 1, and I'll help you move on to Phase 2: Core Components! 