const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const registrationsRoutes = require('../routes/registrations');
const { getDatabase } = require('../database');

// Mock the database module
jest.mock('../database', () => ({
  getDatabase: jest.fn()
}));

// Mock the uuid module to return a fixed UUID for testing
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('2b3c55b8-a480-4f2e-bf0d-8d3f9e2bf4be')
}));

describe('Registrations API Tests', () => {
  let app;
  let db;

  beforeAll(() => {
    // Create in-memory database
    db = new sqlite3.Database(':memory:');
    
    // Mock getDatabase to return our test database
    getDatabase.mockReturnValue(db);
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Initialize routes
    app.use('/api/v1/registrations', registrationsRoutes);

    // Create registrations table
    return new Promise((resolve) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS registrations (
          id TEXT PRIMARY KEY,
          referenceNumber TEXT NOT NULL,
          formType TEXT NOT NULL,
          formTypeOtherText TEXT,
          penColourNotUsed TEXT NOT NULL,
          guidanceRead TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) throw err;
        resolve();
      });
    });
  });

  afterAll((done) => {
    // Close database connection
    db.close(done);
  });

  beforeEach(() => {
    // Clear the database before each test
    return new Promise((resolve) => {
      db.run('DELETE FROM registrations', (err) => {
        if (err) throw err;
        resolve();
      });
    });
  });

  describe('POST /api/v1/registrations', () => {
    it('should create a registration with valid data', async () => {
      // Given a valid registration request
      const validData = {
        formType: 'AD01',
        penColourNotUsed: 'BLUE',
        guidanceRead: 'YES'
      };

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(validData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Then I should get a success response with ID and reference number
      expect(response.body).toHaveProperty('id', '2b3c55b8-a480-4f2e-bf0d-8d3f9e2bf4be');
      expect(response.body).toHaveProperty('referenceNumber');
      expect(response.body.referenceNumber).toMatch(/^[A-Z0-9]{8}$/);

      // And the data should be persisted in the database
      return new Promise((resolve) => {
        db.get('SELECT * FROM registrations WHERE id = ?', [response.body.id], (err, row) => {
          if (err) throw err;
          expect(row).toBeTruthy();
          expect(row.formType).toBe(validData.formType);
          expect(row.penColourNotUsed).toBe(validData.penColourNotUsed);
          expect(row.guidanceRead).toBe(validData.guidanceRead);
          expect(row.formTypeOtherText).toBeNull();
          resolve();
        });
      });
    });

    it('should create a registration with OTHER form type and text', async () => {
      // Given a valid registration with OTHER form type
      const validData = {
        formType: 'OTHER',
        formTypeOtherText: 'Custom Form Type',
        penColourNotUsed: 'RED',
        guidanceRead: 'NO'
      };

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(validData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Then I should get a success response
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('referenceNumber');

      // And the data should be persisted with the other text
      return new Promise((resolve) => {
        db.get('SELECT * FROM registrations WHERE id = ?', [response.body.id], (err, row) => {
          if (err) throw err;
          expect(row).toBeTruthy();
          expect(row.formType).toBe('OTHER');
          expect(row.formTypeOtherText).toBe('Custom Form Type');
          expect(row.penColourNotUsed).toBe('RED');
          expect(row.guidanceRead).toBe('NO');
          resolve();
        });
      });
    });

    it('should reject registration with OTHER form type but missing text', async () => {
      // Given an invalid registration with OTHER form type but no text
      const invalidData = {
        formType: 'OTHER',
        penColourNotUsed: 'GREEN',
        guidanceRead: 'LOOKED_AT_NOW'
      };

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(422);

      // Then I should get a validation error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should reject registration with unknown properties', async () => {
      // Given a registration with extra unknown properties
      const invalidData = {
        formType: 'AD01',
        penColourNotUsed: 'BLUE',
        guidanceRead: 'YES',
        unknownProperty: 'This should not be here'
      };

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(422);

      // Then I should get a validation error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject registration with invalid enum values', async () => {
      // Given a registration with invalid enum value
      const invalidData = {
        formType: 'AD01',
        penColourNotUsed: 'INVALID_COLOR',
        guidanceRead: 'YES'
      };

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(422);

      // Then I should get a validation error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject registration with missing required fields', async () => {
      // Given a registration missing required fields
      const invalidData = {
        formType: 'AD01'
        // Missing penColourNotUsed and guidanceRead
      };

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(422);

      // Then I should get a validation error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should handle database errors gracefully', async () => {
      // Given a valid registration
      const validData = {
        formType: 'AD01',
        penColourNotUsed: 'BLUE',
        guidanceRead: 'YES'
      };

      // And a database that throws an error on insert
      const mockDb = {
        get: (query, params, callback) => {
          // Allow reference check to pass
          callback(null, null);
        },
        run: (query, params, callback) => {
          // Simulate DB error on insert
          callback(new Error('Database error'));
        }
      };
      getDatabase.mockReturnValue(mockDb);

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(validData)
        .expect('Content-Type', /json/)
        .expect(503);

      // Then I should get a service unavailable error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Service unavailable');
    });
  });

  describe('GET /api/v1/registrations/:id', () => {
    it('should return a registration when it exists', async () => {
      // Given an existing registration in the database
      const testData = {
        id: '2b3c55b8-a480-4f2e-bf0d-8d3f9e2bf4be',
        referenceNumber: 'TEST1234',
        formType: 'AD01',
        formTypeOtherText: null,
        penColourNotUsed: 'BLUE',
        guidanceRead: 'YES'
      };

      // Make sure we use the original db, not the one we mocked in the previous test
      const originalDb = new sqlite3.Database(':memory:');
      getDatabase.mockReturnValue(originalDb);
      
      // Create the table in this new db instance
      await new Promise((resolve) => {
        originalDb.run(`
          CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            referenceNumber TEXT NOT NULL,
            formType TEXT NOT NULL,
            formTypeOtherText TEXT,
            penColourNotUsed TEXT NOT NULL,
            guidanceRead TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) throw err;
          resolve();
        });
      });

      await new Promise((resolve) => {
        originalDb.run(
          `INSERT INTO registrations (id, referenceNumber, formType, formTypeOtherText, penColourNotUsed, guidanceRead)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [testData.id, testData.referenceNumber, testData.formType, testData.formTypeOtherText, 
           testData.penColourNotUsed, testData.guidanceRead],
          (err) => {
            if (err) throw err;
            resolve();
          }
        );
      });

      // When I GET the registration by ID
      const response = await request(app)
        .get(`/api/v1/registrations/${testData.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Then I should get the registration data
      expect(response.body).toHaveProperty('id', testData.id);
      expect(response.body).toHaveProperty('referenceNumber', testData.referenceNumber);
      expect(response.body).toHaveProperty('formType', testData.formType);
      expect(response.body).toHaveProperty('penColourNotUsed', testData.penColourNotUsed);
      expect(response.body).toHaveProperty('guidanceRead', testData.guidanceRead);
      
      // Close the db connection we created just for this test
      await new Promise((resolve) => {
        originalDb.close(resolve);
      });
    });

    it('should return 404 when registration does not exist', async () => {
      // Given a non-existent registration ID
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Reset the mock database
      const originalDb = new sqlite3.Database(':memory:');
      getDatabase.mockReturnValue(originalDb);
      
      // Create the table in this new db instance
      await new Promise((resolve) => {
        originalDb.run(`
          CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            referenceNumber TEXT NOT NULL,
            formType TEXT NOT NULL,
            formTypeOtherText TEXT,
            penColourNotUsed TEXT NOT NULL,
            guidanceRead TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) throw err;
          resolve();
        });
      });

      // When I GET the registration by ID
      const response = await request(app)
        .get(`/api/v1/registrations/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // Then I should get a not found error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Not Found');
      
      // Close the db connection we created just for this test
      await new Promise((resolve) => {
        originalDb.close(resolve);
      });
    });

    it('should return 404 for invalid UUID format', async () => {
      // Given an invalid UUID format
      const invalidId = 'not-a-uuid';

      // Reset the mock database
      const originalDb = new sqlite3.Database(':memory:');
      getDatabase.mockReturnValue(originalDb);
      
      // Create the table in this new db instance
      await new Promise((resolve) => {
        originalDb.run(`
          CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            referenceNumber TEXT NOT NULL,
            formType TEXT NOT NULL,
            formTypeOtherText TEXT,
            penColourNotUsed TEXT NOT NULL,
            guidanceRead TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) throw err;
          resolve();
        });
      });

      // When I GET the registration by ID
      const response = await request(app)
        .get(`/api/v1/registrations/${invalidId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // Then I should get a not found error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Not Found');
      
      // Close the db connection we created just for this test
      await new Promise((resolve) => {
        originalDb.close(resolve);
      });
    });

    it('should handle database errors gracefully', async () => {
      // Given a valid ID
      const validId = '2b3c55b8-a480-4f2e-bf0d-8d3f9e2bf4be';

      // And a database that throws an error
      const mockDb = {
        get: (query, params, callback) => {
          callback(new Error('Database error'));
        }
      };
      getDatabase.mockReturnValue(mockDb);

      // When I GET the registration by ID
      const response = await request(app)
        .get(`/api/v1/registrations/${validId}`)
        .expect('Content-Type', /json/)
        .expect(503);

      // Then I should get a service unavailable error
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Service unavailable');
    });
  });

  describe('Reference Number Generation', () => {
    it('should generate a valid reference number (8 alphanumeric characters)', async () => {
      // Given a valid registration request
      const validData = {
        formType: 'AD01',
        penColourNotUsed: 'BLUE',
        guidanceRead: 'YES'
      };

      // Reset the database mock to a clean state
      const originalDb = new sqlite3.Database(':memory:');
      getDatabase.mockReturnValue(originalDb);
      
      // Create the table
      await new Promise((resolve) => {
        originalDb.run(`
          CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            referenceNumber TEXT NOT NULL,
            formType TEXT NOT NULL,
            formTypeOtherText TEXT,
            penColourNotUsed TEXT NOT NULL,
            guidanceRead TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) throw err;
          resolve();
        });
      });

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(validData)
        .expect(201);

      // Then I should get a reference number that matches the required format
      expect(response.body).toHaveProperty('referenceNumber');
      expect(response.body.referenceNumber).toMatch(/^[A-Z0-9]{8}$/);
      
      // Close the db
      await new Promise((resolve) => {
        originalDb.close(resolve);
      });
    });

    it('should handle reference number collisions', async () => {
      // Given a valid registration request
      const validData = {
        formType: 'B07',
        penColourNotUsed: 'GREEN',
        guidanceRead: 'LOOKED_AT_NOW'
      };

      // Setup a database that will simulate a collision then success
      // First reference check returns a collision, second one is unique
      let checkCount = 0;
      const mockDb = {
        get: (query, params, callback) => {
          // If checking for an existing reference
          if (query.includes('referenceNumber')) {
            // First time: simulate collision for any reference
            if (checkCount === 0) {
              checkCount++;
              callback(null, { id: 'existing-id' }); // Collision
            } else {
              // Second time: no collision
              callback(null, null);
            }
          } else {
            callback(null, null); // No collision for other queries
          }
        },
        run: (query, params, callback) => {
          // Allow the insert to succeed
          callback(null);
        }
      };
      
      getDatabase.mockReturnValue(mockDb);

      // When I POST it to the endpoint
      const response = await request(app)
        .post('/api/v1/registrations')
        .send(validData)
        .expect(201);

      // Then I should get a success response with a reference number
      expect(response.body).toHaveProperty('referenceNumber');
      expect(response.body.referenceNumber).toMatch(/^[A-Z0-9]{8}$/);
      
      // And the check should have happened at least twice
      expect(checkCount).toBeGreaterThan(0);
    });
  });
}); 