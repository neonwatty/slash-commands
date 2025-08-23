import { CommandRunner } from '../utils/command-runner';
import { CommandArgsBuilder, extractTaskNumber } from '../utils/validation';
import { TaskInfo, ExecutionResult } from '../types/status';
import { LoopConfig } from '../types/config';
import { COMMANDS } from '../types/constants';

export class TaskExecutor {
  constructor(private commandRunner: CommandRunner) {}

  async showNextTask(config: LoopConfig): Promise<TaskInfo> {
    const args = CommandArgsBuilder.buildShowTaskArgs(config);
    const command = this.buildCommand(COMMANDS.SHOW_NEXT_TASK, args, config);
    
    const execResult = await this.commandRunner.executeShell(command);
    
    const output = execResult.output || '';
    
    // Check for completion indicators
    if (output.includes('All tasks completed!')) {
      return {
        available: false,
        allCompleted: true,
        output
      };
    }
    
    if (output.includes('No task file found')) {
      return {
        available: false,
        allCompleted: false,
        output,
        noTaskFiles: true
      };
    }
    
    // Extract task number if available
    const taskNumber = extractTaskNumber(output);
    
    const taskInfo: TaskInfo = {
      available: true,
      allCompleted: false,
      output
    };
    
    if (taskNumber) {
      taskInfo.number = taskNumber;
    }
    
    return taskInfo;
  }

  async workNextTask(config: LoopConfig): Promise<ExecutionResult> {
    const args = CommandArgsBuilder.buildWorkTaskArgs(config);
    const command = this.buildCommand(COMMANDS.WORK_NEXT_TASK, args, config);
    
    return await this.commandRunner.executeShell(command);
  }

  private buildCommand(baseCommand: string, args: string[], config: LoopConfig): string {
    // The baseCommand already includes the full path and flags, so use it directly
    if (args.length === 0) {
      return `${baseCommand}"`;
    }
    
    const argsString = args.map(arg => {
      // Handle empty string placeholders
      if (arg === '""') {
        return '""';
      }
      // Quote arguments that contain spaces
      if (arg.includes(' ')) {
        return `"${arg}"`;
      }
      return arg;
    }).join(' ');
    
    return `${baseCommand} ${argsString}"`;
  }
}