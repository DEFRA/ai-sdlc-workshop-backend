const Ajv = require('ajv');
const ajv = new Ajv();

// Registration schema for validation
const registrationSchema = {
  type: 'object',
  properties: {
    formType: { 
      type: 'string',
      enum: ['AD01', 'B07', 'K432', 'D243', 'OTHER']
    },
    formTypeOtherText: { 
      type: 'string',
      nullable: true
    },
    penColourNotUsed: { 
      type: 'string',
      enum: ['BLUE', 'BLACK', 'RED', 'GREEN']
    },
    guidanceRead: { 
      type: 'string',
      enum: ['YES', 'LOOKED_AT_NOW', 'NO']
    }
  },
  required: ['formType', 'penColourNotUsed', 'guidanceRead'],
  allOf: [
    {
      if: {
        properties: { formType: { const: 'OTHER' } }
      },
      then: {
        required: ['formTypeOtherText'],
        properties: {
          formTypeOtherText: { type: 'string', minLength: 1 }
        }
      }
    }
  ],
  additionalProperties: false
};

const validateRegistration = ajv.compile(registrationSchema);

// Middleware to validate registration requests
function validateRegistrationRequest(req, res, next) {
  const valid = validateRegistration(req.body);
  
  if (!valid) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: validateRegistration.errors
    });
  }
  
  next();
}

module.exports = {
  validateRegistrationRequest
}; 