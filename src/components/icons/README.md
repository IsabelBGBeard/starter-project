# Icon Library

This folder contains React components for each SVG icon in the Magic Insights design system.

## Usage

Import the icon you need:

```tsx
import { UploadIcon } from './icons/UploadIcon';

<UploadIcon width={24} height={24} className="text-primary" />
```

## Adding New Icons

1. Export the SVG from Figma and place it in `src/assets/icons/`.
2. Create a new React component in this folder (see examples).
3. Add an export to `index.ts` for easy imports. 