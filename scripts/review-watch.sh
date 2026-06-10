#!/usr/bin/env bash
set -uo pipefail
MODEL="${1:-deepseek-v4-flash-free}"
REVIEWS_DIR="reviews"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CHECK_INTERVAL=600
MAX_ROUNDS=24
LAST_CHECK_MARKER="$REVIEWS_DIR/.last_watch_check"

cd "$PROJECT_DIR" || exit 1
mkdir -p "$REVIEWS_DIR"

echo "=== Aggressive Review Watch Loop ==="
echo "Model: $MODEL"
echo "Check interval: ${CHECK_INTERVAL}s (every 10 min)"
echo "Max rounds: $MAX_ROUNDS (4 hours total)"
echo "Start: $(date -u +%Y%m%dT%H%M%S)"
echo ""

touch "$LAST_CHECK_MARKER"

for i in $(seq 1 "$MAX_ROUNDS"); do
    echo "--- Check $i/$MAX_ROUNDS @ $(date -u +%Y%m%dT%H%M%S) ---"

    FIND_CMD="find $REVIEWS_DIR -name 'review-*.md' -newer $LAST_CHECK_MARKER"
    NEW_FILES=$(eval "$FIND_CMD" 2>/dev/null | head -20)

    if [ -n "$NEW_FILES" ]; then
        DATETIME=$(date -u +%Y%m%dT%H%M%S)
        GIT_SHA=$(git rev-parse --short HEAD)
        REPORT="$REVIEWS_DIR/watch-round${i}-${MODEL}-${DATETIME}.md"

        echo "New files detected:"
        echo "$NEW_FILES"

        # Build the watch report
        {
            echo "# Watch Round $i"
            echo "**Time**: $DATETIME"
            echo "**Model**: $MODEL"
            echo "**Git SHA**: $GIT_SHA"
            echo ""
            echo "## New Review Files"
            echo '```'
            echo "$NEW_FILES"
            echo '```'
            echo ""
            echo "## Content Summary"
        } > "$REPORT"

        # Append each file's content
        while IFS= read -r f; do
            echo "" >> "$REPORT"
            echo "### File: $f" >> "$REPORT"
            echo "" >> "$REPORT"
            size=$(wc -c < "$f")
            if [ "$size" -gt 100 ]; then
                cat "$f" >> "$REPORT"
            else
                echo "(stub/error file, ${size} bytes)" >> "$REPORT"
            fi
        done <<< "$NEW_FILES"

        # Create auto-fix trigger file for opencode to pick up
        TRIGGER="$REVIEWS_DIR/.fix-trigger-${DATETIME}"
        echo "$NEW_FILES" > "$TRIGGER"

        # Git commit the detected changes
        git add "$REVIEWS_DIR/"
        git commit -m "review: $MODEL — watch round ${i} ($(echo "$NEW_FILES" | wc -l) new files)" --no-gpg-sign 2>/dev/null || true

        echo "Fixes needed — trigger written to $TRIGGER"
    else
        echo "No new files."
    fi

    touch "$LAST_CHECK_MARKER"
    sleep "$CHECK_INTERVAL"
done

echo ""
echo "=== Watch Loop Complete ==="
echo "End: $(date -u +%Y%m%dT%H%M%S)"
