import { Command } from 'commander';
import { ConfigSchema, LoopConfig } from '../types/config';
import { DEFAULT_CONFIG } from '../types/constants';
import { validateConfig, ValidationError } from '../utils/validation';

export interface CLIOptions {
  tasksDir?: string;
  projectDir?: string;
  iterations?: string;
  autoCommit?: boolean;
  timeout?: string;
  verbose?: boolean;
  skipPermissions?: boolean;
}

export function parseConfig(options: CLIOptions, args: string[]): LoopConfig {
  // Build raw config from CLI options and arguments
  const rawConfig = {
    taskNumber: args[0] || undefined,
    tasksDirectory: options.tasksDir,
    projectDirectory: options.projectDir,
    maxIterations: options.iterations ? parseInt(options.iterations, 10) : DEFAULT_CONFIG.MAX_ITERATIONS,
    timeoutMs: options.timeout ? parseInt(options.timeout, 10) : DEFAULT_CONFIG.TIMEOUT_MS,
    autoCommit: options.autoCommit ?? DEFAULT_CONFIG.AUTO_COMMIT,
    verbose: options.verbose ?? DEFAULT_CONFIG.VERBOSE,
    skipPermissions: options.skipPermissions ?? DEFAULT_CONFIG.SKIP_PERMISSIONS
  };

  // Apply environment variable overrides
  if (process.env.WORK_LOOP_MAX_ITERATIONS) {
    rawConfig.maxIterations = parseInt(process.env.WORK_LOOP_MAX_ITERATIONS, 10);
  }
  if (process.env.WORK_LOOP_TASKS_DIR) {
    rawConfig.tasksDirectory = process.env.WORK_LOOP_TASKS_DIR;
  }
  if (process.env.WORK_LOOP_PROJECT_DIR) {
    rawConfig.projectDirectory = process.env.WORK_LOOP_PROJECT_DIR;
  }
  if (process.env.WORK_LOOP_AUTO_COMMIT) {
    rawConfig.autoCommit = process.env.WORK_LOOP_AUTO_COMMIT.toLowerCase() === 'true';
  }
  if (process.env.WORK_LOOP_TIMEOUT_MS) {
    rawConfig.timeoutMs = parseInt(process.env.WORK_LOOP_TIMEOUT_MS, 10);
  }

  // Validate configuration
  validateConfig(rawConfig);

  // Parse and validate with Zod schema
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    throw new ValidationError(`Configuration validation failed: ${error}`);
  }
}

export function setupCommander(): Command {
  const program = new Command();
  
  program
    .name('work-loop')
    .description('Automated task execution loop with TFQ integration')
    .version('1.0.0')
    .argument('[task-number]', 'Specific task number to execute')
    .option('-d, --tasks-dir <path>', 'Tasks directory path')
    .option('-p, --project-dir <path>', 'Project directory path')
    .option('-i, --iterations <num>', 'Maximum iterations', DEFAULT_CONFIG.MAX_ITERATIONS.toString())
    .option('--no-auto-commit', 'Disable automatic git commit/push')
    .option('--timeout <ms>', 'Command timeout in milliseconds', DEFAULT_CONFIG.TIMEOUT_MS.toString())
    .option('--verbose', 'Enable verbose logging')
    .option('--no-skip-permissions', 'Don\'t skip permission checks (enables safety prompts)')
    .helpOption('-h, --help', 'Display help for command')
    .addHelpText('after', `
Examples:
  $ work-loop                              # Next task from /tasks, TFQ in current dir
  $ work-loop 5                            # Task 5 from /tasks, TFQ in current dir  
  $ work-loop "" ./my-tasks                # Next task from ./my-tasks, TFQ in current dir
  $ work-loop 3 ./my-tasks ./project       # Task 3 from ./my-tasks, TFQ in ./project

Environment Variables:
  WORK_LOOP_MAX_ITERATIONS    Maximum number of iterations
  WORK_LOOP_TASKS_DIR         Default tasks directory
  WORK_LOOP_PROJECT_DIR       Default project directory
  WORK_LOOP_AUTO_COMMIT       Enable auto-commit (true/false)
  WORK_LOOP_TIMEOUT_MS        Command timeout in milliseconds
    `);
    
  return program;
}