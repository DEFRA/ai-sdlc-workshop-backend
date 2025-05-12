# CONTEXT
I have an existing backend node.js + express API server that handles forms submissions.  I want to extend the data object to include three additional data parameters. The data is stored in a sqllite file-based DB.

# ANALYSIS PHASE
Look at the existing codebase and determine the patterns and files that need to be updated to add the parameter, including any test files.

# IMPLEMENTATION PHASE
- I want to add a new parameter called `receipt_preference` to the existing data object, with the options of one of three values: "email", "phone", or "none".
- I want to add a new parameter called `email_address`, that is a string value that accepts valid email addresses.  Make sure any validation libraries are included if needed.
- I want to add a new parameter called `mobile_phone_number`, that is a string value that accepts any string
- Implement a proper database migration approach that:
  - Checks if the columns already exist before trying to add them
  - Uses `ALTER TABLE` statements to add new columns to the existing table
  - Preserves all existing data
  - Is automatically executed when the application starts
  - Provides robust error handling and logging
- Update the express API /api/v1/registrations POST endpoint to accept the new parameters
- Update the express API /api/v1/registrations GET endpoint to return the new parameters
- Update the swagger documentation
- Update the existing tests following the cursor rules files and existing patterns

## Example of new fields to be added

```json
{
  "receipt_preference": "email",  // or "phone", "none"
  "email_address": "user@example.com",   // only if preference is "email"
  "mobile_phone_number": "+1234567890"         // only if preference is "phone"
}
```

# VERIFICATION PHASE
When complete, you should have the following:
- A non-destructive migration system that adds the new columns to the database while preserving existing data:
  - Should use SQLite's `PRAGMA table_info` to check existing columns
  - Should add missing columns using `ALTER TABLE` statements
  - Should be automatically executed during application startup
  - Should handle all potential errors gracefully
- An updated GET and POST /api/v1/registrations API endpoints including the new `receipt_preference`, `email_address` and `mobile_phone_number` data fields
- The `email_address` should be validated as a valid email (using ajv-formats or similar)
- Conditional validation requiring email address when receipt_preference is "email"
- Conditional validation requiring mobile phone number when receipt_preference is "phone"
- Updated Swagger documentation for all new fields
- Updated tests that include the new `receipt_preference`, `email_address` and `mobile_phone_number` data fields
