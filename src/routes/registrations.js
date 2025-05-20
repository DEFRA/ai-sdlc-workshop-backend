const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { validateRegistrationRequest } = require('../middleware/validation');
const router = express.Router();

/**
 * Generate a random 8-character reference number
 * Format: [A-Z0-9]{8}
 */
function generateReferenceNumber() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Check if a reference number already exists in the database
 */
function checkReferenceExists(db, reference) {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1 FROM registrations WHERE referenceNumber = ?', [reference], (err, row) => {
      if (err) return reject(err);
      resolve(!!row);
    });
  });
}

/**
 * Generate a unique reference number (with collision checking)
 */
async function generateUniqueReference(db) {
  const maxAttempts = 5;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const reference = generateReferenceNumber();
    const exists = await checkReferenceExists(db, reference);
    
    if (!exists) {
      return reference;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique reference number after maximum attempts');
}

/**
 * @swagger
 * /api/v1/registrations:
 *   post:
 *     summary: Create a new registration record
 *     description: Validate and store a completed form submission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formType:
 *                 type: string
 *                 enum: [AD01, B07, K432, D243, OTHER]
 *               formTypeOtherText:
 *                 type: string
 *               penColourNotUsed:
 *                 type: string
 *                 enum: [BLUE, BLACK, RED, GREEN]
 *               guidanceRead:
 *                 type: string
 *                 enum: [YES, LOOKED_AT_NOW, NO]
 *             required:
 *               - formType
 *               - penColourNotUsed
 *               - guidanceRead
 *     responses:
 *       201:
 *         description: Registration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 referenceNumber:
 *                   type: string
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 */
router.post('/', validateRegistrationRequest, async (req, res) => {
  const db = getDatabase();
  const id = uuidv4();
  
  try {
    const referenceNumber = await generateUniqueReference(db);
    const { formType, formTypeOtherText, penColourNotUsed, guidanceRead } = req.body;
    
    db.run(
      `INSERT INTO registrations (id, referenceNumber, formType, formTypeOtherText, penColourNotUsed, guidanceRead)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, referenceNumber, formType, formTypeOtherText || null, penColourNotUsed, guidanceRead],
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(503).json({
            status: 'error',
            message: 'Service unavailable'
          });
        }
        
        res.status(201).json({
          id,
          referenceNumber
        });
      }
    );
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable'
    });
  }
});

/**
 * @swagger
 * /api/v1/registrations/{id}:
 *   get:
 *     summary: Get a registration by ID
 *     description: Retrieve a previously submitted registration record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Registration UUID
 *     responses:
 *       200:
 *         description: Registration record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 referenceNumber:
 *                   type: string
 *                 formType:
 *                   type: string
 *                 formTypeOtherText:
 *                   type: string
 *                 penColourNotUsed:
 *                   type: string
 *                 guidanceRead:
 *                   type: string
 *       404:
 *         description: Registration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Not Found
 */
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(404).json({
      status: 'error',
      message: 'Not Found'
    });
  }
  
  db.get(
    `SELECT id, referenceNumber, formType, formTypeOtherText, penColourNotUsed, guidanceRead
     FROM registrations
     WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(503).json({
          status: 'error',
          message: 'Service unavailable'
        });
      }
      
      if (!row) {
        return res.status(404).json({
          status: 'error',
          message: 'Not Found'
        });
      }
      
      res.json(row);
    }
  );
});

module.exports = router; 