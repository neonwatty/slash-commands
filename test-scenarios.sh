#!/bin/bash

# Test Scenarios for work-loop CLI
# This script runs various test scenarios to validate functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="work-loop-test-scenarios"
WORK_LOOP_CMD="work-loop"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "TEST: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_info "Command: $test_command"
    echo
    
    # Run the command and capture exit code
    if eval "$test_command"; then
        exit_code=$?
        log_success "Command completed successfully (exit code: $exit_code)"
    else
        exit_code=$?
        if [ "$expected_result" = "should_fail" ]; then
            log_success "Command failed as expected (exit code: $exit_code)"
        else
            log_error "Command failed unexpectedly (exit code: $exit_code)"
            return 1
        fi
    fi
    
    echo
    return 0
}

setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Clean up previous test
    rm -rf "$TEST_DIR"
    
    # Create test environment
    bash "$SCRIPT_DIR/create-test-env.sh" "$TEST_DIR"
    
    cd "$TEST_DIR"
    
    # Add mock commands to PATH
    export PATH="$PWD:$PATH"
    
    log_success "Test environment ready at: $(pwd)"
}

test_basic_functionality() {
    echo
    echo "🧪 BASIC FUNCTIONALITY TESTS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    # Test 1: Help command
    run_test "Help Command" "$WORK_LOOP_CMD --help" "should_succeed"
    
    # Test 2: Version command
    run_test "Version Command" "$WORK_LOOP_CMD --version" "should_succeed"
    
    # Test 3: Show next task (via mock)
    run_test "Show Next Task (Mock)" "./claude-mock.sh --dangerously-skip-permissions -p '/show-next-task'" "should_succeed"
    
    # Test 4: TFQ count
    run_test "TFQ Count" "./tfq count" "should_succeed"
}

test_work_loop_scenarios() {
    echo
    echo "🔄 WORK-LOOP EXECUTION TESTS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    # Test 1: Single iteration with auto-commit
    run_test "Single Iteration with Auto-commit" "$WORK_LOOP_CMD --iterations 1 --verbose" "should_succeed"
    
    # Reset tasks for next test
    git reset --hard HEAD~1 2>/dev/null || true
    mv done/*.md tasks/ 2>/dev/null || true
    
    # Test 2: Multiple iterations
    run_test "Multiple Iterations" "$WORK_LOOP_CMD --iterations 2 --verbose" "should_succeed"
    
    # Reset tasks for next test
    git reset --hard HEAD~2 2>/dev/null || true
    mv done/*.md tasks/ 2>/dev/null || true
    
    # Test 3: No auto-commit
    run_test "No Auto-commit Mode" "$WORK_LOOP_CMD --iterations 1 --no-auto-commit --verbose" "should_succeed"
    
    # Check that no commit was made
    if [ "$(git log --oneline | wc -l)" -eq 1 ]; then
        log_success "Confirmed: No auto-commit performed"
    else
        log_warning "Expected no commits, but commits were found"
    fi
    
    # Reset for next test
    git reset --hard HEAD 2>/dev/null || true
    mv done/*.md tasks/ 2>/dev/null || true
}

test_configuration_options() {
    echo
    echo "⚙️  CONFIGURATION TESTS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    # Test 1: Custom timeout
    run_test "Custom Timeout" "$WORK_LOOP_CMD --iterations 1 --timeout 60000 --verbose" "should_succeed"
    
    # Reset
    git reset --hard HEAD~1 2>/dev/null || true
    mv done/*.md tasks/ 2>/dev/null || true
    
    # Test 2: No skip permissions (safety mode)
    run_test "Safety Mode (No Skip Permissions)" "$WORK_LOOP_CMD --iterations 1 --no-skip-permissions --verbose" "should_succeed"
    
    # Reset
    git reset --hard HEAD~1 2>/dev/null || true
    mv done/*.md tasks/ 2>/dev/null || true
    
    # Test 3: Verbose mode
    run_test "Verbose Mode" "$WORK_LOOP_CMD --iterations 1 --verbose" "should_succeed"
    
    # Reset
    git reset --hard HEAD~1 2>/dev/null || true
    mv done/*.md tasks/ 2>/dev/null || true
}

test_edge_cases() {
    echo
    echo "🎯 EDGE CASE TESTS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    # Test 1: No tasks available
    mv tasks/*.md done/ 2>/dev/null || true
    run_test "No Tasks Available" "$WORK_LOOP_CMD --iterations 1 --verbose" "should_succeed"
    
    # Test 2: All tasks completed scenario
    log_info "Tasks completed scenario already tested above"
    
    # Restore tasks for cleanup
    mv done/*.md tasks/ 2>/dev/null || true
    
    # Test 3: Invalid arguments
    run_test "Invalid Arguments" "$WORK_LOOP_CMD --invalid-flag" "should_fail"
}

test_git_integration() {
    echo
    echo "📝 GIT INTEGRATION TESTS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    # Test 1: Commit message format
    log_info "Running task with commit to test git integration..."
    $WORK_LOOP_CMD --iterations 1 --verbose
    
    # Check latest commit message
    local latest_commit=$(git log -1 --pretty=format:"%s")
    log_info "Latest commit: $latest_commit"
    
    if [[ "$latest_commit" == *"work-loop automation"* ]]; then
        log_success "Commit message format is correct"
    else
        log_warning "Commit message format may need review"
    fi
    
    # Test 2: Git status after automation
    local git_status=$(git status --porcelain)
    if [ -z "$git_status" ]; then
        log_success "Git working tree is clean after automation"
    else
        log_warning "Git working tree has uncommitted changes"
        echo "$git_status"
    fi
}

run_performance_test() {
    echo
    echo "⚡ PERFORMANCE TESTS"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    # Reset tasks
    mv done/*.md tasks/ 2>/dev/null || true
    
    log_info "Running performance test with timing..."
    local start_time=$(date +%s)
    
    $WORK_LOOP_CMD --iterations 3 --verbose
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Completed 3 iterations in ${duration} seconds"
    
    if [ $duration -lt 30 ]; then
        log_success "Performance: Excellent (< 30s)"
    elif [ $duration -lt 60 ]; then
        log_success "Performance: Good (< 60s)"
    else
        log_warning "Performance: Slow (> 60s) - consider optimization"
    fi
}

generate_test_report() {
    echo
    echo "📊 TEST REPORT"
    echo "════════════════════════════════════════════════════════════════════════════════"
    
    log_info "Test Environment: $(pwd)"
    log_info "Work-loop Version: $($WORK_LOOP_CMD --version)"
    log_info "Git Commits Made: $(git log --oneline | wc -l)"
    log_info "Tasks Processed: $(ls done/*.md 2>/dev/null | wc -l)"
    log_info "Remaining Tasks: $(ls tasks/*.md 2>/dev/null | wc -l)"
    
    echo
    log_info "Git History:"
    git log --oneline -5
    
    echo
    log_info "Final Directory Structure:"
    find . -type f -name "*.md" -o -name "*.js" -o -name "*.json" | sort
    
    echo
    log_success "All tests completed! Check the output above for any issues."
    log_info "Test environment preserved at: $(pwd)"
    log_info "You can manually inspect the results or run additional tests."
}

cleanup_and_exit() {
    echo
    log_info "Test session completed."
    log_info "To clean up: rm -rf $(pwd)"
    log_info "To run again: $SCRIPT_DIR/test-scenarios.sh"
}

# Main test execution
main() {
    echo "🚀 WORK-LOOP CLI TESTING SUITE"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo
    
    # Check if work-loop is available
    if ! command -v "$WORK_LOOP_CMD" &> /dev/null; then
        log_error "work-loop command not found!"
        log_info "Please install work-loop CLI first:"
        log_info "  cd $SCRIPT_DIR && npm run install-global"
        exit 1
    fi
    
    log_success "Found work-loop CLI: $(which $WORK_LOOP_CMD)"
    
    # Set up test environment
    setup_test_environment
    
    # Run test suites
    test_basic_functionality
    test_work_loop_scenarios
    test_configuration_options
    test_edge_cases
    test_git_integration
    run_performance_test
    
    # Generate report
    generate_test_report
    
    # Cleanup instructions
    cleanup_and_exit
}

# Run main function
main "$@"