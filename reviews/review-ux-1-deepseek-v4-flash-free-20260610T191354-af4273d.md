## WARNING: DESIGN.md radius token spec conflicts with component spec
- **File**: `DESIGN.md` :§6.2 vs §12
- **Issue**: Section 6.2 (Card) states `rounded-xl (12px) — standard`, but Section 12 token spec defines `--radius-lg: 12px` and `--radius-xl: 16px`. The two sections assign different token names to 12px. Code correctly follows §12, but the Card spec in §6.2 is inconsistent.
- **Suggestion**: Update §6.2 Card radius to `rounded-lg (12px) — standard, rounded-xl (16px) — hero cards` to match §12.

## INFO: Missing `--space-*` design tokens
- **File**: `src/index.css` :3-47
- **Issue**: DESIGN.md §5.1 & §12 define `--space-1` through `--space-9` (4px–96px, 8px grid), but none are declared in `index.css`. Tailwind's built-in spacing utilities cover the values, but the custom properties per spec are absent.
- **Suggestion**: Add `--space-1` through `--space-9` to the `@theme` block for spec compliance and future direct `var()` usage.

## INFO: Input focus ring width mismatch (1px vs spec 2px)
- **File**: `src/pages/MatchPage.tsx` :51 / `src/pages/Home.tsx` :41
- **Issue**: Search input container uses `focus-within:ring-1` (1px). DESIGN.md §6.3 (Input) and §10.2 specify `2px solid hero-accent` focus ring.
- **Suggestion**: Change to `focus-within:ring-2` to match the spec.

## INFO: Skeleton stat badge radius does not match actual StatBadge component
- **File**: `src/components/Skeleton.tsx` :37
- **Issue**: `PlayerCardSkeleton` renders stat badge placeholders with `rounded-xl` (16px), but `StatBadge.tsx:29` uses `rounded-md` (8px). Skeleton shape differs from the component it represents.
- **Suggestion**: Replace `rounded-xl` with `rounded-md` on skeleton stat badge containers.
