## Build & Check

```bash
npm run build   # tsc + vite build
```

## Review Pipeline

```bash
# Run the full review pipeline with 8 parallel agents and 4 hours of watch loop
scripts/review.sh
```

## Deploy

Push to `main` → GitHub Actions deploys to GH Pages.

## Conventions

- Dark-only, mobile-first, Finnish youth football data
- Electric yellow accent (#faff69), surface ladder (canvas → surface-1/2/3), no shadows
- All cards: rounded-xl, bg-surface-1, border border-border-hairline
- Interactive elements: focus-visible:ring-2 ring-accent/50
- Touch targets: min 44px
- Player stats: DualStatBar for team comparison
- API batching: batchFetch with concurrency=5
- API timeout: AbortController at 10s
- Team crests: teamA.img_url / teamB.img_url (TeamBasic type)
