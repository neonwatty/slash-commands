#!/usr/bin/env node

import { setupCommander, parseConfig, CLIOptions } from './config-parser';
import { setupDependencies } from './dependency-injection';
import { ValidationError } from '../utils/validation';
import { ExitReason } from '../types/status';
import { ExitCodes } from '../types/constants';

async function main(): Promise<void> {
  try {
    // Set up CLI argument parsing
    const program = setupCommander();
    program.parse();
    
    const options = program.opts() as CLIOptions;
    const args = program.args;
    
    // Parse and validate configuration
    const config = parseConfig(options, args);
    
    // Set up dependency injection container
    const { loopController, statusReporter } = setupDependencies(config);
    
    // Display startup summary
    statusReporter.displayStartupSummary(config);
    
    // Execute main loop
    const result = await loopController.execute();
    
    // Display final summary
    statusReporter.displayFinalSummary(result);
    
    // Exit with appropriate code
    process.exit(result.exitCode);
    
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`❌ Configuration Error: ${error.message}`);
      process.exit(ExitCodes.CONFIG_ERROR);
    } else {
      console.error(`❌ Unexpected Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(ExitCodes.EXECUTION_ERROR);
    }
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Process interrupted by user');
  process.exit(ExitCodes.INTERRUPTED);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Process terminated');
  process.exit(ExitCodes.INTERRUPTED);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(ExitCodes.EXECUTION_ERROR);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(ExitCodes.EXECUTION_ERROR);
});

// Start the application
main();