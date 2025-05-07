const express = require('express');
const { getDatabase } = require('../database');
const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Check service health
 *     description: Verifies the API service and database connection are working
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     responseTime:
 *                       type: number
 *                       example: 5
 *       503:
 *         description: Service is unavailable (database connection failed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: disconnected
 *                     error:
 *                       type: string
 */
router.get('/', (req, res) => {
  const db = getDatabase();
  const startTime = Date.now();
  
  // Run a simple query to check database connection
  db.get('SELECT 1 AS ping', (err, row) => {
    const responseTime = Date.now() - startTime;
    
    if (err) {
      return res.status(503).json({
        status: 'error',
        database: {
          status: 'disconnected',
          error: err.message
        }
      });
    }
    
    res.json({
      status: 'ok',
      database: {
        status: 'connected',
        responseTime: responseTime
      }
    });
  });
});

module.exports = router; 