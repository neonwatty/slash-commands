#!/bin/bash

# Create Test Environment for work-loop CLI
# Usage: ./create-test-env.sh [test-dir-name]

set -e

TEST_DIR=${1:-"work-loop-test"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Creating work-loop test environment: $TEST_DIR"

# Create test directory
mkdir -p "$TEST_DIR" && cd "$TEST_DIR"

# Initialize git repo
git init
echo "# Work-Loop Test Project" > README.md
git add README.md && git commit -m "Initial commit"

# Create tasks directory
mkdir -p tasks done

echo "📝 Creating sample tasks..."

# Task 1: Simple file creation
cat > tasks/001-setup-project.md << 'EOF'
# Task 1: Project Setup

## Objective
Set up basic project structure for testing work-loop CLI.

## Requirements
- [ ] Create package.json with basic info
- [ ] Create src directory
- [ ] Add .gitignore file

## Files to create
- package.json
- src/index.js
- .gitignore

## Success Criteria
- Project structure is clean
- Files are properly formatted
- No syntax errors
EOF

# Task 2: Add dependencies
cat > tasks/002-add-dependencies.md << 'EOF'
# Task 2: Add Dependencies

## Objective
Add necessary dependencies for a basic Node.js project.

## Requirements
- [ ] Add express as dependency  
- [ ] Add nodemon as dev dependency
- [ ] Update package.json scripts

## Commands to run
```bash
npm init -y
npm install express
npm install --save-dev nodemon
```

## Success Criteria
- package.json has correct dependencies
- node_modules directory exists
- Scripts are properly configured
EOF

# Task 3: Create server
cat > tasks/003-create-server.md << 'EOF'
# Task 3: Create Basic Server

## Objective
Create a simple Express server.

## Requirements
- [ ] Create src/server.js with Express setup
- [ ] Add health check endpoint (/health)
- [ ] Add basic error handling

## Expected server.js content:
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Success Criteria
- Server starts without errors
- Health endpoint returns proper JSON
- Code follows basic conventions
EOF

echo "🤖 Creating mock Claude Code command..."

# Create mock claude command
cat > claude-mock.sh << 'EOF'
#!/bin/bash

# Mock Claude Code for testing work-loop
# This simulates Claude Code responses without actually using AI

TASKS_DIR="tasks"
DONE_DIR="done"

# Ensure done directory exists
mkdir -p "$DONE_DIR"

case "$1" in
    "--dangerously-skip-permissions")
        shift
        case "$2" in
            '"/show-next-task"'*)
                # Find next task file
                TASK_FILES=($TASKS_DIR/*.md)
                if [ ${#TASK_FILES[@]} -eq 0 ] || [ ! -f "${TASK_FILES[0]}" ]; then
                    echo "All tasks completed! 🎉"
                    echo "Great job! You've successfully completed all available tasks."
                    exit 0
                fi
                
                # Get first task number and content
                TASK_FILE="${TASK_FILES[0]}"
                TASK_NUM=$(basename "$TASK_FILE" .md | grep -o '^[0-9]*')
                
                echo "## Next Task: $TASK_NUM"
                echo
                cat "$TASK_FILE"
                ;;
            '"/work-next-task"'*)
                echo "🔄 Mock Claude: Working on task..."
                
                # Find and process first task
                TASK_FILES=($TASKS_DIR/*.md)
                if [ -f "${TASK_FILES[0]}" ]; then
                    TASK_FILE="${TASK_FILES[0]}"
                    TASK_NUM=$(basename "$TASK_FILE" .md | grep -o '^[0-9]*')
                    
                    echo "📋 Processing Task $TASK_NUM..."
                    
                    # Simulate task work based on task number
                    case "$TASK_NUM" in
                        "001")
                            echo "✅ Creating package.json..."
                            cat > package.json << 'PKG_EOF'
{
  "name": "work-loop-test",
  "version": "1.0.0",
  "description": "Test project for work-loop CLI",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": ["test"],
  "author": "Claude Code",
  "license": "MIT"
}
PKG_EOF
                            
                            echo "✅ Creating src directory and index.js..."
                            mkdir -p src
                            cat > src/index.js << 'JS_EOF'
console.log('Hello from work-loop test project!');
console.log('Task 1 completed successfully.');
JS_EOF
                            
                            echo "✅ Creating .gitignore..."
                            cat > .gitignore << 'GIT_EOF'
node_modules/
*.log
.env
dist/
coverage/
GIT_EOF
                            ;;
                        "002")
                            echo "✅ Installing dependencies..."
                            # Simulate npm install (don't actually run it for safety)
                            echo "  📦 express@4.18.2"
                            echo "  📦 nodemon@3.0.1"
                            
                            # Update package.json to show dependencies were added
                            if [ -f package.json ]; then
                                # Just update scripts for demo
                                echo "✅ Updated package.json scripts"
                            fi
                            ;;
                        "003")
                            echo "✅ Creating Express server..."
                            cat > src/server.js << 'SERVER_EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Work-loop test server is running!'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to work-loop test project!',
    tasks_completed: 'Task 3 - Basic server setup'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
SERVER_EOF
                            
                            echo "✅ Server setup complete!"
                            ;;
                    esac
                    
                    # Move completed task to done folder
                    mv "$TASK_FILE" "$DONE_DIR/"
                    echo "📁 Moved task to done folder: $DONE_DIR/"
                    echo "✅ Task $TASK_NUM completed successfully!"
                else
                    echo "❌ No tasks available to work on."
                fi
                ;;
            '"/commit-push"'*)
                echo "📝 Mock Claude: Committing and pushing changes..."
                git add -A
                
                # Create commit message
                COMPLETED_TASKS=$(ls "$DONE_DIR"/*.md 2>/dev/null | wc -l)
                COMMIT_MSG="Complete task via work-loop automation

🤖 Generated with work-loop CLI
✅ Tasks completed: $COMPLETED_TASKS

Co-Authored-By: Claude <noreply@anthropic.com>"

                if git commit -m "$COMMIT_MSG" 2>/dev/null; then
                    echo "✅ Changes committed successfully!"
                    echo "📊 Commit includes all current changes"
                else
                    echo "ℹ️  No changes to commit (working tree clean)"
                fi
                ;;
            *)
                echo "❌ Mock Claude: Unknown command: $2"
                exit 1
                ;;
        esac
        ;;
    "-p")
        # Handle -p flag without --dangerously-skip-permissions
        echo "⚠️  Mock Claude: Running with permission checks enabled"
        echo "   (This would normally show interactive prompts)"
        # For demo, just run the same logic
        exec "$0" --dangerously-skip-permissions "$@"
        ;;
    *)
        echo "❌ Mock Claude: Unsupported command structure: $*"
        echo "Supported formats:"
        echo "  claude --dangerously-skip-permissions -p \"/show-next-task\""
        echo "  claude --dangerously-skip-permissions -p \"/work-next-task\""
        echo "  claude --dangerously-skip-permissions -p \"/commit-push\""
        exit 1
        ;;
esac
EOF

chmod +x claude-mock.sh

echo "⚡ Creating mock TFQ command..."

# Create mock tfq command
cat > tfq << 'EOF'
#!/bin/bash

# Mock TFQ (Task File Queue) for testing

case "$1" in
    "count")
        # Always return 0 (empty queue) to allow work-loop to proceed
        echo "0"
        ;;
    "list")
        echo "TFQ Queue Status: Empty (mock)"
        echo "No items in queue - work-loop can proceed"
        ;;
    "add")
        echo "Mock TFQ: Added item to queue: $2"
        ;;
    "pop")
        echo "Mock TFQ: No items in queue to pop"
        ;;
    *)
        echo "Mock TFQ v1.0.0 (test mode)"
        echo "Available commands:"
        echo "  tfq count  - Show number of items in queue"
        echo "  tfq list   - List all items in queue"
        echo "  tfq add    - Add item to queue"
        echo "  tfq pop    - Remove item from queue"
        ;;
esac
EOF

chmod +x tfq

# Add current directory to PATH for this session
echo "🔧 Setting up PATH..."
export PATH="$PWD:$PATH"

echo
echo "✅ Test environment created successfully!"
echo
echo "📁 Location: $(pwd)"
echo "📋 Tasks created: $(ls tasks/*.md | wc -l)"
echo "🤖 Mock commands available: claude-mock.sh, tfq"
echo
echo "🚀 Ready to test! Try these commands:"
echo
echo "   # Test individual components:"
echo "   ./claude-mock.sh --dangerously-skip-permissions -p \"/show-next-task\""
echo "   ./tfq count"
echo
echo "   # Test work-loop (make sure work-loop is installed):"
echo "   work-loop --iterations 3 --verbose"
echo "   work-loop --no-auto-commit --iterations 1"
echo "   work-loop --no-skip-permissions --iterations 1"
echo
echo "   # Add to PATH temporarily:"
echo "   export PATH=\"\$PWD:\$PATH\""
echo
echo "📖 See test-setup.md for detailed testing instructions"
EOF

chmod +x create-test-env.sh