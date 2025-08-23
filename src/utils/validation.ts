import { LoopConfig, TaskArgs } from '../types/config';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CommandArgsBuilder {
  static buildShowTaskArgs(config: LoopConfig): string[] {
    const args: string[] = [];
    
    if (config.taskNumber) {
      args.push(config.taskNumber);
    }
    
    if (config.tasksDirectory) {
      args.push(config.tasksDirectory);
    }
    
    return args;
  }

  static buildWorkTaskArgs(config: LoopConfig): string[] {
    const args: string[] = [];
    
    if (config.taskNumber) {
      args.push(config.taskNumber);
    } else if (config.tasksDirectory || config.projectDirectory) {
      args.push('""'); // Empty task number placeholder
    }
    
    if (config.tasksDirectory) {
      args.push(config.tasksDirectory);
    } else if (config.projectDirectory) {
      args.push('""'); // Empty tasks directory placeholder
    }
    
    if (config.projectDirectory) {
      args.push(config.projectDirectory);
    }
    
    return args;
  }

  static buildCommitArgs(taskNumber?: string): string[] {
    return taskNumber ? [taskNumber] : [];
  }
}

export function validateConfig(config: Partial<LoopConfig>): void {
  if (config.maxIterations !== undefined && config.maxIterations <= 0) {
    throw new ValidationError('maxIterations must be a positive number');
  }
  
  if (config.timeoutMs !== undefined && config.timeoutMs <= 0) {
    throw new ValidationError('timeoutMs must be a positive number');
  }
}

export function extractTaskNumber(output: string): string | undefined {
  // Try to extract task number from "## Next Task: [number]" pattern
  let match = output.match(/##\s*Next Task:\s*(\d+)/i);
  if (match) {
    return match[1];
  }

  // Fallback: try to extract from "Task [number]" pattern
  match = output.match(/Task\s+(\d+)/i);
  if (match) {
    return match[1];
  }

  return undefined;
}