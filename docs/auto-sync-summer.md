# Auto Sync (Phase 1): CUHK Courses

This phase syncs course data from EagleZhen's public JSON files (GitHub raw content), maps them into Queuesis format, and upserts into MongoDB.

## What this phase does

- Fetches upstream files from `EagleZhen/another-cuhk-course-planner`
- Filters to the configured term only
- Maps external schema (`course_code`, `title`, `terms.schedule`, etc.) to Queuesis `Course[]`
- Saves a local snapshot to `data/courses-2025-26-Summer.json`
- Upserts records into MongoDB
- Soft-deletes missing upstream courses by setting `isActive=false` (only for `dataSource='github'`)

## Commands

```bash
npm run sync:cuhk:summer
npm run sync:cuhk:2026-t1
```

## Dry run (no DB writes)

```bash
npx ts-node -P tsconfig.seed.json scripts/sync-github-courses.ts --dry-run
```

## Optional arguments

```bash
npx ts-node -P tsconfig.seed.json scripts/sync-github-courses.ts \
  --repo EagleZhen/another-cuhk-course-planner \
  --ref main \
  --dataPath data \
  --term 2025-26-Summer \
  --academicYear 2025-26 \
  --season Summer \
  --output data/courses-2025-26-Summer.json
```

For 2026-27 Term 1, the upstream repository groups subject files under the academic-year directory:

```bash
npm run sync:cuhk:2026-t1
```

This uses `data/2026-27`, filters `2026-27 Term 1`, writes `data/courses-2026-27-T1.json`, and creates or updates the matching database term.

## Required env vars

- `MONGODB_URI` (required for non-dry-run)

## Optional env vars

- `GITHUB_TOKEN` (helps avoid GitHub API rate limits)
- `DISCORD_WEBHOOK_URL` (alerts on success/failure)

## GitHub Actions schedule

Workflow file: `.github/workflows/sync-cuhk-summer.yml`

- Runs daily at `19:00 UTC` (= `03:00 HKT` next day)
- Also supports manual trigger (`workflow_dispatch`)

Required repository secrets:

- `MONGODB_URI`
- `GITHUB_TOKEN` (optional but recommended)
- `DISCORD_WEBHOOK_URL` (optional)

## Term separation behavior

Schema now uses composite uniqueness on `courseCode + term`, so the same course code can coexist across multiple terms (e.g. `2025-26-T2` and `2025-26-Summer`) without overwriting each other.

The sync job upserts only the configured target term and marks inactive only within that same term for `dataSource='github'` records.
