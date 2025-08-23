import { Formatter } from './formatter';
import { TimeTracker } from '../utils/time-tracker';
import { LoopConfig } from '../types/config';
import { LoopResult, IterationState, StatusLevel, ExitReason } from '../types/status';

export class StatusReporter {
  constructor(private timeTracker: TimeTracker) {}

  displayHeader(title: string): void {
    console.clear();
    console.log(Formatter.header(title));
  }

  displayStartupSummary(config: LoopConfig): void {
    this.displayHeader('TASK AUTOMATION LOOP');
    
    console.log('\n' + Formatter.bold('Configuration:'));
    console.log(Formatter.info(`Max iterations: ${Formatter.highlight(config.maxIterations.toString())}`));
    
    if (config.taskNumber) {
      console.log(Formatter.info(`Target task: ${Formatter.highlight(config.taskNumber)}`));
    }
    
    if (config.tasksDirectory) {
      console.log(Formatter.info(`Tasks directory: ${Formatter.highlight(config.tasksDirectory)}`));
    }
    
    if (config.projectDirectory) {
      console.log(Formatter.info(`Project directory: ${Formatter.highlight(config.projectDirectory)}`));
    }
    
    console.log('\n' + Formatter.bold('Process Flow:'));
    console.log(Formatter.info('Check TFQ queue status'));
    console.log(Formatter.info('Verify task availability'));
    console.log(Formatter.info('Execute work-next-task'));
    console.log(Formatter.info('Auto-commit on success (if TFQ empty)'));
    
    console.log('\n' + Formatter.separator());
  }

  displayIterationHeader(current: number, total: number): void {
    console.log('\n' + Formatter.iterationHeader(current, total));
  }

  displaySection(title: string): void {
    console.log(Formatter.section(title));
  }

  displayStatus(level: StatusLevel, message: string): void {
    switch (level) {
      case 'success':
        console.log(Formatter.success(message));
        break;
      case 'error':
        console.log(Formatter.error(message));
        break;
      case 'warning':
        console.log(Formatter.warning(message));
        break;
      case 'info':
        console.log(Formatter.info(message));
        break;
      case 'running':
        console.log(Formatter.status('running', message));
        break;
      case 'complete':
        console.log(Formatter.status('complete', message));
        break;
      case 'failed':
        console.log(Formatter.status('failed', message));
        break;
      default:
        console.log(`  ${message}`);
    }
  }

  displayIterationSummary(iteration: IterationState): void {
    console.log('\n' + Formatter.separator());
    const durationText = this.timeTracker.formatDuration(iteration.duration);
    console.log(Formatter.success(
      `Iteration ${Formatter.highlight(iteration.current.toString())} completed in ${Formatter.highlight(durationText)}`
    ));
  }

  displayFinalSummary(result: LoopResult): void {
    console.log('\n' + Formatter.header('LOOP COMPLETED'));
    
    console.log('\n' + Formatter.bold('Summary:'));
    console.log(Formatter.info(`Completed iterations: ${Formatter.highlight(result.completedIterations.toString())}`));
    
    const totalTime = this.timeTracker.formatDuration(result.totalDuration);
    console.log(Formatter.info(`Total runtime: ${Formatter.highlight(totalTime)}`));
    
    if (result.completedIterations > 0) {
      const avgDuration = Math.floor(result.totalDuration / result.completedIterations);
      const avgTime = this.timeTracker.formatDuration(avgDuration);
      console.log(Formatter.info(`Average per iteration: ${Formatter.highlight(avgTime)}`));
    }
    
    console.log('\n' + Formatter.bold('Status:'));
    this.displayExitReason(result.exitReason);
    
    console.log('\n' + Formatter.bold('Next Steps:'));
    console.log(Formatter.info('Check task status manually with: ' + Formatter.highlight('/show-next-task')));
    console.log(Formatter.info('Check TFQ queue with: ' + Formatter.highlight('tfq list')));
    
    console.log('\n' + Formatter.separator());
    console.log(Formatter.dim(`Run completed at ${new Date().toLocaleString()}`));
  }

  private displayExitReason(reason: ExitReason): void {
    switch (reason) {
      case ExitReason.ALL_TASKS_COMPLETED:
        console.log(Formatter.success('🏆 All tasks successfully completed'));
        break;
      case ExitReason.TFQ_QUEUE_NOT_EMPTY:
        console.log(Formatter.warning('📊 Stopped due to TFQ queue items'));
        break;
      case ExitReason.NO_TASK_FILES:
        console.log(Formatter.error('❌ No task files available'));
        break;
      case ExitReason.MAX_ITERATIONS_REACHED:
        console.log(Formatter.warning('⏰ Reached maximum iteration limit'));
        console.log(Formatter.info('Some tasks may remain unfinished'));
        break;
      case ExitReason.USER_INTERRUPTED:
        console.log(Formatter.warning('⏹️  Process interrupted by user'));
        break;
      case ExitReason.CONFIG_ERROR:
        console.log(Formatter.error('⚙️  Configuration error'));
        break;
      case ExitReason.EXECUTION_ERROR:
        console.log(Formatter.error('💥 Execution error occurred'));
        break;
      default:
        console.log(Formatter.info('Process completed'));
    }
  }
}