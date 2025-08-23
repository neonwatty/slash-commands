import { CommandRunner } from '../utils/command-runner';
import { CommandArgsBuilder } from '../utils/validation';
import { ExecutionResult } from '../types/status';
import { COMMANDS } from '../types/constants';

export class GitManager {
  constructor(private commandRunner: CommandRunner) {}

  async commitAndPush(taskNumber?: string, config?: { skipPermissions?: boolean }): Promise<ExecutionResult> {
    const args = CommandArgsBuilder.buildCommitArgs(taskNumber);
    const command = this.buildCommitCommand(args, config);
    
    return await this.commandRunner.executeShell(command);
  }

  private buildCommitCommand(args: string[], config?: { skipPermissions?: boolean }): string {
    // Build the base command with flags
    let command = 'claude';
    
    if (config?.skipPermissions !== false) {
      command += ' --dangerously-skip-permissions';
    }
    
    command += ' -p "/commit-push';
    
    if (args.length === 0) {
      return `${command}"`;
    }
    
    const argsString = args.join(' ');
    return `${command} ${argsString}"`;
  }

  private generateCommitMessage(taskNumber?: string): string {
    const baseMessage = taskNumber 
      ? `Complete task ${taskNumber}` 
      : 'Complete automated task';
      
    return `${baseMessage}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
  }
}