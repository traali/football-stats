#!/bin/bash
set -euo pipefail

REVIEW_DIR="reviews"

get_model_info() {
    opencode models 2>/dev/null | head -20 || echo "unknown-model"
}

get_model_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' /' '-' | cut -c1-50
}

get_git_sha() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

get_timestamp() {
    date -u +"%Y%m%dT%H%M%S"
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
    local model_slug
    model_slug=$(get_model_slug)
    local output_file="$REVIEW_DIR/review-${agent_type}-${agent_id}-${model_slug}-${timestamp}.md"
    
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
        code) echo "1. TS strictness: TypeScript errors, strict mode, prop types
2. Component props: typed props, optional/required
3. Type exports: internal/private exports
4. Unused imports: defined but not used" ;;
        ux) echo "1. Design tokens: electric yellow (#faff69) usage
2. Hardcoded colors: not using design tokens
3. Mobile: touch targets (44px), safe-area, font scaling
4. Focus rings: focus-visible:ring-2, ring-accent/50" ;;
        api) echo "1. Response shapes: API responses match expected types
2. Null fields: missing required fields
3. Error handling: recovery, timeout, backoff" ;;
        data-flow) echo "1. Function traces: getPlayerData → processPlayerMatchHistory → render
2. Any types: using any instead of specific types
3. State lifecycle: loading → empty → error → data → revalidate" ;;
        *) echo "Review code based on $t focus." ;;
    esac
}

spawn_cross_check() {
    local timestamp
    timestamp=$(get_timestamp)
    local output_file="$REVIEW_DIR/crosscheck-$timestamp.md"
    
    opencode run "You are a cross-check reviewer. Analyze all review findings in $REVIEW_DIR/review-*.md.
Write findings to: $output_file

Actions:
1. Read all review files
2. Compare findings across reviewers
3. Identify agreements/disagreements
4. Group similar issues
5. Determine missed issues

Format:
## {severity}: {title}
- **File**: \`src/...\` :line
- **Issue**: ...
- **Suggestion**: ...

Summary:
- Total findings
- Agreements/disagreements count
- Unique vs duplicate findings

Only return the file path." > "$output_file" 2>&1 || true
    echo "$output_file"
}

main() {
    echo "=== Football Stats Review Pipeline ==="
    echo "Starting at $(date -u)"
    
    mkdir -p "$REVIEW_DIR"
    
    run_build
    
    local timestamp
    timestamp=$(get_timestamp)
    local git_sha
    git_sha=$(get_git_sha)
    
    echo "Timestamp: $timestamp, SHA: $git_sha"
    
    echo "Spawning 8 parallel review tasks..."
    
    (spawn_review_agent 1 "code" "TS strictness, component props, type exports, unused imports" "$timestamp" "$git_sha") &
    (spawn_review_agent 2 "code" "Build config, Tailwind usage, bundler warnings, dep versions" "$timestamp" "$git_sha") &
    (spawn_review_agent 3 "ux" "Design tokens used correctly? Hardcoded colors remaining?" "$timestamp" "$git_sha") &
    (spawn_review_agent 4 "ux" "Mobile: touch targets, safe-area, font scaling, focus rings" "$timestamp" "$git_sha") &
    (spawn_review_agent 5 "api" "Response shapes match real API? Missing/null fields?" "$timestamp" "$git_sha") &
    (spawn_review_agent 6 "api" "Error recovery, timeout propagation, rate limit backoff" "$timestamp" "$git_sha") &
    (spawn_review_agent 7 "data-flow" "Trace getPlayerData → processPlayerMatchHistory → render. Any any?" "$timestamp" "$git_sha") &
    (spawn_review_agent 8 "data-flow" "State lifecycle: loading → empty → error → data → revalidate" "$timestamp" "$git_sha") &
    
    wait
    
    echo "Spawning cross-check agent..."
    local crosscheck_file
    crosscheck_file=$(spawn_cross_check)
    
    echo "Committing review artifacts..."
    git add "$REVIEW_DIR"
    local findings
    findings=$(grep -rh "^## [A-Z]" "$REVIEW_DIR" 2>/dev/null | wc -l | tr -d ' ')
    git commit -m "review: round 1 — 8 agents, ${findings:-0} findings" 2>/dev/null || echo "No changes"
    
    echo "=== Review Summary ==="
    echo "Completed at $(date -u)"
    echo "Total files: $(ls -1 "$REVIEW_DIR"/*.md 2>/dev/null | wc -l)"
    echo "Cross-check: $crosscheck_file"
}

main "$@"