# CraftMart Code Style and Conventions

## TypeScript Configuration
- **Strict mode** enabled
- **React 19** hooks and best practices
- **Meaningful variable and component names**

## Frontend Conventions
- **Component Structure**:
  - Functional components with hooks
  - External CSS files paired with components
  - Components organized by feature (customers/, jobs/, salesmen/)
  - Common components in common/ directory
  
- **CSS Architecture**:
  - Mobile-first approach
  - BEM-inspired class naming
  - Centralized common.css for shared styles
  - Component-scoped CSS files
  - Standard breakpoints: 768px (tablet), 480px (mobile)
  
- **State Management**:
  - Zustand for global state
  - Local state with useState for component-specific data
  - Custom hooks in hooks/ directory

## Backend Conventions
- **API Structure**:
  - RESTful endpoints
  - Consistent error handling patterns
  - Input validation with Joi
  - JWT authentication middleware
  
- **Database**:
  - Parameterized queries for security
  - Proper foreign key relationships
  - JSONB for flexible data (cut sheets)
  - Timestamps on all tables

## Security Standards
- JWT tokens in localStorage
- All API routes require authentication
- Input sanitization and validation
- Environment variables for sensitive data
- Never commit secrets to repository

## Error Handling
- Proper error boundaries in React
- Consistent API error responses
- Meaningful error messages
- Proper HTTP status codes

## Git Workflow
- Feature branches (feature/new-feature)
- Descriptive commit messages
- No direct commits to main branch