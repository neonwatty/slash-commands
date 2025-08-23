# Manual Testing Setup for work-loop CLI

## Option 1: Safe Mock Test Environment

### Step 1: Create Test Project Structure
```bash
mkdir work-loop-test && cd work-loop-test
git init
echo "# Test Project" > README.md
git add README.md && git commit -m "Initial commit"

# Create tasks directory with sample tasks
mkdir tasks
```

### Step 2: Create Mock Tasks
```bash
# Task 1
cat > tasks/001-setup-project.md << 'EOF'
# Task 1: Project Setup

## Objective
Set up basic project structure for testing work-loop CLI.

## Requirements
- [ ] Create package.json
- [ ] Add basic TypeScript configuration
- [ ] Create src directory structure

## Success Criteria
- Project has proper structure
- Files are created and committed
EOF

# Task 2  
cat > tasks/002-add-dependencies.md << 'EOF'
# Task 2: Add Dependencies

## Objective
Add necessary dependencies for the test project.

## Requirements
- [ ] Add express as dependency
- [ ] Add @types/node as dev dependency
- [ ] Update package.json scripts

## Success Criteria
- Dependencies installed
- Package.json updated
EOF

# Task 3
cat > tasks/003-create-server.md << 'EOF'
# Task 3: Create Basic Server

## Objective
Create a simple Express server for testing.

## Requirements
- [ ] Create src/server.ts
- [ ] Add basic Express setup
- [ ] Add health check endpoint

## Success Criteria
- Server file created
- Code compiles without errors
EOF
```

### Step 3: Create Mock Claude Code Commands
Instead of using real Claude Code, create mock scripts:

```bash
# Create mock claude command (for testing without real Claude)
cat > claude-mock.sh << 'EOF'
#!/bin/bash

# Mock Claude Code for testing work-loop
case "$1" in
    "--dangerously-skip-permissions")
        case "$3" in
            '"/show-next-task"')
                # Find next task file
                TASK_FILES=(tasks/*.md)
                if [ ${#TASK_FILES[@]} -eq 0 ] || [ ! -f "${TASK_FILES[0]}" ]; then
                    echo "All tasks completed! 🎉"
                    exit 0
                fi
                
                # Return first task
                TASK_NUM=$(basename "${TASK_FILES[0]}" .md | grep -o '^[0-9]*')
                echo "## Next Task: $TASK_NUM"
                echo
                cat "${TASK_FILES[0]}"
                ;;
            '"/work-next-task"')
                echo "Mock: Working on task..."
                echo "✓ Task completed successfully"
                # Move completed task to done folder
                mkdir -p done
                TASK_FILES=(tasks/*.md)
                if [ -f "${TASK_FILES[0]}" ]; then
                    mv "${TASK_FILES[0]}" done/
                fi
                ;;
            '"/commit-push"')
                echo "Mock: Committing and pushing changes..."
                git add -A
                git commit -m "Complete task via work-loop automation" || echo "Nothing to commit"
                echo "✓ Changes committed successfully"
                ;;
        esac
        ;;
    *)
        echo "Mock Claude Code - unsupported command: $*"
        exit 1
        ;;
esac
EOF

chmod +x claude-mock.sh

# Add to PATH temporarily
export PATH="$PWD:$PATH"
```

### Step 4: Install TFQ (Task File Queue) Mock
```bash
# Create mock tfq command
cat > tfq << 'EOF'
#!/bin/bash
case "$1" in
    "count")
        # Return 0 to indicate empty queue (allows work-loop to proceed)
        echo "0"
        ;;
    "list")
        echo "TFQ Queue: Empty"
        ;;
    *)
        echo "Mock TFQ - command: $1"
        ;;
esac
EOF

chmod +x tfq
```

### Step 5: Test work-loop CLI
```bash
# Test 1: Basic functionality
work-loop --iterations 3 --verbose

# Test 2: Specific task
work-loop 2 --iterations 1

# Test 3: Custom directories  
work-loop "" ./tasks --iterations 2

# Test 4: No auto-commit
work-loop --no-auto-commit --iterations 1

# Test 5: No permission skipping (safety mode)
work-loop --no-skip-permissions --iterations 1
```

## Option 2: Real Project Integration (More Advanced)

### Prerequisites
- Real Claude Code installation
- Existing project with actual tasks
- Git repository with proper setup

### Step 1: Prepare Real Project
```bash
cd /path/to/your/real/project

# Ensure clean git state
git status
git stash  # if needed

# Create tasks directory if it doesn't exist
mkdir -p tasks

# Create a real task
cat > tasks/001-refactor-component.md << 'EOF'
# Task 1: Refactor User Component

## Objective
Refactor the UserProfile component to use TypeScript interfaces.

## Requirements
- [ ] Add proper TypeScript interfaces
- [ ] Remove any type usage
- [ ] Add prop validation
- [ ] Update tests if needed

## Files to modify
- src/components/UserProfile.tsx
- src/types/user.ts (create if needed)

## Success Criteria
- TypeScript compilation passes
- All tests pass
- Code is properly typed
EOF
```

### Step 2: Test with Real Claude Code
```bash
# Test show-next-task first
claude -p "/show-next-task"

# Test work-next-task on a safe task
claude -p "/work-next-task 1"

# If that works, try work-loop
work-loop --iterations 1 --verbose
```

## Option 3: Hybrid Approach (Recommended)

### Step 1: Use Real Project Structure, Mock Commands
```bash
cd /path/to/real/project

# Create alias for mock claude (temporary)
alias claude='~/Desktop/slash-commands/claude-mock.sh'

# Test work-loop with real project structure but safe mock commands
work-loop --iterations 2 --verbose --no-auto-commit
```

### Step 2: Gradual Real Integration
```bash
# Remove mock alias and test individual commands
unalias claude

# Test one command at a time
claude --dangerously-skip-permissions -p "/show-next-task"
```

## Testing Scenarios to Cover

### ✅ **Basic Functionality Tests**
1. **Empty Queue**: Verify TFQ integration works
2. **Task Detection**: Confirm it finds and parses tasks correctly
3. **Command Generation**: Check generated Claude commands are correct
4. **Auto-commit**: Verify git operations work as expected

### ✅ **Error Handling Tests**
1. **No Tasks Available**: `rm tasks/*.md` and run work-loop
2. **TFQ Queue Not Empty**: Mock tfq to return > 0 count
3. **Task Execution Failure**: Create invalid task that will fail
4. **Git Commit Failure**: Test in repo with nothing to commit

### ✅ **Configuration Tests**
1. **Custom Directories**: Test with different task/project paths
2. **Iteration Limits**: Test max iterations behavior
3. **Permission Modes**: Test with/without --dangerously-skip-permissions
4. **Environment Variables**: Test WORK_LOOP_* env vars

### ✅ **Integration Tests**
1. **Real Claude Commands**: Progressive testing with actual Claude Code
2. **Actual Task Execution**: Start with simple, safe tasks
3. **Git Integration**: Test commit/push functionality
4. **Error Recovery**: Test continuation after failures

## Safety Precautions

### 🛡️ **Before Running on Real Projects**
```bash
# 1. Always backup your work
git stash push -m "Before work-loop testing"

# 2. Create a test branch
git checkout -b test-work-loop

# 3. Start with --no-auto-commit
work-loop --no-auto-commit --iterations 1

# 4. Review changes before committing
git diff
git status
```

### 🚨 **Emergency Stop**
```bash
# If work-loop is running and needs to be stopped:
# 1. Ctrl+C (graceful shutdown)
# 2. Check git status
git status
git reset --hard HEAD  # if needed to revert changes
```

This testing approach gives you multiple safety levels, from completely safe mocks to full integration testing. Start with Option 1 and gradually progress based on your comfort level!