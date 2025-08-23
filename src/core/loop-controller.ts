import { QueueManager } from './queue-manager';
import { TaskExecutor } from './task-executor';
import { GitManager } from './git-manager';
import { StatusReporter } from '../display/status-reporter';
import { TimeTracker } from '../utils/time-tracker';
import { LoopConfig } from '../types/config';
import { LoopResult, IterationState, ExitReason } from '../types/status';
import { ExitCodes } from '../types/constants';

export class LoopController {
  constructor(
    private config: LoopConfig,
    private queueManager: QueueManager,
    private taskExecutor: TaskExecutor,
    private gitManager: GitManager,
    private statusReporter: StatusReporter,
    private timeTracker: TimeTracker
  ) {}

  async execute(): Promise<LoopResult> {
    this.timeTracker.start('total');
    const iterations: IterationState[] = [];
    let exitReason = ExitReason.MAX_ITERATIONS_REACHED;
    let completedIterations = 0;

    try {
      for (let i = 1; i <= this.config.maxIterations; i++) {
        this.statusReporter.displayIterationHeader(i, this.config.maxIterations);
        
        const iteration = await this.executeIteration(i);
        iterations.push(iteration);
        
        if (iteration.success) {
          completedIterations++;
        }

        this.statusReporter.displayIterationSummary(iteration);

        // Check exit conditions
        const shouldExit = this.shouldExit(iteration);
        if (shouldExit.exit) {
          exitReason = shouldExit.reason;
          break;
        }
      }
    } catch (error) {
      exitReason = ExitReason.EXECUTION_ERROR;
      this.statusReporter.displayStatus('error', `Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const totalDuration = this.timeTracker.end('total');
    
    return {
      exitCode: this.getExitCode(exitReason),
      completedIterations,
      totalDuration,
      exitReason,
      iterations
    };
  }

  private async executeIteration(iterationNumber: number): Promise<IterationState> {
    this.timeTracker.start(`iteration-${iterationNumber}`);
    
    const iteration: IterationState = {
      current: iterationNumber,
      total: this.config.maxIterations,
      startTime: Date.now(),
      duration: 0,
      success: false
    };

    try {
      // Step 1: Check TFQ queue status
      this.statusReporter.displaySection('TFQ Queue Status Check');
      this.statusReporter.displayStatus('running', 'Checking TFQ queue...');
      
      const queueStatus = await this.queueManager.getQueueStatus();
      iteration.queueStatus = queueStatus;
      
      if (!queueStatus.available) {
        this.statusReporter.displayStatus('warning', 'Could not check TFQ status (command may not be available)');
      } else if (queueStatus.count > 0) {
        this.statusReporter.displayStatus('error', 
          `TFQ queue has ${queueStatus.count} items - HALTING`
        );
        iteration.duration = this.timeTracker.end(`iteration-${iterationNumber}`);
        return iteration;
      } else {
        this.statusReporter.displayStatus('success', `TFQ queue is empty (${queueStatus.count} items)`);
      }

      // Step 2: Check task availability
      this.statusReporter.displaySection('Task Availability Check');
      this.statusReporter.displayStatus('running', 'Checking for available tasks...');
      
      const taskInfo = await this.taskExecutor.showNextTask(this.config);
      iteration.taskInfo = taskInfo;
      
      if (taskInfo.allCompleted) {
        this.statusReporter.displayStatus('success', '🎉 All tasks completed!');
        iteration.duration = this.timeTracker.end(`iteration-${iterationNumber}`);
        return iteration;
      }
      
      if (taskInfo.noTaskFiles) {
        this.statusReporter.displayStatus('error', 'No task files found');
        iteration.duration = this.timeTracker.end(`iteration-${iterationNumber}`);
        return iteration;
      }
      
      if (taskInfo.number) {
        this.statusReporter.displayStatus('success', `Found task number: ${taskInfo.number}`);
        iteration.taskNumber = taskInfo.number;
      } else {
        this.statusReporter.displayStatus('warning', 'Could not extract task number from output');
      }
      
      this.statusReporter.displayStatus('success', 'Tasks available - proceeding to execution');

      // Step 3: Execute work-next-task
      this.statusReporter.displaySection('Task Execution');
      this.statusReporter.displayStatus('running', 'Executing work-next-task command...');
      
      const executionResult = await this.taskExecutor.workNextTask(this.config);
      iteration.executionResult = executionResult;
      
      if (!executionResult.success) {
        this.statusReporter.displayStatus('error', `Task execution failed (exit code: ${executionResult.exitCode})`);
        this.statusReporter.displayStatus('warning', 'Continuing to next iteration...');
        iteration.duration = this.timeTracker.end(`iteration-${iterationNumber}`);
        return iteration;
      }
      
      this.statusReporter.displayStatus('success', 'work-next-task completed successfully');
      
      // Step 4: Post-execution checks and commit
      await this.handleSuccessfulTask(iteration);
      
      iteration.success = true;
    } catch (error) {
      this.statusReporter.displayStatus('error', `Iteration error: ${error instanceof Error ? error.message : String(error)}`);
    }

    iteration.duration = this.timeTracker.end(`iteration-${iterationNumber}`);
    return iteration;
  }

  private async handleSuccessfulTask(iteration: IterationState): Promise<void> {
    if (!this.config.autoCommit) {
      return;
    }

    // Check TFQ queue again after execution
    this.statusReporter.displaySection('Post-Execution TFQ Check');
    this.statusReporter.displayStatus('running', 'Checking TFQ queue status after execution...');
    
    const postQueueStatus = await this.queueManager.getQueueStatus();
    
    if (!postQueueStatus.available) {
      this.statusReporter.displayStatus('warning', 'Could not check TFQ status after execution');
      return;
    }
    
    if (postQueueStatus.count > 0) {
      this.statusReporter.displayStatus('error', 
        `TFQ queue now has ${postQueueStatus.count} items - HALTING`
      );
      return;
    }
    
    this.statusReporter.displayStatus('success', `TFQ queue still empty (${postQueueStatus.count} items)`);
    
    // Commit and push changes
    this.statusReporter.displaySection('Auto-Commit & Push');
    this.statusReporter.displayStatus('running', 'TFQ queue empty - committing and pushing changes...');
    
    if (iteration.taskNumber) {
      this.statusReporter.displayStatus('info', `Committing with task number: ${iteration.taskNumber}`);
    } else {
      this.statusReporter.displayStatus('info', 'Committing without specific task number');
    }
    
    const commitResult = await this.gitManager.commitAndPush(iteration.taskNumber, {
      skipPermissions: this.config.skipPermissions
    });
    iteration.commitResult = commitResult;
    
    if (commitResult.success) {
      this.statusReporter.displayStatus('success', 'Successfully committed and pushed changes 🚀');
    } else {
      this.statusReporter.displayStatus('error', `Commit/push failed (exit code: ${commitResult.exitCode})`);
    }
  }

  private shouldExit(iteration: IterationState): { exit: boolean; reason: ExitReason } {
    if (iteration.queueStatus?.available && iteration.queueStatus.count > 0) {
      return { exit: true, reason: ExitReason.TFQ_QUEUE_NOT_EMPTY };
    }
    
    if (iteration.taskInfo?.allCompleted) {
      return { exit: true, reason: ExitReason.ALL_TASKS_COMPLETED };
    }
    
    if (iteration.taskInfo?.noTaskFiles) {
      return { exit: true, reason: ExitReason.NO_TASK_FILES };
    }
    
    return { exit: false, reason: ExitReason.MAX_ITERATIONS_REACHED };
  }

  private getExitCode(reason: ExitReason): number {
    switch (reason) {
      case ExitReason.ALL_TASKS_COMPLETED:
      case ExitReason.TFQ_QUEUE_NOT_EMPTY:
        return ExitCodes.SUCCESS;
      case ExitReason.NO_TASK_FILES:
      case ExitReason.CONFIG_ERROR:
        return ExitCodes.CONFIG_ERROR;
      case ExitReason.USER_INTERRUPTED:
        return ExitCodes.INTERRUPTED;
      case ExitReason.MAX_ITERATIONS_REACHED:
      case ExitReason.EXECUTION_ERROR:
      default:
        return ExitCodes.EXECUTION_ERROR;
    }
  }
}