# CraftMart Design Patterns and Guidelines

## Architecture Patterns

### Backend Patterns
- **MVC Pattern**: Controllers handle requests, services contain business logic
- **Middleware Chain**: Authentication → Validation → Controller → Error Handler
- **Repository Pattern**: Direct SQL queries in controllers (no ORM)
- **Error Handling**: Centralized error middleware with next(error)
- **JWT Strategy**: Tokens stored in localStorage, 24-hour expiration

### Frontend Patterns
- **Component Composition**: Small, reusable components combined in pages
- **Custom Hooks**: Encapsulate stateful logic (useAuth, useMobile)
- **Service Layer**: API calls abstracted in service files
- **Container/Presentational**: Pages as containers, components as presentational
- **CSS Modules**: Component-scoped styling with external CSS files

## UI/UX Patterns

### Visual Design
- **Gradient Headers**: Blue-to-purple linear gradient for all page titles
- **Card-Based Layouts**: White cards with subtle shadows and 8px radius
- **Emoji Icons**: Universal accessibility without icon libraries
- **Touch Targets**: Minimum 44px for all interactive elements
- **Responsive Grid**: 3→2→1 column layouts based on viewport

### Navigation Patterns
- **Mobile-First**: Hamburger menu for mobile, sidebar for desktop
- **Search-Focused**: Large search bars as primary interaction
- **Recent Items**: Show last 10 items instead of loading all data
- **Bulk Operations**: Multi-select with toolbar for batch actions

### Form Patterns
- **Modal Forms**: Create/edit in modals, not separate pages
- **Inline Validation**: Real-time feedback during input
- **Consistent Actions**: Save/Cancel buttons in same position
- **Loading States**: Disable buttons and show spinner during submit

## Database Patterns
- **Soft Deletes**: Set inactive status instead of deletion (salesmen)
- **Audit Fields**: created_at, updated_at on all tables
- **Foreign Keys**: Proper relationships with CASCADE/RESTRICT
- **Indexes**: On foreign keys and commonly queried fields
- **Migrations**: Numbered files for schema updates

## Security Patterns
- **Parameterized Queries**: Prevent SQL injection
- **Input Validation**: Joi schemas on backend
- **Authentication Middleware**: Verify JWT on all protected routes
- **Environment Variables**: Sensitive data never in code
- **CORS Configuration**: Restrict origins in production

## Performance Patterns
- **Pagination**: Limit results, especially for mobile
- **Debounced Search**: 300ms delay on input
- **Lazy Loading**: Load data as needed
- **Caching**: Browser caching for static assets
- **Optimized Queries**: Proper indexes and query planning