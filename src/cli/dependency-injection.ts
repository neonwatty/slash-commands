import { CommandRunner } from '../utils/command-runner';
import { TimeTracker } from '../utils/time-tracker';
import { QueueManager } from '../core/queue-manager';
import { TaskExecutor } from '../core/task-executor';
import { GitManager } from '../core/git-manager';
import { LoopController } from '../core/loop-controller';
import { StatusReporter } from '../display/status-reporter';
import { LoopConfig } from '../types/config';

export interface Dependencies {
  commandRunner: CommandRunner;
  timeTracker: TimeTracker;
  queueManager: QueueManager;
  taskExecutor: TaskExecutor;
  gitManager: GitManager;
  statusReporter: StatusReporter;
  loopController: LoopController;
}

export function setupDependencies(config: LoopConfig): Dependencies {
  // Create base utilities
  const commandRunner = new CommandRunner(config.timeoutMs);
  const timeTracker = new TimeTracker();
  
  // Create core modules
  const queueManager = new QueueManager(commandRunner);
  const taskExecutor = new TaskExecutor(commandRunner);
  const gitManager = new GitManager(commandRunner);
  
  // Create display modules
  const statusReporter = new StatusReporter(timeTracker);
  
  // Create main controller
  const loopController = new LoopController(
    config,
    queueManager,
    taskExecutor,
    gitManager,
    statusReporter,
    timeTracker
  );
  
  return {
    commandRunner,
    timeTracker,
    queueManager,
    taskExecutor,
    gitManager,
    statusReporter,
    loopController
  };
}