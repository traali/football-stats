#!/usr/bin/env bash
set -uo pipefail
MODEL="${1:-unknown}"
ITERATIONS="${2:-4}"
REVIEWS_DIR="reviews"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

echo "=== Review Watch Loop ==="
echo "Model: $MODEL"
echo "Iterations: $ITERATIONS"
echo "Start: $(date -u +%Y%m%dT%H%M%S)"
echo ""

for i in $(seq 1 "$ITERATIONS"); do
    echo "--- Iteration $i/$ITERATIONS ---"
    echo "Sleeping 3600s... ($(date))"
    sleep 3600

    DATETIME=$(date -u +%Y%m%dT%H%M%S)
    GIT_SHA=$(git rev-parse --short HEAD)
    NEW_FILES=$(find "$REVIEWS_DIR" -name "review-*.md" -newer "$(ls -t "$REVIEWS_DIR"/crosscheck-*.md 2>/dev/null | head -1)" 2>/dev/null | head -10)

    if [ -n "$NEW_FILES" ]; then
        echo "New review files found:"
        echo "$NEW_FILES"
        echo ""
        echo "Running watch report: reviews/watch-round${i}-${MODEL}-${DATETIME}.md"
        {
            echo "# Watch Round $i"
            echo ""
            echo "**Time**: $DATETIME"
            echo "**Model**: $MODEL"
            echo "**Git SHA**: $GIT_SHA"
            echo ""
            echo "## New Files Since Last Cross-Check"
            echo '```'
            echo "$NEW_FILES"
            echo '```'
            echo ""
            echo "## File Sizes"
            while IFS= read -r f; do
                size=$(wc -c < "$f")
                echo "- $f: ${size} bytes"
            done <<< "$NEW_FILES"
        } > "$REVIEWS_DIR/watch-round${i}-${MODEL}-${DATETIME}.md"

        git add "$REVIEWS_DIR/"
        git commit -m "review: $MODEL — watch round ${i}" --no-gpg-sign 2>/dev/null || true
    else
        echo "No new review files. Writing empty watch report."
        {
            echo "# Watch Round $i"
            echo ""
            echo "**Time**: $DATETIME"
            echo "**Model**: $MODEL"
            echo "**Status**: No new review files found since last cross-check."
        } > "$REVIEWS_DIR/watch-round${i}-${MODEL}-${DATETIME}-nochange.md"
    fi
done

echo ""
echo "=== Watch Loop Complete ==="
echo "End: $(date -u +%Y%m%dT%H%M%S)"
