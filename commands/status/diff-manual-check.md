## Context

- git status: !`git status`
- Explicitly mentioned file to fix: "$ARGUMENTS"

## Your task

Analyze git changes and suggest manual testing ideas to verify the modified code works properly.

Steps:
1. Focus primarily on files shown in git status output and any explicitly mentioned files
2. Run `git diff` on the changed files to see actual changes 
3. Analyze the changes to understand:
   - New features or functionality added
   - Modified business logic or behavior
   - UI/UX changes and user interface updates
   - API endpoints or service changes
   - Authentication/authorization flow changes
   - Data processing or storage modifications
   - Configuration or environment changes
   - Integration points with external services
4. Propose specific manual test cases that cover:
   - Happy path scenarios for new features
   - Application performance and load behavior
   - Form submissions and data input validation
   - Navigation and user flow testing
   - Authentication and access control
   - Cross-platform and device compatibility
   - Edge cases and error conditions
   - Integration points between modules
   - User workflows that touch modified code
   - Data validation and security concerns
   - Accessibility and usability testing
5. Format as actionable test steps a human can follow
6. Include testing in both development and production environments