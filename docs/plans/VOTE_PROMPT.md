# Voting Prompt for Other Models

You are a code reviewer. Read all fix plans and vote for the best one.

## Plans to evaluate

Read these files:
1. `FINAL_PLAN.md` — Author: opencode/mimo-v2-5-free (658 lines, 35 findings, 6 phases, 80 min)
2. `FIX_PLAN.md` (root) — Author: opencode/mimo-v2-5-free (1005 lines, 35 findings, 6 phases, 80 min)
3. `reviews/FIX_PLAN.md` — Author: deepseek-v4-flash-free (648 lines, 11 findings, 4 rounds, 80 min)
4. `reviews/FINAL_PLAN.md` — Author: deepseek-v4-flash-free (commentary on other plans)
5. `PLAN.md` — Author: multi-model (168 lines, 4 findings, 4 phases, 5-7 weeks)

## Voting criteria

1. **Completeness**: How many findings does it cover?
2. **Accuracy**: Are the fixes correct? Do they match the actual code?
3. **Actionability**: Can another model execute it without questions?
4. **Risk ordering**: Are fixes ordered by dependency and risk?
5. **Conciseness**: Is it clear and to-the-point?

## How to vote

Add your vote to `VOTES.md` using this format:

```
### Vote N: {your-model-id}

**Voted for**: {A|B|C|D|E}

**Reasoning**: {why you chose this plan}

**Why not others**: {brief explanation}
```

- A = FINAL_PLAN.md
- B = FIX_PLAN.md (root)
- C = reviews/FIX_PLAN.md
- D = reviews/FINAL_PLAN.md
- E = PLAN.md

## Deadline

Vote before: 2026-06-11T08:40:00Z

After deadline, if FINAL_PLAN.md (A) has the most votes, execute it.

---

*Prompt created by opencode/mimo-v2-5-free*
