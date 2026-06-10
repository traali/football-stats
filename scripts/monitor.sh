#!/bin/bash
# monitor.sh - Check watch log and trigger fixes for critical findings

WATCH_LOG="reviews/watch-active.log"
FIX_LOG="reviews/auto-fix.log"

echo "$(date -u): Monitor checking for action items..."

if [ ! -f "$WATCH_LOG" ]; then
    echo "No watch log found"
    exit 0
fi

# Check for new crosscheck needed
if grep -q "NEW_CROSSCHECK_NEEDED:" "$WATCH_LOG" 2>/dev/null; then
    crosscheck_file=$(grep "NEW_CROSSCHECK_NEEDED:" "$WATCH_LOG" | tail -1 | cut -d: -f2-)
    echo "Action needed: Cross-check required at $crosscheck_file"
    
    # Clear the trigger
    sed -i '' '/NEW_CROSSCHECK_NEEDED:/d' "$WATCH_LOG"
    
    # Output the action for the parent process
    echo "TRIGGER_CROSSCHECK:$crosscheck_file"
fi

# Check for critical findings in recent reviews
recent_reviews=$(find reviews/ -name "review-*.md" -newer reviews/crosscheck-opencode-mimo-v2-5-free-20260610T191600-af4273d.md 2>/dev/null)

if [ -n "$recent_reviews" ]; then
    for review in $recent_reviews; do
        if grep -q "## CRITICAL" "$review" 2>/dev/null; then
            echo "CRITICAL findings in $review"
            echo "$(date -u): CRITICAL findings detected in $review" >> "$FIX_LOG"
        fi
    done
fi