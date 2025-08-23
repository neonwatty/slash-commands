# /commit-push - Git Add, Commit, and Push

## Context

- Task number: "$TASK" (optional)
- Detailed message: "$DETAILED_MESSAGE" (optional)

## Goal
Perform a complete git workflow: stage all changes, commit with appropriate message, and push to remote repository.

## Usage
```
/commit-push [optional-task-number] [optional-detailed-message]
```

## Implementation

### 1. Stage All Changes
Use the Bash tool to execute:
```bash
git add .
```

### 2. Commit with Message
- If `$DETAILED_MESSAGE` is provided: Use the Bash tool to commit with `git commit -m "$DETAILED_MESSAGE"`
- Else if `$TASK` is provided: Use the Bash tool to commit with `git commit -m "completed task $TASK"`
- Else: Use the Bash tool to commit with `git commit -m "completed task"`

### 3. Push to Remote
Use the Bash tool to execute:
```bash
git push
```

## Error Handling

- If no changes to commit, notify user that working tree is clean
- If push fails due to conflicts, stop
- If remote repository is not configured, stop