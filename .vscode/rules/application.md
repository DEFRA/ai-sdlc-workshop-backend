# Application Rules

## File Structure
- Main application code should be in `src/` directory
- `index.js` is the main entry point
- `database.js` contains database configuration
- Routes should be in `routes/` directory
- Middleware should be in `middleware/` directory

## API Versioning
- All API routes must be versioned under `/api/v1`
- Example: `app.use('/api/v1', router)`

## Route Documentation
- All routes must have Swagger documentation
- Follow this pattern:
```javascript
/**
 * @swagger
 * /api/v1/{endpoint}:
 *   {method}:
 *     summary: {description}
 */
```

## Database Access
- Use `getDatabase()` function for database access
- Import from database module: `const { getDatabase } = require('../database');`

## Error Handling
- Use proper HTTP status codes
- Follow this response format:
```javascript
res.status(XXX).json({ 
  status: 'error', 
  message: '...' 
});
```

## Response Format
- Success responses should follow this format:
```javascript
res.json({ 
  status: 'ok', 
  data: { ... } 
});
```

