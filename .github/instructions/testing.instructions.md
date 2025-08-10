---
applyTo: '**/*.test.js'
---
# Testing Rules

## Test File Location
- Test files in `src/tests/`, named `{feature}.test.js`

## Best Practices
- Focus tests on functional behavior, not internals
- Use descriptive assertions and logical grouping
- Reuse established patterns for consistency

## Test Structure
- Use this structure:
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

## Database Mocking
- Use in-memory SQLite: `db = new sqlite3.Database(':memory:');`

## API Testing
- Use Supertest for API tests. Example:
	```js
	const response = await request(app).get('/api/v1/...');
	expect(response.status).toBe(200);
	expect(response.body).toHaveProperty('status', 'ok');
	```

## Test Assertions
- Use Jest expect for assertions
- Examples:
	```js
	expect(response.status).toBe(200);
	expect(response.body).toHaveProperty('status', 'ok');
	```

## Error Testing
- Always test error scenarios
- Example:
	```js
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

## API Route Path Setup
- When testing versioned APIs, use the full route path in tests:
	```js
	// Setup in beforeAll
	app = express();
	app.use('/api/v1/resources', resourceRoutes);

	// In tests
	const response = await request(app)
	  .post('/api/v1/resources')  // Use full path, not just '/'
	  .send(requestData);
	```

## Validation Error Testing
- For validation errors, avoid over-specific assertions that may break if error messages change:
	```js
	// Good practice - more resilient to implementation changes
	it('should return validation error for invalid data', async () => {
	  const response = await request(app).post('/api/v1/resources').send(invalidData);
	  expect(response.status).toBe(422);
	  expect(response.body).toHaveProperty('status', 'error');
	  expect(response.body).toHaveProperty('message');
	  expect(Array.isArray(response.body.message)).toBe(true);
	  expect(response.body.message.length).toBeGreaterThan(0);
	});

	// Avoid brittle tests that depend on exact error text
	// BAD: expect(response.body.message).toContain('specific error text');
	```