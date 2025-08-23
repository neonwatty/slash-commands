# /tfq-run - Run Tests and Populate Queue

## Context
- Target directory: "$DIRECTORY" (defaults to repository root if not specified)

## Description
Runs all tests in the project and automatically adds failing tests to the TFQ queue for processing.

## Implementation

### 1. Change Directory (if target provided)
If `$DIRECTORY` is provided:
- Use the Bash tool to execute `cd "$DIRECTORY"` to change to the target directory

### 2. Run Tests with Auto-Add
Use the Bash tool to execute:
```bash
tfq run-tests --auto-detect --auto-add --json
```

### 3. Display Queue Status
Use the Bash tool to execute:
```bash
tfq list --json
```

Parse the JSON output to check if the queue has items. An empty items array means all tests passed.

## Options

### Specify Language/Framework
If auto-detection fails, specify explicitly using the Bash tool:
```bash
tfq run-tests --language javascript --framework jest --auto-add
```

### Clear Queue Before Running
To start fresh, use the Bash tool to execute:
```bash
tfq clear --confirm
tfq run-tests --auto-detect --auto-add
```

## Error Handling

- If no test framework is detected, suggest specifying language/framework
- If test command fails, show error and suggest manual configuration
- If queue operations fail, check TFQ_DB_PATH environment variable