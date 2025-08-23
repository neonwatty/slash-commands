# Rule: Show Next Task

## Context

- Task number to show: "$TASK" (optional)
- Tasks directory: "$TASKS_DIR" (defaults to /tasks if not specified)

## Goal
Display the next task from the task list for user review without taking any implementation action.

## Usage
```
/show-next-task [optional-task-number] [optional-tasks-directory]
```

## Examples
```
/show-next-task                           # Next task from /tasks
/show-next-task 5                         # Task 5 from /tasks  
/show-next-task "" ./my-tasks             # Next task from ./my-tasks
```

## Process

1. **Task Discovery**
   - If $TASK provided: Find and display the specified task in `$TASKS_DIR` (defaults to `/tasks`)
   - Else: Find and display the next task number in `$TASKS_DIR` (defaults to `/tasks`)
   - If no task file found or invalid argument, return clear error message with available options

2. **Task Display**
   - Extract the next uncompleted task from the task list
   - Show task details including:
     - Task number and title
     - Task description and requirements
     - Related documentation links
     - Dependencies (if any)
     - Estimated complexity or notes

3. **Context Information**
   - Display relevant files that would be involved
   - Show any prerequisites or dependencies
   - Provide documentation references for the task

4. **No Implementation**
   - This command is read-only - do not start working on the task
   - Do not create todos or begin implementation
   - Simply present the task information for user review

## Output Format
```
## Next Task: [Task Number and Title]

**Description:** [Task details]

**Files Involved:**
- [List of relevant files]

**Documentation References:**
- [Relevant docs and guides]

**Status:** [Current status - typically "pending"]

**Dependencies:** [Any prerequisite tasks]
```

## Error Handling
- If no uncompleted tasks found: "All tasks completed!"
- If task file not found: "No task file found. Available locations: tasks/, .claude/tasks/, .taskmaster/tasks/"
- If invalid task number: "Task [number] not found. Available tasks: [list]"