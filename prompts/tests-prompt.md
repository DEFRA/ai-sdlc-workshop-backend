I have provided you with a Product Requirements document(PRD). Please analyze the features and User Stories and create new tests for the features.

## Analysis Requirements
1. Review testing standards from the testing cursor rules
2. Analyze:
   - Source code
   - Integration points
   - External dependencies requiring mocks
   - Data models and flows
   - Existing test coverage

## Implementation Guidelines
1. Test Structure:
   - Use Given-When-Then pattern with descriptive comments
   - Focus on end-to-end workflows over isolated units
   - Mock external dependencies appropriately

2. Test Coverage:
   - Core user scenarios and workflows
   - Edge cases and error conditions
   - Both happy and unhappy paths

3. Quality Standards:
   - Clear test descriptions
   - Meaningful assertions
   - Efficient test setup and teardown

## Constraints
- Scope: Modify only the test file and test utilities / helpers
- Format: Deliver complete, production-ready test code
- Standards: Follow the testing cursor rules

## Output
After creating the tests please execute them and fix any issues