# Products API

This document describes the product endpoints, request/response payloads, and validation rules.

All endpoints require a valid JWT (`Authorization: Bearer <token>`). All write endpoints validate inputs with Joi and return consistent error objects.

## Error format

On validation errors, endpoints return HTTP 400 with JSON:

```
{
  "error": "Validation failed",
  "message": "<primary message>",
  "details": [
    { "field": "cost_per_6_inches", "message": "must be greater than or equal to 0", "value": -1 }
  ]
}
```

## Endpoints

### List Products
- `GET /api/products?type=<handrail|landing_tread|rail_parts>`
  - Query is validated. If omitted, returns all active products (all types).

### Get Product by ID
- `GET /api/products/:id`

### Handrail Products
- `POST /api/products/handrails`
  - Body:
    - `name` (string, required, 1..255)
    - `cost_per_6_inches` (number, required, >= 0)
- `PUT /api/products/handrails/:id`
  - Same body as POST

### Landing Tread Products
- `GET /api/products/landing-treads`
- `POST /api/products/landing-treads`
  - Body:
    - `name` (string, required, 1..255)
    - `cost_per_6_inches` (number, required, >= 0)
    - `labor_install_cost` (number, required, >= 0)
- `PUT /api/products/landing-treads/:id`
  - Same body as POST

### Rail Parts Products
- `GET /api/products/rail-parts`
- `POST /api/products/rail-parts`
  - Body:
    - `name` (string, required, 1..255)
    - `base_price` (number, required, >= 0)
    - `labor_install_cost` (number, required, >= 0)
- `PUT /api/products/rail-parts/:id`
  - Same body as POST

### Delete Product
- `DELETE /api/products/:id`
  - Soft delete; sets `is_active = false`.

## Notes
- Zero values are accepted for numeric fields (e.g., `0.00`) — the backend enforces non-negative numbers rather than truthy checks.
- All products are returned with type-specific fields where applicable (e.g., `cost_per_6_inches`, `labor_install_cost`, `base_price`).
- `GET /api/products` returns only active products; deleted (soft) items are excluded.

