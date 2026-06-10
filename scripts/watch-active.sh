#!/bin/bash
# Active watch loop - checks every 10 minutes, auto-fixes critical findings

WATCH_LOG="reviews/watch-active.log"
CROSSCHECK_DIR="reviews"
BASELINE_CROSSCHECK="reviews/crosscheck-opencode-mimo-v2-5-free-20260610T191600-af4273d.md"

echo "$(date -u): Watch loop started - checking every 10 minutes" > "$WATCH_LOG"

check_and_fix() {
    local round=$1
    local timestamp=$(date -u +"%Y%m%dT%H%M%S")
    
    echo "$(date -u): Round $round - checking for new review files..." >> "$WATCH_LOG"
    
    # Find review files newer than baseline
    local new_files=$(find reviews/ -name "review-*.md" -newer "$BASELINE_CROSSCHECK" 2>/dev/null | head -5)
    
    if [ -z "$new_files" ]; then
        echo "$(date -u): Round $round - no new files" >> "$WATCH_LOG"
        return
    fi
    
    echo "$(date -u): Round $round - new files detected:" >> "$WATCH_LOG"
    echo "$new_files" >> "$WATCH_LOG"
    
    # Run cross-check on new files
    local crosscheck_file="reviews/watch-round${round}-crosscheck-${timestamp}.md"
    echo "$(date -u): Round $round - spawning cross-check agent..." >> "$WATCH_LOG"
    
    # The cross-check will be done by the parent opencode process
    echo "NEW_CROSSCHECK_NEEDED:$crosscheck_file" >> "$WATCH_LOG"
}

# Run for 24 rounds (4 hours at 10 min intervals)
for i in $(seq 1 24); do
    check_and_fix $i
    sleep 600  # 10 minutes
done

echo "$(date -u): Watch loop completed" >> "$WATCH_LOG"