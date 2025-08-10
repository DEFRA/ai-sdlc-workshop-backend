---
applyTo: '**/*.js'
---
# Application Rules

## File Structure
- Main application code is in `src/`
- Entry point: `src/index.js`
- Database config: `src/database.js`
- Routes: `src/routes/`
- Middleware: `src/middleware/`

## API Versioning
- All API routes must be versioned under `/api/v1`
- Example: `app.use('/api/v1', router)`

## Route Documentation
- All routes must have Swagger documentation
- Example:
  ```js
  /**
   * @swagger
   * /api/v1/{endpoint}:
   *   {method}:
   *     summary: {description}
   */
  ```

## Database Access
- Use `getDatabase()` from `database.js` for DB access
- Example: `const { getDatabase } = require('../database');`

## Error Handling
- Use proper HTTP status codes
- Error response format:
  ```js
  res.status(XXX).json({ status: 'error', message: '...' });
  ```

## Response Format
- Success response format:
  ```js
  res.json({ status: 'ok', data: { ... } });
  ```
