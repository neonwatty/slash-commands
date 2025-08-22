## Context

- git status: !`git status`
- Explicitly mentioned file to fix: "$ARGUMENTS"

## Your task

Analyze git changes and generate automated test ideas for the modified code.

Steps:
1. Focus primarily on files shown in git status output and any explicitly mentioned files
2. Run `git diff` on the changed files to see actual changes 
3. Check existing test coverage by examining relevant test files (common patterns: `__tests__/`, `test/`, `tests/`, `*_test.*`, `*.test.*`)
4. Analyze the changes to understand:
   - New functions, classes, or modules added
   - Modified business logic or algorithms
   - New API endpoints or handlers
   - Configuration or setup changes
   - Data structures or model changes
   - External integrations or dependencies
5. Generate specific automated test cases that cover gaps in existing coverage:
   - Unit tests for new or modified functions
   - Integration tests for API endpoints
   - Edge cases and error handling
   - Input validation and boundary conditions
   - Mock external dependencies as needed
   - Performance or load testing if applicable
6. Write test code using the project's existing test framework
7. Include appropriate test setup, assertions, and cleanup
8. Consider project-specific patterns and conventions