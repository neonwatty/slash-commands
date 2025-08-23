# E2E Test Runner

This directory contains an automated bash script for running manual E2E tests of the work-loop CLI.

## Quick Start

```bash
# Run with default settings (3 minute timeout)
./run-e2e-manual.sh

# Debug mode with verbose output and temp directory preservation  
./run-e2e-manual.sh --verbose --keep-temp

# Extended timeout for slower systems or thorough testing
./run-e2e-manual.sh --timeout 300
```

## Status

✅ **Script is working correctly!** The E2E test successfully:
- Detects Claude installation (handles both command and alias scenarios)
- Creates proper test environment with TFQ and Claude integration
- Runs the TypeScript CLI with real tools
- Shows progress during Claude AI processing
- Validates the complete end-to-end workflow

## What the Script Does

1. **Prerequisites Check**: Verifies Node.js, TFQ, and Claude are installed
2. **Environment Setup**: Creates temporary calculator project with tasks
3. **CLI Build**: Ensures the TypeScript CLI is compiled  
4. **Test Execution**: Runs the CLI against real TFQ and Claude tools
5. **Verification**: Checks that files were modified correctly
6. **Results Report**: Shows before/after comparisons and test outcomes

## Output Examples

### Successful Run
```
✅ All prerequisites check passed
✅ Test environment ready at: /tmp/work-loop-manual-e2e-1692123456/simple-calculator
✅ CLI built successfully
✅ CLI completed successfully
✅ Multiply function added
✅ Divide function added
✅ Multiply tests added
✅ Divide tests added
✅ All tests pass!
🎉 E2E Test completed successfully!
```

### Partial Success
```
✅ CLI completed successfully
✅ Multiply function added
⚠️  Divide function NOT added
✅ Multiply tests added
⚠️  Divide tests NOT added
📝 Partial success: 2/4 enhancements completed
🎯 E2E test shows the CLI is working but needs more time
```

## Debugging

Use `--keep-temp` to preserve the temporary directory:

```bash
./run-e2e-manual.sh --keep-temp
```

Then examine the files manually:
```bash
ls /tmp/work-loop-manual-e2e-*/
cat /tmp/work-loop-manual-e2e-*/simple-calculator/src/calculator.js
```

## Requirements

- Node.js 18+
- TFQ installed and in PATH
- Claude Code installed and in PATH  
- Internet connection (for Claude AI processing)

## Timing

- **Setup**: ~10 seconds  
- **CLI execution**: 2-4 minutes (Claude AI processing takes time)
- **Verification**: ~5 seconds
- **Total**: 3-6 minutes typically

**Note**: The CLI makes progress in stages:
1. TFQ queue check (~5 seconds)
2. Task availability check (~30-60 seconds - Claude AI processing)  
3. Task execution (~1-3 minutes - Claude AI code generation)
4. Verification (~5 seconds)

The script includes proper timeout handling and will report partial success if Claude takes longer than expected.

## Integration with Existing Tests

This script complements the automated Vitest E2E test:

- **Vitest E2E** (`npm run test:e2e`): Automated, CI-friendly, stricter timeouts
- **Manual E2E** (`./run-e2e-manual.sh`): Interactive, debugging-friendly, flexible timeouts

Both tests validate the same functionality using the same fixtures and real tools.