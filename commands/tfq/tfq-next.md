# /tfq-fix-next - Fix Next Test in Queue

## Context
- Target directory: "$DIRECTORY" (defaults to repository root if not specified)

## Description
Retrieves the next test from the queue and launches a Task agent to fix it. Simple, sequential processing of one test at a time.

## Implementation

### 1. Change Directory (if target provided)
If `$DIRECTORY` is provided:
- Use the Bash tool to execute `cd "$DIRECTORY"` to change to the target directory

### 2. Get Next Test from Queue
Use the Bash tool to execute `tfq next --json` to get the next test. If the queue is empty, it returns `{"success": false}`.

### 3. Launch Task Agent
Create a Task agent with a clear prompt to:
- Use the Read tool to read and understand the failing test
- Use the Bash tool to run the test to see the exact failure
- Analyze the error and use the Read tool to find the root cause in source files
- Use the Edit tool to fix the bug in the source code (not just make the test pass)
- Use the Bash tool to verify the fix by running the test again
- Ensure no regression in related code

### 4. Verify Fix
After the Task agent completes:
- Use the Bash tool to run the specific test again

### 5. Report Status
Use the Bash tool to show the remaining queue count using `tfq stats --json` to track progress.

## Error Handling

- If queue is empty, notify user
- If Task agent fails, increase test priority for retry
- If test file doesn't exist, remove from queue
- Handle Task agent timeouts gracefully