# CraftMart Design Patterns and Guidelines

## UI/UX Design System

### Color Palette
- **Primary Blue** (#3b82f6) - Buttons, links, primary actions
- **Purple** (#8b5cf6) - Gradient accents, secondary highlights
- **Green** (#10b981) - Success states, positive indicators
- **Amber** (#f59e0b) - Warning states, pending indicators
- **Red** (#dc2626) - Error states, delete actions

### Typography
- **Headers**: Blue-to-purple gradient using `.gradient-title` class
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Hierarchy**: Clear sizing differences between h1, h2, h3, etc.
- **Icons**: Emoji-based for universal accessibility

### Component Patterns
- **Page Layout**: `.page-header` structure with flex layout
- **Cards**: White background, 8px border radius, subtle shadows
- **Buttons**: `.btn` base class with variants (primary, secondary, danger)
- **Touch Targets**: Minimum 44px height for mobile
- **Forms**: Modal-based with validation feedback
- **Lists**: SelectableList component with desktop table / mobile card views

### Mobile Responsiveness
- **Mobile-First**: Base styles for mobile, enhance for desktop
- **Breakpoints**: 480px (mobile), 768px (tablet)
- **Navigation**: Hamburger menu on mobile
- **Content**: Card layouts on mobile, tables on desktop

## API Design Patterns

### RESTful Conventions
```
GET    /api/resources      # List all
GET    /api/resources/:id  # Get one
POST   /api/resources      # Create
PUT    /api/resources/:id  # Update
DELETE /api/resources/:id  # Delete
```

### Response Format
```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message"
}
```

### Authentication Pattern
- JWT token in Authorization header
- `Bearer <token>` format
- 24-hour token expiration
- Refresh on login

## Database Patterns

### Naming Conventions
- Tables: plural, snake_case (customers, quote_items)
- Columns: snake_case (first_name, created_at)
- Foreign keys: table_id (customer_id, job_id)
- Indexes: idx_table_column

### Standard Fields
- `id`: SERIAL PRIMARY KEY
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Soft Deletes
- Use `active` boolean for logical deletes
- Maintain referential integrity
- Filter inactive records in queries

## React Patterns

### Component Structure
```tsx
// Functional component with TypeScript
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  // Hooks at top
  const [state, setState] = useState<string>('');
  
  // Effects after hooks
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
};
```

### State Management
- Zustand for global auth state
- Local state for component UI
- Props for parent-child communication
- Custom hooks for reusable logic

## Security Guidelines

### Input Validation
- Frontend: Basic validation for UX
- Backend: Comprehensive validation with Joi
- Sanitize all user inputs
- Parameterized database queries

### Authentication Flow
1. User submits credentials
2. Server validates and returns JWT
3. Client stores token in localStorage
4. Client includes token in API requests
5. Server validates token on each request

### Data Protection
- Never log sensitive data
- Hash passwords with bcryptjs
- Use environment variables for secrets
- HTTPS in production via Cloudflare

## Performance Guidelines

### Frontend
- Lazy load routes with React.lazy()
- Memoize expensive calculations
- Debounce search inputs (300ms)
- Optimize images and assets

### Backend
- Use database indexes effectively
- Implement pagination for lists
- Cache frequently accessed data
- Optimize database queries

### Database
- Add indexes for common queries
- Use EXPLAIN ANALYZE for optimization
- Avoid N+1 queries
- Use connection pooling