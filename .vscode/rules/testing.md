# Testing Rules

## Test File Location
- Test files should be in `src/tests` directory
- Name test files as `{feature}.test.js`

## Best Practices
- Focus tests on functional behavior rather than internal implementation details.
- Maintain clarity by using descriptive text in assertions and grouping tests logically.
- Reuse the established patterns to ensure consistency across different test files.

## Test Structure
- Follow this structure for all tests:
```javascript
describe('Feature Tests', () => {
  let app;
  let db;

  beforeAll(() => {
    // Setup
  });

  afterAll((done) => {
    // Cleanup
  });

  describe('Endpoint Tests', () => {
    it('should...', async () => {
      // Test
    });
  });
});
```

## Database Mocking
- Use in-memory SQLite for testing
- Example: `db = new sqlite3.Database(':memory:');`

## API Testing
- Use Supertest for API testing
- Example: `const response = await request(app).get('/api/v1/...');`

## Test Assertions
- Use Jest expect for assertions
- Examples:
```javascript
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('status', 'ok');
```

## Error Testing
- Always test error scenarios
- Example:
```javascript
it('should handle errors', async () => {
  // Mock error condition
  const response = await request(app).get('/api/v1/...');
  expect(response.status).toBe(XXX);
  expect(response.body).toHaveProperty('status', 'error');
});
```

## Test Cleanup
- Always clean up resources after tests
- Example: `afterAll((done) => { db.close(done); });`
