import { CommandRunner } from '../utils/command-runner';
import { QueueStatus } from '../types/status';
import { COMMANDS } from '../types/constants';

export class QueueManager {
  constructor(private commandRunner: CommandRunner) {}

  async getQueueStatus(): Promise<QueueStatus> {
    try {
      const result = await this.commandRunner.executeShell(COMMANDS.TFQ_COUNT);
      
      if (!result.success) {
        return {
          count: -1,
          available: false,
          error: `TFQ command failed: ${result.error}`
        };
      }

      const count = parseInt(result.output?.trim() || '0', 10);
      
      if (isNaN(count)) {
        return {
          count: -1,
          available: false,
          error: `Invalid TFQ count output: ${result.output}`
        };
      }

      return {
        count,
        available: true
      };
    } catch (error) {
      return {
        count: -1,
        available: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async isQueueEmpty(): Promise<boolean> {
    const status = await this.getQueueStatus();
    return status.available && status.count === 0;
  }

  async hasQueueItems(): Promise<boolean> {
    const status = await this.getQueueStatus();
    return status.available && status.count > 0;
  }
}