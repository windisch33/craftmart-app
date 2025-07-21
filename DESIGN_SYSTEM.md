# CraftMart Professional Design System

## Overview
A modern, professional interface design system implementing clean minimalism, glassmorphism effects, and accessibility-first principles for the CraftMart staircase manufacturing management system.

## 🎨 Visual Design Principles

### Color Scheme
**Primary Colors (Blue):**
- `primary-500: #3b82f6` - Main brand blue
- `primary-600: #2563eb` - Interactive states
- `primary-50: #eff6ff` - Light backgrounds

**Secondary Colors (Professional Gray):**
- `secondary-500: #64748b` - Professional gray
- `secondary-900: #0f172a` - Dark text
- `secondary-50: #f8fafc` - Light backgrounds

**Accent Colors:**
- Emerald: `#10b981` (Success/Active)
- Amber: `#f59e0b` (Warning/Pending)
- Purple: `#a855f7` (Revenue/Premium)
- Rose: `#f43f5e` (Error/Critical)

### Typography
**Font Family:** Inter (Google Fonts)
- Modern, highly legible sans-serif
- Optimized for screens and interfaces
- Clear hierarchy with proper line heights

**Font Sizes:**
- Headings: 4xl (2.25rem) to xl (1.25rem)
- Body: base (1rem) with 1.5rem line height
- Small: sm (0.875rem) and xs (0.75rem)

## 🧩 Component Library

### Card Component
```tsx
<Card variant="elevated" hover padding="md">
  // Content
</Card>
```
**Variants:**
- `default` - Standard white card with subtle border
- `glass` - Glassmorphism with backdrop blur
- `elevated` - Enhanced shadow for depth
- `bordered` - Prominent border styling

### Button Component
```tsx
<Button variant="primary" size="lg" icon={<PlusIcon />}>
  Action Text
</Button>
```
**Variants:**
- `primary` - Main brand action button
- `secondary` - Secondary actions
- `outline` - Bordered button style
- `ghost` - Minimal text button
- `glass` - Glassmorphism effect

### Input Component
```tsx
<Input 
  label="Field Label"
  placeholder="Enter text..."
  leftIcon={<SearchIcon />}
  variant="default"
/>
```

## ✨ Modern Design Trends

### Glassmorphism Effects
- Subtle backdrop blur with transparency
- Used sparingly for status indicators and special buttons
- `bg-white/10 backdrop-blur-md border border-white/20`

### Micro-Animations
- `animate-fade-in` - Smooth page entrance
- `animate-slide-up` - Content reveal
- `animate-scale-in` - Interactive feedback
- `animate-pulse-soft` - Gentle status indicators

### Enhanced Shadows
- `shadow-soft` - Subtle depth
- `shadow-medium` - Card elevation
- `shadow-large` - Hover states
- `shadow-glass` - Glassmorphism depth

## 📱 Responsive Design

### Breakpoints
- `sm: 640px` - Small tablets
- `md: 768px` - Tablets
- `lg: 1024px` - Laptops
- `xl: 1280px` - Desktops

### Grid System
- 12-column CSS Grid layout
- Responsive card grids: 1/2/3 columns
- Mobile-first responsive approach

## ♿ Accessibility Features

### High Contrast
- WCAG AA compliant color combinations
- Minimum 4.5:1 contrast ratio for text
- Clear focus indicators with 2px ring

### Interactive Elements
- Minimum 44px touch targets for mobile
- Clear focus states with `focus:ring-2`
- Semantic HTML with proper ARIA labels
- Screen reader friendly navigation

### Keyboard Navigation
- Full keyboard accessibility
- Tab order optimization
- Skip links for main content

## 🎯 User Experience Enhancements

### Visual Feedback
- Hover states with smooth transitions
- Loading states with spinners
- Success/error states with color coding
- Progress indicators for multi-step flows

### Intuitive Interactions
- Predictable button behaviors
- Clear visual hierarchy
- Consistent spacing (4px, 8px, 16px, 24px grid)
- Contextual help and tooltips

### Performance Optimizations
- Optimized animations (200-300ms duration)
- Efficient CSS transitions
- Minimal layout shifts
- Progressive enhancement

## 🏗️ Implementation Guidelines

### Component Usage
1. Always use the design system components
2. Maintain consistent spacing with Tailwind utilities
3. Follow the established color palette
4. Use semantic HTML elements

### Brand Integration
- CraftMart logo prominently featured
- Professional manufacturing business aesthetic
- Clean, trustworthy visual language
- Consistent brand voice throughout

### Development Standards
- TypeScript for type safety
- Tailwind CSS for styling
- React components with proper props
- Accessibility-first development

## 📊 Design Metrics

### Performance
- Page load animations: 300ms max
- Hover transitions: 150-200ms
- Focus indicators: Instant (0ms)

### Spacing System
- Base unit: 4px (0.25rem)
- Common spacing: 16px, 24px, 32px, 48px
- Section gaps: 32px (8 units)
- Component padding: 24px (6 units)

### Component Sizing
- Buttons: sm(32px), md(40px), lg(48px), xl(56px)
- Icons: 16px, 20px, 24px
- Cards: Minimum 200px width
- Touch targets: Minimum 44px

This design system ensures a professional, modern, and accessible interface that meets all specified criteria while maintaining the CraftMart brand identity and supporting the workflow needs of a 6-10 employee manufacturing team.