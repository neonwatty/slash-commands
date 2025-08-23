# Work Loop CLI

A modular, well-tested TypeScript CLI tool that automates task execution loops with TFQ queue integration. This is a modern replacement for the original `work-loop.sh` bash script.

## Features

- 🏗️ **Modular Architecture**: Clean separation of concerns with focused modules
- 🛡️ **Type Safety**: Full TypeScript coverage preventing runtime errors
- 🧪 **Comprehensive Testing**: 95%+ test coverage with sophisticated mocking
- ⚡ **Better Performance**: Async/await, structured error handling
- 🔧 **Enhanced DX**: IDE support, debugging, maintainable code patterns
- 📦 **Professional Distribution**: npm packaging, global installation

## Installation

### Local Development
```bash
npm install
npm run build
npm run install-global
```

### From Package
```bash
npm install -g work-loop-cli
```

## Usage

The CLI maintains 100% compatibility with the original bash script:

```bash
# Basic usage - next task from /tasks, TFQ in current dir
work-loop

# Specific task number
work-loop 5

# Custom tasks directory
work-loop "" ./my-tasks

# Full configuration
work-loop 3 ./my-tasks ./project
```

### Command Line Options

```bash
work-loop [task-number] [options]

Options:
  -d, --tasks-dir <path>     Tasks directory path
  -p, --project-dir <path>   Project directory path
  -i, --iterations <num>     Maximum iterations (default: 20)
  --no-auto-commit          Disable automatic git commit/push
  --timeout <ms>            Command timeout in milliseconds (default: 120000)
  --verbose                 Enable verbose logging
  --no-skip-permissions     Don't skip permission checks (enables safety prompts)
  -h, --help               Display help
  -V, --version            Display version
```

### Environment Variables

```bash
WORK_LOOP_MAX_ITERATIONS=30
WORK_LOOP_TASKS_DIR=./tasks
WORK_LOOP_PROJECT_DIR=./project
WORK_LOOP_AUTO_COMMIT=false
WORK_LOOP_TIMEOUT_MS=180000
WORK_LOOP_SKIP_PERMISSIONS=true
```

## Claude Code Integration

The work-loop CLI integrates with Claude Code using programmatic commands. By default, it runs:

```bash
claude --dangerously-skip-permissions -p "/command"
```

### Permission Handling

- **Default behavior**: Uses `--dangerously-skip-permissions` for full automation
- **Safety mode**: Use `--no-skip-permissions` to enable interactive permission prompts
- **Programmatic mode**: The `-p` flag automatically handles headless execution

### Examples

```bash
# Full automation (default - skips permission prompts)
work-loop 5 ./tasks ./project

# With permission prompts for safety in sensitive environments
work-loop 5 ./tasks ./project --no-skip-permissions

# Environment variable control
WORK_LOOP_SKIP_PERMISSIONS=false work-loop 5
```

## Development

### Build and Test

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run in development mode
npm run dev

# Lint code
npm run lint
```

### Project Structure

```
src/
├── cli/                   # CLI interface layer
│   ├── index.ts          # Main entry point  
│   ├── config-parser.ts  # Argument parsing & validation
│   └── dependency-injection.ts # DI container
├── core/                 # Business logic modules
│   ├── loop-controller.ts # Main iteration orchestration
│   ├── queue-manager.ts   # TFQ queue operations
│   ├── task-executor.ts   # Claude command execution
│   └── git-manager.ts     # Git commit/push operations
├── display/              # UI/formatting layer
│   ├── formatter.ts      # Colors, boxes, text formatting
│   └── status-reporter.ts # Status updates & summaries
├── types/                # Type definitions
└── utils/                # Shared utilities
```

### Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Each module tested in isolation with mocked dependencies
- **Integration Tests**: End-to-end CLI command execution with mocked external commands
- **Mock Strategy**: Sophisticated mocking of external command execution

Run tests with:
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

## Migration from Bash Script

This TypeScript version is a drop-in replacement for `work-loop.sh`:

1. **CLI Compatibility**: All command-line arguments work identically
2. **Behavior Preservation**: Exact same execution flow and error handling
3. **Output Format**: Same colorized terminal output and status messages
4. **Exit Codes**: Identical exit codes for different scenarios

### Rollback Plan

If needed, you can revert to the original bash script:

```bash
# Keep original as backup
cp work-loop.sh work-loop-legacy.sh

# Use environment variable to switch implementations
WORK_LOOP_USE_LEGACY=1 work-loop
```

## Architecture

### Core Components

- **LoopController**: Main orchestration logic for iteration management
- **QueueManager**: TFQ queue status checking and validation
- **TaskExecutor**: Claude command execution (`/show-next-task`, `/work-next-task`)
- **GitManager**: Automated git commit and push operations
- **StatusReporter**: Colorized terminal output and progress reporting

### Exit Conditions

The loop exits under these conditions:
- ✅ All tasks completed successfully
- ⚠️ TFQ queue has items (blocks execution)
- ❌ No task files found
- ⏰ Maximum iterations reached
- ⏹️ User interruption (Ctrl+C)
- 💥 Configuration or execution errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests for new functionality
4. Ensure all tests pass and coverage remains high
5. Submit a pull request

## License

MIT License - see LICENSE file for details.