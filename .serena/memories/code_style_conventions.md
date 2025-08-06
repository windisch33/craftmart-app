# CraftMart Code Style and Conventions

## General Principles
- TypeScript strict mode for all code
- Meaningful variable and function names
- Component-based architecture
- Clean separation of concerns

## Backend Conventions
- **File Structure**: Organized by type (controllers, routes, services, middleware)
- **Controllers**: Async functions with try-catch and next(error) pattern
- **Database**: Direct SQL queries using pg pool, parameterized for security
- **Error Handling**: Centralized error middleware
- **Naming**: camelCase for functions/variables, PascalCase for types/interfaces
- **Exports**: Named exports for functions (e.g., `export const createCustomer`)

## Frontend Conventions
- **Components**: Function components with React.FC type
- **File Naming**: PascalCase for components (Header.tsx), camelCase for utilities
- **CSS**: External CSS modules paired with components (Header.tsx → Header.css)
- **State Management**: Custom hooks (useAuth, useMobile) with Zustand
- **API Services**: Centralized in services folder, consistent error handling
- **Props**: Destructured in function parameters
- **Icons**: Emoji-based for universal accessibility

## CSS Conventions
- **Architecture**: Component-scoped CSS with common.css for shared styles
- **Classes**: Kebab-case naming (e.g., `.header-container`, `.btn-primary`)
- **Mobile-First**: Media queries at 768px and 480px breakpoints
- **Design System**: 
  - Gradient headers (blue-to-purple)
  - Consistent spacing scale (16px, 24px, 32px)
  - 44px minimum touch targets
  - Card-based layouts with 8px border radius

## Comments and Documentation
- Minimal inline comments (code should be self-documenting)
- JSDoc comments for complex functions
- README files for setup and deployment
- CLAUDE.md for AI assistant reference