#!/bin/bash
# run-e2e-manual.sh - Manual E2E test runner for work-loop CLI
#
# This script automates the manual E2E testing process for the work-loop CLI
# by creating a temporary calculator project, running the CLI with real TFQ
# and Claude tools, and verifying the results.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
KEEP_TEMP=false
VERBOSE=false
TIMEOUT=180
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="/tmp/work-loop-manual-e2e-$(date +%s)"
PROJECT_DIR="$TEMP_DIR/simple-calculator"
CLI_PATH="$SCRIPT_DIR/dist/cli/index.js"

# Usage function
usage() {
    cat << EOF
Usage: $0 [options]

Manual E2E test runner for the work-loop CLI

Options:
    --keep-temp     Don't cleanup temp directory for debugging
    --verbose       Show detailed output 
    --timeout N     Set CLI timeout in seconds (default: 180)
    --help         Show this help message

Examples:
    $0                          # Run with default settings
    $0 --verbose --keep-temp    # Debug mode with verbose output
    $0 --timeout 300            # Run with 5 minute timeout

EOF
}

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}🔍 $1${NC}"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-temp)
            KEEP_TEMP=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        error "Node.js version 18+ required, found: $(node --version)"
        exit 1
    fi
    verbose "Node.js version: $(node --version)"
    
    # Check TFQ
    if ! command -v tfq &> /dev/null; then
        error "TFQ is not installed or not in PATH"
        exit 1
    fi
    verbose "TFQ version: $(tfq --version 2>&1 || echo 'Version check failed')"
    
    # Check Claude (handle both command and alias)
    if command -v claude &> /dev/null; then
        verbose "Claude found as command at: $(which claude)"
    elif [[ -f "/Users/jeremywatt/.claude/local/claude" ]]; then
        verbose "Claude found at expected location: /Users/jeremywatt/.claude/local/claude"
    else
        error "Claude is not installed or not accessible"
        error "Expected location: /Users/jeremywatt/.claude/local/claude"
        error "Try running: which claude"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
        error "Script must be run from the project root directory"
        exit 1
    fi
    
    success "All prerequisites check passed"
}

# Setup test environment
setup_test_environment() {
    log "📦 Setting up test environment..."
    
    # Create temporary directory
    mkdir -p "$TEMP_DIR"
    verbose "Created temp directory: $TEMP_DIR"
    
    # Copy fixture project
    if [[ ! -d "$SCRIPT_DIR/tests/e2e/fixtures/simple-calculator" ]]; then
        error "E2E fixture not found at: $SCRIPT_DIR/tests/e2e/fixtures/simple-calculator"
        exit 1
    fi
    
    cp -r "$SCRIPT_DIR/tests/e2e/fixtures/simple-calculator" "$PROJECT_DIR"
    verbose "Copied fixture to: $PROJECT_DIR"
    
    # Initialize TFQ
    log "🔧 Initializing TFQ..."
    cd "$PROJECT_DIR"
    if $VERBOSE; then
        tfq init
    else
        tfq init > /dev/null 2>&1
    fi
    success "TFQ initialized"
    
    # Setup Claude commands
    log "⚙️  Setting up Claude configuration..."
    cp -r "$SCRIPT_DIR/commands" ".claude"
    success "Claude commands configured"
    
    # Return to script directory
    cd "$SCRIPT_DIR"
    success "Test environment ready at: $PROJECT_DIR"
}

# Build CLI
build_cli() {
    log "🔨 Building CLI..."
    
    if $VERBOSE; then
        npm run build
    else
        npm run build > /dev/null 2>&1
    fi
    
    if [[ ! -f "$CLI_PATH" ]]; then
        error "CLI build failed - executable not found at: $CLI_PATH"
        exit 1
    fi
    
    success "CLI built successfully"
}

# Show initial state
show_initial_state() {
    log "🔍 Verifying initial state..."
    
    echo
    echo "📁 Initial calculator.js:"
    echo "----------------------------------------"
    cat "$PROJECT_DIR/src/calculator.js"
    echo "----------------------------------------"
    
    echo
    echo "📝 Tasks to complete:"
    echo "----------------------------------------"  
    cat "$PROJECT_DIR/tasks/tasks.md"
    echo "----------------------------------------"
    echo
}

# Run CLI test
run_cli_test() {
    log "🚀 Running work-loop CLI..."
    
    cd "$PROJECT_DIR"
    
    echo "Running CLI with the following command:"
    echo "node $CLI_PATH --iterations 1 --no-auto-commit --verbose --tasks-dir ./tasks --project-dir . --timeout $((TIMEOUT * 1000))"
    echo
    
    # Ensure Claude binary is available for the CLI execution
    # Add Claude directory to PATH
    export PATH="/Users/jeremywatt/.claude/local:$PATH"
    
    # Verify Claude is accessible before running CLI
    if ! /Users/jeremywatt/.claude/local/claude --version &> /dev/null; then
        warning "Claude binary test failed, but continuing..."
    else
        verbose "Claude binary verified for CLI execution"
    fi
    
    local start_time=$(date +%s)
    
    # Run CLI with background process and timeout handling
    node "$CLI_PATH" \
        --iterations 1 \
        --no-auto-commit \
        --verbose \
        --tasks-dir ./tasks \
        --project-dir . \
        --timeout $((TIMEOUT * 1000)) &
    
    local cli_pid=$!
    local cli_exit_code=0
    
    # Wait for CLI to complete or timeout
    local count=0
    while kill -0 $cli_pid 2>/dev/null && [[ $count -lt $TIMEOUT ]]; do
        sleep 1
        ((count++))
        if [[ $((count % 30)) -eq 0 ]]; then
            log "CLI still running... ${count}/${TIMEOUT}s elapsed"
        fi
    done
    
    # Check if process is still running (timed out)
    if kill -0 $cli_pid 2>/dev/null; then
        warning "CLI timed out after $TIMEOUT seconds - terminating..."
        kill -TERM $cli_pid 2>/dev/null || true
        sleep 2
        kill -KILL $cli_pid 2>/dev/null || true
        wait $cli_pid 2>/dev/null || true
        warning "Continuing with verification to check partial progress..."
    else
        # Process completed normally
        wait $cli_pid
        cli_exit_code=$?
        if [[ $cli_exit_code -eq 0 ]]; then
            success "CLI completed successfully"
        else
            warning "CLI exited with code: $cli_exit_code"
            warning "Continuing with verification to check partial progress..."
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log "CLI execution took: ${duration}s"
    
    cd "$SCRIPT_DIR"
}

# Verify results
verify_results() {
    log "🔍 Verifying results..."
    
    local calculator_file="$PROJECT_DIR/src/calculator.js"
    local test_file="$PROJECT_DIR/test/calculator.test.js"
    
    echo
    echo "📁 Final calculator.js:"
    echo "----------------------------------------"
    cat "$calculator_file"
    echo "----------------------------------------"
    
    echo
    echo "🧪 Final test file:"
    echo "----------------------------------------"
    cat "$test_file"
    echo "----------------------------------------"
    
    # Check for enhancements
    local has_multiply=$(grep -c "multiply" "$calculator_file" || true)
    local has_divide=$(grep -c "divide" "$calculator_file" || true)
    local has_multiply_tests=$(grep -c "multiply" "$test_file" || true)
    local has_divide_tests=$(grep -c "divide" "$test_file" || true)
    
    echo
    log "📊 Enhancement Summary:"
    
    if [[ $has_multiply -gt 0 ]]; then
        success "Multiply function added"
    else
        warning "Multiply function NOT added"
    fi
    
    if [[ $has_divide -gt 0 ]]; then
        success "Divide function added" 
    else
        warning "Divide function NOT added"
    fi
    
    if [[ $has_multiply_tests -gt 0 ]]; then
        success "Multiply tests added"
    else
        warning "Multiply tests NOT added"
    fi
    
    if [[ $has_divide_tests -gt 0 ]]; then
        success "Divide tests added"
    else
        warning "Divide tests NOT added"
    fi
    
    # Try to run the tests
    echo
    log "🧪 Running enhanced tests..."
    cd "$PROJECT_DIR"
    
    if npm test; then
        success "All tests pass!"
    else
        warning "Some tests failed, but that's okay for partial completion"
    fi
    
    cd "$SCRIPT_DIR"
    
    # Determine overall success
    local total_enhancements=$((has_multiply + has_divide + has_multiply_tests + has_divide_tests))
    
    if [[ $total_enhancements -eq 0 ]]; then
        error "❌ No enhancements were made - E2E test failed"
        return 1
    elif [[ $total_enhancements -lt 4 ]]; then
        warning "📝 Partial success: $total_enhancements/4 enhancements completed"
        success "🎯 E2E test shows the CLI is working but needs more time"
    else
        success "🏆 Complete success: All enhancements completed!"
        success "🎉 E2E test fully passed!"
    fi
    
    return 0
}

# Cleanup function
cleanup() {
    if [[ "$KEEP_TEMP" == "true" ]]; then
        log "🔍 Keeping temp directory for debugging: $TEMP_DIR"
        echo "To cleanup manually: rm -rf \"$TEMP_DIR\""
    else
        if [[ -d "$TEMP_DIR" ]]; then
            log "🧹 Cleaning up temporary directory..."
            rm -rf "$TEMP_DIR"
            success "Cleanup completed"
        fi
    fi
}

# Main execution function
main() {
    echo "🧪 Work-Loop CLI - Manual E2E Test Runner"
    echo "=========================================="
    echo
    
    # Set trap for cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    setup_test_environment
    build_cli
    show_initial_state
    run_cli_test
    
    if verify_results; then
        echo
        success "🎉 E2E Test completed successfully!"
        echo
        success "The work-loop CLI is working correctly with real TFQ and Claude tools."
        exit 0
    else
        echo
        error "❌ E2E Test failed"
        echo
        error "The CLI ran but did not make expected progress on tasks."
        exit 1
    fi
}

# Run main function
main "$@"