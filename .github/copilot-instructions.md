
# Copilot Instructions for AI Agents

## Mandatory First Response Protocol
**ALWAYS start every interaction by stating:**
1. "I am GitHub Copilot"
2. Stating what model will be used
3. Stating what custom instructions files will be used from `.github/instructions/`
4. Then proceed with the user's request

## Overview
This project uses GitHub Copilot custom instructions in `.github/instructions/` (see [VS Code Copilot Customization](https://code.visualstudio.com/docs/copilot/copilot-customization)).
All previous Cursor `.cursor/rules/*` rules are now migrated and maintained in `.github/instructions/`.

## Project Structure & Conventions
- Main code in `src/`. Entry: `src/index.js`. DB config: `src/database.js`.
- API endpoints must be versioned under `/api/v1` (see `src/routes/`).
- All routes require Swagger documentation. Example:
  ```js
  /**
   * @swagger
   * /api/v1/{endpoint}:
   *   {method}:
   *     summary: {description}
   */
  ```
- Use `getDatabase()` from `database.js` for DB access.
- Place new routes in `src/routes/` and document with Swagger.
- Keep all business logic in `src/`, not in route files.
- Middleware (if any) should go in `src/middleware/`.

## API & Response Patterns
- All API routes under `/api/v1`.
- Success response:
  ```js
  res.json({ status: 'ok', data: { ... } });
  ```
- Error response:
  ```js
  res.status(XXX).json({ status: 'error', message: '...' });
  ```

## Developer Workflows
- **Install:** `npm install`
- **Run (dev):** `npm run dev` (server on port 8000)
- **Test:** `npm test` (Jest + Supertest; tests in `src/tests/`)
- **Swagger UI:** <http://localhost:8000/api-docs>

## Testing Rules (from `.github/instructions/testing.instructions.md`)
- Test files in `src/tests/`, named `{feature}.test.js`.
- Use in-memory SQLite for tests: `db = new sqlite3.Database(':memory:');`
- Use Supertest for API tests. Example:
  ```js
  const response = await request(app).get('/api/v1/...');
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('status', 'ok');
  ```
- Follow this structure:
  ```js
  describe('Feature Tests', () => {
    let app;
    let db;
    beforeAll(() => { /* Setup */ });
    afterAll((done) => { /* Cleanup */ });
    describe('Endpoint Tests', () => {
      it('should...', async () => { /* Test */ });
    });
  });
  ```
- Always test error scenarios and clean up resources after tests.

## Key References
- `README.md` for setup, run, and test instructions.
- `.github/instructions/` for all project rules (replaces `.cursor/rules/`).
- Example test: `src/tests/health.test.js`

---
IMPORTANT: For any new feature, follow the above conventions and reference `.github/instructions/` for rules. If unsure, ask for clarification or check the referenced files.
