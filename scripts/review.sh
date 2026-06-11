#!/bin/bash
set -euo pipefail

REVIEW_DIR="reviews"

get_timestamp() {
    date -u +"%Y%m%dT%H%M%S"
}

get_git_sha() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

run_build() {
    echo "Running npm run build..."
    npm run build || exit 1
}

spawn_review_agent() {
    local agent_id="$1"
    local agent_type="$2"
    local agent_focus="$3"
    local timestamp="$4"
    local git_sha="$5"
    local output_file="$REVIEW_DIR/review-${agent_type}-${agent_id}-${timestamp}-${git_sha}.md"
    
    local prompt="You are a $agent_type reviewer focusing on: $agent_focus.
Write findings to: $output_file

Format each finding as:
## {severity}: {title}
- **File**: \`src/...\` :line
- **Issue**: ...
- **Suggestion**: ...

Review scope:
$(get_review_instructions "$agent_type")

Only return the file path when complete."
    
    opencode run "$prompt" > "$output_file" 2>&1 || true
    echo "$output_file"
}

get_review_instructions() {
    local t="$1"
    case "$t" in
        code) echo "1. TS strictness, 2. Component props, 3. Type exports, 4. Unused imports" ;;
        ux) echo "1. Design tokens (#faff69), 2. Hardcoded colors, 3. Mobile touch targets (44px), 4. Focus rings" ;;
        api) echo "1. Response shapes, 2. Null fields, 3. Error recovery/timeout/backoff" ;;
        data-flow) echo "1. getPlayerData → processPlayerMatchHistory → render, 2. Any types, 3. State lifecycle" ;;
        *) echo "Review code based on $t focus." ;;
    esac
}

spawn_cross_check() {
    local timestamp
    timestamp=$(get_timestamp)
    local output_file="$REVIEW_DIR/crosscheck-$timestamp.md"
    
    opencode run "Analyze all review findings in $REVIEW_DIR/review-*.md.
Write findings to: $output_file

Identify agreements/disagreements and group similar issues.
Format:
## {severity}: {title}
- **File**: \`src/...\` :line
- **Issue**: ...
- **Suggestion**: ...

Summary: Total findings, agreements/disagreements count.
Only return the file path." > "$output_file" 2>&1 || true
    echo "$output_file"
}

spawn_watch_agent() {
    local round="$1"
    local timestamp
    timestamp=$(get_timestamp)
    local output_file="$REVIEW_DIR/watch-$timestamp-round$round.md"
    
    opencode run "Check $REVIEW_DIR for new review-*.md files not present in previous crosschecks.
Write findings to: $output_file
If new issues are found, analyze them and compare with existing ones.
Only return the file path." > "$output_file" 2>&1 || true
    echo "$output_file"
}

main() {
    echo "=== Football Stats Review Pipeline ==="
    mkdir -p "$REVIEW_DIR"
    run_build
    
    local timestamp
    timestamp=$(get_timestamp)
    local git_sha
    git_sha=$(get_git_sha)
    
    echo "Initial review: $timestamp, SHA: $git_sha"
    
    (spawn_review_agent 1 "code" "TS strictness" "$timestamp" "$git_sha") &
    (spawn_review_agent 2 "code" "Build/Tailwind" "$timestamp" "$git_sha") &
    (spawn_review_agent 3 "ux" "Design tokens" "$timestamp" "$git_sha") &
    (spawn_review_agent 4 "ux" "Mobile/Focus" "$timestamp" "$git_sha") &
    (spawn_review_agent 5 "api" "Response shapes" "$timestamp" "$git_sha") &
    (spawn_review_agent 6 "api" "Error recovery" "$timestamp" "$git_sha") &
    (spawn_review_agent 7 "data-flow" "Trace path" "$timestamp" "$git_sha") &
    (spawn_review_agent 8 "data-flow" "State lifecycle" "$timestamp" "$git_sha") &
    wait
    
    local crosscheck_file
    crosscheck_file=$(spawn_cross_check)
    
    git add "$REVIEW_DIR"
    git commit -m "review: round 1" 2>/dev/null || true
    
    echo "Entering 10-minute watch loop..."
    local round=1
    while [ $round -le 24 ]; do
        echo "--- Watch round $round (T+ $((round*10))m) ---"
        sleep 600
        
        local current_files
        current_files=$(ls -1 "$REVIEW_DIR"/review-*.md | wc -l)
        
        if [ "$current_files" -gt 8 ]; then
            echo "New files detected! Running cross-check..."
            spawn_watch_agent "$round"
            git add "$REVIEW_DIR"
            git commit -m "watch: round $round" 2>/dev/null || true
        else
            echo "No new findings."
        fi
        round=$((round+1))
    done
}

main "$@"