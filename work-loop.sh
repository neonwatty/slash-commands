#!/bin/bash

# Script to run work-next-task command in a loop with tfq queue monitoring
# Exits if tfq queue length > 0 or after 20 iterations
# Automatically commits and pushes successful task completions when tfq queue is empty
#
# Usage: ./work-loop.sh [task-number] [tasks-directory] [project-directory]
# Examples:
#   ./work-loop.sh                              # Next task from /tasks, TFQ in current dir
#   ./work-loop.sh 5                            # Task 5 from /tasks, TFQ in current dir
#   ./work-loop.sh "" ./my-tasks                # Next task from ./my-tasks, TFQ in current dir
#   ./work-loop.sh 3 ./my-tasks ./project       # Task 3 from ./my-tasks, TFQ in ./project

# ============================================================================
# COLOR AND FORMATTING DEFINITIONS
# ============================================================================

# ANSI Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Unicode Box Drawing Characters
BOX_H='─'
BOX_V='│'
BOX_TL='┌'
BOX_TR='┐'
BOX_BL='└'
BOX_BR='┘'
BOX_CROSS='┼'
BOX_T='┬'
BOX_B='┴'

# ============================================================================
# FORMATTING FUNCTIONS
# ============================================================================

print_header() {
    local text="$1"
    local width=60
    local padding=$(( (width - ${#text} - 2) / 2 ))
    
    echo -e "${CYAN}${BOX_TL}$(printf "%${width}s" | tr ' ' "${BOX_H}")${BOX_TR}${NC}"
    echo -e "${CYAN}${BOX_V}$(printf "%${padding}s")${BOLD}${WHITE}${text}${NC}$(printf "%${padding}s")${CYAN}${BOX_V}${NC}"
    echo -e "${CYAN}${BOX_BL}$(printf "%${width}s" | tr ' ' "${BOX_H}")${BOX_BR}${NC}"
}

print_section() {
    local text="$1"
    echo -e "\n${BOLD}${BLUE}▶ ${text}${NC}"
}

print_success() {
    local text="$1"
    echo -e "  ${GREEN}✓${NC} ${text}"
}

print_error() {
    local text="$1"
    echo -e "  ${RED}✗${NC} ${text}"
}

print_warning() {
    local text="$1"
    echo -e "  ${YELLOW}⚠${NC} ${text}"
}

print_info() {
    local text="$1"
    echo -e "  ${BLUE}ℹ${NC} ${text}"
}

print_status() {
    local status="$1"
    local text="$2"
    case "$status" in
        "running") echo -e "  ${YELLOW}⏳${NC} ${text}" ;;
        "complete") echo -e "  ${GREEN}✅${NC} ${text}" ;;
        "failed") echo -e "  ${RED}❌${NC} ${text}" ;;
        *) echo -e "  ${text}" ;;
    esac
}

print_separator() {
    echo -e "${DIM}$(printf "%60s" | tr ' ' "${BOX_H}")${NC}"
}

print_iteration_header() {
    local current="$1"
    local total="$2"
    local width=60
    local text="ITERATION ${current}/${total}"
    local padding=$(( (width - ${#text} - 2) / 2 ))
    
    echo -e "\n${MAGENTA}${BOX_TL}$(printf "%${width}s" | tr ' ' "${BOX_H}")${BOX_TR}${NC}"
    echo -e "${MAGENTA}${BOX_V}$(printf "%${padding}s")${BOLD}${WHITE}${text}${NC}$(printf "%${padding}s")${MAGENTA}${BOX_V}${NC}"
    echo -e "${MAGENTA}${BOX_BL}$(printf "%${width}s" | tr ' ' "${BOX_H}")${BOX_BR}${NC}"
}

# Parse command line arguments
TASK_ARG=""
TASKS_DIR_ARG=""
PROJECT_DIR_ARG=""

if [ $# -ge 1 ] && [ -n "$1" ]; then
    TASK_ARG="$1"
fi

if [ $# -ge 2 ] && [ -n "$2" ]; then
    TASKS_DIR_ARG="$2"
fi

if [ $# -ge 3 ] && [ -n "$3" ]; then
    PROJECT_DIR_ARG="$3"
fi

# Build command arguments strings for different commands
# show-next-task: only needs task number and tasks directory (2 params)
SHOW_TASK_ARGS=""
if [ -n "$TASK_ARG" ] && [ -n "$TASKS_DIR_ARG" ]; then
    SHOW_TASK_ARGS="$TASK_ARG $TASKS_DIR_ARG"
elif [ -n "$TASK_ARG" ]; then
    SHOW_TASK_ARGS="$TASK_ARG"
elif [ -n "$TASKS_DIR_ARG" ]; then
    SHOW_TASK_ARGS="\"\" $TASKS_DIR_ARG"  # Empty task number
fi

# work-next-task: needs all three parameters (3 params)
WORK_TASK_ARGS=""
if [ -n "$TASK_ARG" ] && [ -n "$TASKS_DIR_ARG" ] && [ -n "$PROJECT_DIR_ARG" ]; then
    WORK_TASK_ARGS="$TASK_ARG $TASKS_DIR_ARG $PROJECT_DIR_ARG"
elif [ -n "$TASK_ARG" ] && [ -n "$TASKS_DIR_ARG" ]; then
    WORK_TASK_ARGS="$TASK_ARG $TASKS_DIR_ARG"
elif [ -n "$TASK_ARG" ] && [ -n "$PROJECT_DIR_ARG" ]; then
    WORK_TASK_ARGS="$TASK_ARG \"\" $PROJECT_DIR_ARG"  # Empty tasks dir
elif [ -n "$TASK_ARG" ]; then
    WORK_TASK_ARGS="$TASK_ARG"
elif [ -n "$TASKS_DIR_ARG" ] && [ -n "$PROJECT_DIR_ARG" ]; then
    WORK_TASK_ARGS="\"\" $TASKS_DIR_ARG $PROJECT_DIR_ARG"  # Empty task number
elif [ -n "$TASKS_DIR_ARG" ]; then
    WORK_TASK_ARGS="\"\" $TASKS_DIR_ARG"  # Empty task number
elif [ -n "$PROJECT_DIR_ARG" ]; then
    WORK_TASK_ARGS="\"\" \"\" $PROJECT_DIR_ARG"  # Empty task and tasks dir
fi

MAX_ITERATIONS=20
ITERATION=0
START_TIME=$(date +%s)

# ============================================================================
# STARTUP SUMMARY
# ============================================================================

clear
print_header "TASK AUTOMATION LOOP"

echo -e "${BOLD}Configuration:${NC}"
print_info "Max iterations: ${MAGENTA}${MAX_ITERATIONS}${NC}"
if [ -n "$TASK_ARG" ]; then
    print_info "Target task: ${MAGENTA}${TASK_ARG}${NC}"
fi
if [ -n "$TASKS_DIR_ARG" ]; then
    print_info "Tasks directory: ${MAGENTA}${TASKS_DIR_ARG}${NC}"
fi
if [ -n "$PROJECT_DIR_ARG" ]; then
    print_info "Project directory: ${MAGENTA}${PROJECT_DIR_ARG}${NC}"
fi
if [ -n "$SHOW_TASK_ARGS" ] || [ -n "$WORK_TASK_ARGS" ]; then
    print_info "Show-task args: ${MAGENTA}'${SHOW_TASK_ARGS}'${NC}"
    print_info "Work-task args: ${MAGENTA}'${WORK_TASK_ARGS}'${NC}"
fi

echo -e "\n${BOLD}Process Flow:${NC}"
print_info "Check TFQ queue status"
print_info "Verify task availability"
print_info "Execute work-next-task"
print_info "Auto-commit on success (if TFQ empty)"

print_separator

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    ITERATION_START_TIME=$(date +%s)
    
    print_iteration_header "$ITERATION" "$MAX_ITERATIONS"
    
    # Check tfq queue length before running
    print_section "TFQ Queue Status Check"
    print_status "running" "Checking TFQ queue..."
    
    QUEUE_LENGTH=$(tfq count 2>/dev/null)
    TFQ_EXIT_CODE=$?
    
    if [ $TFQ_EXIT_CODE -eq 0 ]; then
        if [ $QUEUE_LENGTH -gt 0 ]; then
            print_error "TFQ queue has ${MAGENTA}${QUEUE_LENGTH}${NC} items - ${RED}HALTING${NC}"
            echo -e "\n${YELLOW}📊 Final Status: Stopped due to TFQ queue items${NC}"
            exit 0
        else
            print_success "TFQ queue is empty (${GREEN}${QUEUE_LENGTH}${NC} items)"
        fi
    else
        print_warning "Could not check TFQ status (command may not be available)"
    fi
    
    # Check if tasks are available before executing
    print_section "Task Availability Check"
    print_status "running" "Checking for available tasks..."
    
    if [ -n "$SHOW_TASK_ARGS" ]; then
        TASK_CHECK_OUTPUT=$(claude -p "/show-next-task $SHOW_TASK_ARGS" 2>&1)
    else
        TASK_CHECK_OUTPUT=$(claude -p "/show-next-task" 2>&1)
    fi
    TASK_CHECK_EXIT_CODE=$?
    
    if echo "$TASK_CHECK_OUTPUT" | grep -q "All tasks completed!"; then
        print_success "${GREEN}All tasks completed!${NC} 🎉"
        echo -e "\n${GREEN}🏆 Final Status: All tasks successfully completed${NC}"
        exit 0
    elif echo "$TASK_CHECK_OUTPUT" | grep -q "No task file found"; then
        print_error "No task files found"
        echo -e "\n${RED}❌ Final Status: No task files available${NC}"
        exit 1
    fi
    
    # Extract task number from show-next-task output for commit message
    CURRENT_TASK_NUMBER=$(echo "$TASK_CHECK_OUTPUT" | grep -o "## Next Task: [0-9]*" | grep -o "[0-9]*" | head -1)
    if [ -z "$CURRENT_TASK_NUMBER" ]; then
        # Fallback: try to extract from "Task [number]" pattern
        CURRENT_TASK_NUMBER=$(echo "$TASK_CHECK_OUTPUT" | grep -o "Task [0-9]*" | grep -o "[0-9]*" | head -1)
    fi
    
    if [ -n "$CURRENT_TASK_NUMBER" ]; then
        print_success "Found task number: ${MAGENTA}${CURRENT_TASK_NUMBER}${NC}"
    else
        print_warning "Could not extract task number from output"
    fi
    
    print_success "Tasks available - proceeding to execution"
    
    # Execute the work-next-task command using claude code
    print_section "Task Execution"
    print_status "running" "Executing work-next-task command..."
    
    if [ -n "$WORK_TASK_ARGS" ]; then
        claude -p "/work-next-task $WORK_TASK_ARGS"
    else
        claude -p "/work-next-task"
    fi
    
    CLAUDE_EXIT_CODE=$?
    if [ $CLAUDE_EXIT_CODE -ne 0 ]; then
        print_error "Task execution failed (exit code: ${RED}${CLAUDE_EXIT_CODE}${NC})"
        print_warning "Continuing to next iteration..."
    else
        print_success "work-next-task completed successfully"
        
        # Check tfq queue again after execution
        print_section "Post-Execution TFQ Check"
        print_status "running" "Checking TFQ queue status after execution..."
        
        QUEUE_LENGTH=$(tfq count 2>/dev/null)
        TFQ_EXIT_CODE=$?
        
        if [ $TFQ_EXIT_CODE -eq 0 ]; then
            if [ $QUEUE_LENGTH -gt 0 ]; then
                print_error "TFQ queue now has ${MAGENTA}${QUEUE_LENGTH}${NC} items - ${RED}HALTING${NC}"
                echo -e "\n${YELLOW}📊 Final Status: Stopped due to TFQ queue items after execution${NC}"
                exit 0
            else
                print_success "TFQ queue still empty (${GREEN}${QUEUE_LENGTH}${NC} items)"
                
                # TFQ queue is empty and work-next-task succeeded - commit and push
                print_section "Auto-Commit & Push"
                print_status "running" "TFQ queue empty - committing and pushing changes..."
                
                if [ -n "$CURRENT_TASK_NUMBER" ]; then
                    print_info "Committing with task number: ${MAGENTA}${CURRENT_TASK_NUMBER}${NC}"
                    claude -p "/commit-push $CURRENT_TASK_NUMBER"
                else
                    print_info "Committing without specific task number"
                    claude -p "/commit-push"
                fi
                
                COMMIT_EXIT_CODE=$?
                if [ $COMMIT_EXIT_CODE -eq 0 ]; then
                    print_success "Successfully committed and pushed changes 🚀"
                else
                    print_error "Commit/push failed (exit code: ${RED}${COMMIT_EXIT_CODE}${NC})"
                fi
            fi
        else
            print_warning "Could not check TFQ status after execution"
        fi
    fi
    
    # Calculate iteration time
    ITERATION_END_TIME=$(date +%s)
    ITERATION_DURATION=$((ITERATION_END_TIME - ITERATION_START_TIME))
    
    print_separator
    print_success "Iteration ${MAGENTA}${ITERATION}${NC} completed in ${YELLOW}${ITERATION_DURATION}s${NC}"
done

# ============================================================================
# COMPLETION SUMMARY
# ============================================================================

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

echo ""
print_header "LOOP COMPLETED"

echo -e "${BOLD}Summary:${NC}"
print_info "Completed iterations: ${MAGENTA}${MAX_ITERATIONS}${NC}"
print_info "Total runtime: ${YELLOW}${MINUTES}m ${SECONDS}s${NC}"
print_info "Average per iteration: ${YELLOW}$((TOTAL_DURATION / MAX_ITERATIONS))s${NC}"

echo -e "\n${BOLD}Status:${NC}"
print_warning "Reached maximum iteration limit"
print_info "Some tasks may remain unfinished"

echo -e "\n${BOLD}Next Steps:${NC}"
print_info "Check task status manually with: ${CYAN}/show-next-task${NC}"
print_info "Check TFQ queue with: ${CYAN}tfq list${NC}"

print_separator
echo -e "${DIM}Run completed at $(date)${NC}"