const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const healthRoutes = require('../routes/health');
const { getDatabase } = require('../database');

// Mock the database module
jest.mock('../database', () => ({
    getDatabase: jest.fn()
}));

describe('Health API Tests', () => {
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
        app.use('/api/v1/health', healthRoutes);
    });

    afterAll((done) => {
        // Close database connection
        db.close(done);
    });

    describe('GET /api/v1/health', () => {
        it('should return 200 and health status when database is connected', async () => {
            const response = await request(app)
                .get('/api/v1/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body.database).toHaveProperty('status', 'connected');
            expect(response.body.database).toHaveProperty('responseTime');
        });

        it('should return 503 when database query fails', async () => {
            // Mock a database error
            const mockDb = {
                get: (query, callback) => callback(new Error('Database error'))
            };
            getDatabase.mockReturnValue(mockDb);

            const response = await request(app)
                .get('/api/v1/health')
                .expect('Content-Type', /json/)
                .expect(503);

            expect(response.body).toHaveProperty('status', 'error');
            expect(response.body.database).toHaveProperty('status', 'disconnected');
            expect(response.body.database).toHaveProperty('error');
        });
    });
}); 