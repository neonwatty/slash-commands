# /tfq-reset - Reset Test Queue

## Context
- Target directory: "$DIRECTORY" (defaults to repository root if not specified)

## Description
Clears the test failure queue using the tfq CLI.

## Implementation

### 1. Change Directory (if target provided)
If `$DIRECTORY` is provided:
- Use the Bash tool to execute `cd "$DIRECTORY"` to change to the target directory

### 2. Clear Entire Queue
Use the Bash tool to execute:
```bash
tfq clear --confirm
```

This removes all tests from the queue and resets it to empty state.


## Error Handling

- If queue is already empty, notify user
- Handle database errors gracefully