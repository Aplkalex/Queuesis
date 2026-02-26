# Term Rotation & JSON Archive

This workflow keeps MongoDB lean while preserving historical records in JSON files.

## Goal

- Keep only active academic terms in MongoDB (default: `2025-26-T1`, `2025-26-T2`, `2025-26-Summer`)
- Archive older terms to local JSON files under `data/archive/`
- Optionally purge archived terms from MongoDB after export

## Commands

Dry-run (safe preview, no file write, no delete):

```bash
npm run rotate:terms:dry
```

Archive + purge old terms from MongoDB:

```bash
npm run rotate:terms
```

One-click by academic year (auto keeps `T1/T2/Summer`):

```bash
npm run rotate:year:dry -- --academicYear 2026-27
npm run rotate:year -- --academicYear 2026-27
```

## Advanced usage

Custom keep terms:

```bash
npx ts-node -P tsconfig.seed.json scripts/rotate-terms.ts \
  --keepTerms 2026-27-T1,2026-27-T2,2026-27-Summer \
  --archiveDir data/archive \
  --purge
```

Academic year input directly in script:

```bash
npx ts-node -P tsconfig.seed.json scripts/rotate-terms.ts \
  --academicYear 2026-27 \
  --archiveDir data/archive \
  --purge
```

Force overwrite archive file names (`<term>.json`):

```bash
npx ts-node -P tsconfig.seed.json scripts/rotate-terms.ts \
  --keepTerms 2026-27-T1,2026-27-T2,2026-27-Summer \
  --archiveDir data/archive \
  --purge \
  --force
```

Without `--force`, if an archive file already exists, the script writes a timestamped file instead of replacing it.

## Notes

- `MONGODB_URI` is required.
- `--academicYear YYYY-YY` auto-generates keep terms: `YYYY-YY-T1`, `YYYY-YY-T2`, `YYYY-YY-Summer`.
- If both `--keepTerms` and `--academicYear` are passed, `--keepTerms` takes priority.
- Archive payload includes metadata: `exportedAt`, `term`, `count`, and full `courses` records.
- Keep terms are never deleted by this script.
