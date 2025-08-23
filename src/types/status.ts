export interface TaskInfo {
  number?: string;
  available: boolean;
  allCompleted: boolean;
  output: string;
  noTaskFiles?: boolean;
}

export interface QueueStatus {
  count: number;
  available: boolean;
  error?: string;
}

export interface IterationState {
  current: number;
  total: number;
  startTime: number;
  duration: number;
  success: boolean;
  taskNumber?: string;
  queueStatus?: QueueStatus;
  taskInfo?: TaskInfo;
  executionResult?: ExecutionResult;
  commitResult?: ExecutionResult;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  output?: string;
  error?: string;
  duration: number;
}

export interface LoopResult {
  exitCode: number;
  completedIterations: number;
  totalDuration: number;
  exitReason: ExitReason;
  iterations: IterationState[];
}

export type StatusLevel = 'info' | 'success' | 'warning' | 'error' | 'running' | 'complete' | 'failed';

export enum ExitReason {
  ALL_TASKS_COMPLETED = 'all_tasks_completed',
  TFQ_QUEUE_NOT_EMPTY = 'tfq_queue_not_empty', 
  NO_TASK_FILES = 'no_task_files',
  MAX_ITERATIONS_REACHED = 'max_iterations_reached',
  USER_INTERRUPTED = 'user_interrupted',
  CONFIG_ERROR = 'config_error',
  EXECUTION_ERROR = 'execution_error'
}