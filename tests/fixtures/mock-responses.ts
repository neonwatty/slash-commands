export const MOCK_TFQ_RESPONSES = {
  EMPTY_QUEUE: '0',
  NON_EMPTY_QUEUE: '3',
  ERROR_RESPONSE: ''
};

export const MOCK_TASK_RESPONSES = {
  NEXT_TASK_AVAILABLE: `## Next Task: 5

### Task Details
Complete the user authentication module

### Requirements
- Implement login functionality
- Add password validation
- Create user session management`,

  ALL_TASKS_COMPLETED: `All tasks completed! 🎉

Great job! You've successfully completed all available tasks.`,

  NO_TASK_FILES: `No task file found at the specified location.

Please ensure the tasks directory contains valid task files.`,

  TASK_WITHOUT_NUMBER: `### Current Task
Complete the database migration

### Requirements  
- Update schema
- Migrate existing data`
};

export const MOCK_EXECUTION_RESULTS = {
  SUCCESS: {
    success: true,
    exitCode: 0,
    output: 'Task completed successfully',
    error: '',
    duration: 1500
  },
  
  FAILURE: {
    success: false,
    exitCode: 1,
    output: '',
    error: 'Task execution failed',
    duration: 800
  },
  
  TIMEOUT: {
    success: false,
    exitCode: 124,
    output: '',
    error: 'Command timed out',
    duration: 120000
  }
};

export const MOCK_COMMIT_RESPONSES = {
  SUCCESS: {
    success: true,
    exitCode: 0,
    output: 'Changes committed and pushed successfully',
    error: '',
    duration: 2000
  },
  
  FAILURE: {
    success: false,
    exitCode: 1,
    output: '',
    error: 'Git commit failed: no changes to commit',
    duration: 500
  }
};