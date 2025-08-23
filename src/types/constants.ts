export enum ExitCodes {
  SUCCESS = 0,
  CONFIG_ERROR = 1,
  EXECUTION_ERROR = 2,
  INTERRUPTED = 130
}

export const DEFAULT_CONFIG = {
  MAX_ITERATIONS: 20,
  TIMEOUT_MS: 120000,
  AUTO_COMMIT: true,
  VERBOSE: false,
  SKIP_PERMISSIONS: true
} as const;

export const COMMANDS = {
  TFQ_COUNT: 'tfq count',
  SHOW_NEXT_TASK: '/Users/jeremywatt/.claude/local/claude --dangerously-skip-permissions -p "/show-next-task',
  WORK_NEXT_TASK: '/Users/jeremywatt/.claude/local/claude --dangerously-skip-permissions -p "/work-next-task',
  COMMIT_PUSH: '/Users/jeremywatt/.claude/local/claude --dangerously-skip-permissions -p "/commit-push'
} as const;