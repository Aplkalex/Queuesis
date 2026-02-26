import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

interface CliOptions {
  keepTerms: string[];
  academicYear?: string;
  archiveDir: string;
  dryRun: boolean;
  purge: boolean;
  force: boolean;
}

interface ArchivePayload {
  exportedAt: string;
  term: string;
  count: number;
  courses: unknown[];
}

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    keepTerms: ['2025-26-T1', '2025-26-T2', '2025-26-Summer'],
    academicYear: undefined,
    archiveDir: path.resolve(process.cwd(), 'data/archive'),
    dryRun: false,
    purge: false,
    force: false,
  };

  let keepTermsProvided = false;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const value = argv[index + 1];

    switch (key) {
      case 'keepTerms':
        if (value) {
          keepTermsProvided = true;
          options.keepTerms = value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
          index++;
        }
        break;
      case 'academicYear':
        if (value) {
          options.academicYear = value.trim();
          index++;
        }
        break;
      case 'archiveDir':
        if (value) {
          options.archiveDir = path.resolve(process.cwd(), value);
          index++;
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'purge':
        options.purge = true;
        break;
      case 'force':
        options.force = true;
        break;
      default:
        break;
    }
  }

  if (options.academicYear && !keepTermsProvided) {
    if (!/^\d{4}-\d{2}$/.test(options.academicYear)) {
      throw new Error('academicYear must use format YYYY-YY (e.g. 2026-27).');
    }
    options.keepTerms = [
      `${options.academicYear}-T1`,
      `${options.academicYear}-T2`,
      `${options.academicYear}-Summer`,
    ];
  }

  if (options.keepTerms.length === 0) {
    throw new Error('keepTerms cannot be empty.');
  }

  return options;
};

const resolveArchiveFilePath = async (dir: string, term: string, force: boolean): Promise<string> => {
  const baseName = `${term}.json`;
  const directPath = path.join(dir, baseName);

  if (force) {
    return directPath;
  }

  try {
    await fs.access(directPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(dir, `${term}.${timestamp}.json`);
  } catch {
    return directPath;
  }
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required.');
  }

  console.log('🧭 Term rotation config');
  console.log(JSON.stringify({
    keepTerms: options.keepTerms,
    academicYear: options.academicYear ?? null,
    archiveDir: options.archiveDir,
    dryRun: options.dryRun,
    purge: options.purge,
    force: options.force,
  }, null, 2));

  const coursesToArchive = await prisma.course.findMany({
    where: {
      term: {
        notIn: options.keepTerms,
      },
    },
    orderBy: [{ term: 'asc' }, { courseCode: 'asc' }],
  });

  if (coursesToArchive.length === 0) {
    console.log('✅ No old-term records found. Nothing to archive.');
    await prisma.$disconnect();
    return;
  }

  const grouped = new Map<string, unknown[]>();
  for (const course of coursesToArchive) {
    const records = grouped.get(course.term) ?? [];
    records.push(course);
    grouped.set(course.term, records);
  }

  console.log(`📦 Found ${coursesToArchive.length} records across ${grouped.size} old terms.`);

  if (options.dryRun) {
    for (const [term, records] of grouped.entries()) {
      console.log(`- ${term}: ${records.length} records`);
    }
    console.log('🧪 Dry run enabled: no archive files written, no DB deletion performed.');
    await prisma.$disconnect();
    return;
  }

  await fs.mkdir(options.archiveDir, { recursive: true });

  for (const [term, records] of grouped.entries()) {
    const targetPath = await resolveArchiveFilePath(options.archiveDir, term, options.force);
    const payload: ArchivePayload = {
      exportedAt: new Date().toISOString(),
      term,
      count: records.length,
      courses: records,
    };
    await fs.writeFile(targetPath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`💾 Archived ${records.length} records -> ${targetPath}`);
  }

  if (options.purge) {
    const termsToPurge = Array.from(grouped.keys());
    const result = await prisma.course.deleteMany({
      where: {
        term: {
          in: termsToPurge,
        },
      },
    });
    console.log(`🧹 Purged ${result.count} records from MongoDB.`);
  } else {
    console.log('ℹ️ Purge not requested: MongoDB records are kept.');
  }

  await prisma.$disconnect();
};

main().catch((error) => {
  console.error('Term rotation failed:', error);
  process.exit(1);
});
