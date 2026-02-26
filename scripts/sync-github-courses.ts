// ==============================================================================
// Feature: Auto-fetch CUHK Course Data (Phase 1)
// Data Source: https://github.com/EagleZhen/another-cuhk-course-planner/tree/main/data
// Note: Thanks to EagleZhen for providing the scraped JSON data.
// License: AGPL-3.0
// ==============================================================================

import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { Course, DayOfWeek, Section, TimeSlot } from '@/types';

interface CliOptions {
  repo: string;
  ref: string;
  dataPath: string;
  targetTerm: string;
  academicYear: string;
  seasonKeyword: string;
  output: string;
  dryRun: boolean;
  limit?: number;
}

interface GitHubContentItem {
  name: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

interface ExternalCourseDataFile {
  metadata?: {
    subject?: string;
    total_courses?: number;
  };
  courses?: ExternalCourse[];
}

interface ExternalCourse {
  subject?: string;
  course_code?: string;
  title?: string;
  credits?: string | number;
  description?: string;
  enrollment_requirement?: string;
  terms?: ExternalTerm[];
}

interface ExternalTerm {
  term_code?: string;
  term_name?: string;
  schedule?: ExternalSection[];
}

interface ExternalSection {
  section?: string;
  meetings?: ExternalMeeting[];
  availability?: {
    capacity?: string;
    enrolled?: string;
    available_seats?: string;
    waitlist_total?: string;
  };
  class_attributes?: string;
}

interface ExternalMeeting {
  time?: string;
  location?: string;
  instructor?: string;
}

interface SyncStats {
  filesFound: number;
  filesFetched: number;
  filesFailed: number;
  coursesMapped: number;
  upserted: number;
  skipped: number;
  markedInactive: number;
}

const SECTION_TYPE_MAP: Record<string, Section['sectionType']> = {
  LEC: 'Lecture',
  TUT: 'Tutorial',
  LAB: 'Lab',
  SEM: 'Seminar',
  DIS: 'Tutorial',
  PRA: 'Lab',
  PRJ: 'Seminar',
  FLD: 'Lab',
  IND: 'Seminar',
  ASB: 'Seminar',
  CLW: 'Lab',
  EXR: 'Tutorial',
  OTH: 'Seminar',
  STD: 'Seminar',
  TMC: 'Tutorial',
  VST: 'Seminar',
  WBL: 'Seminar',
  WKS: 'Lab',
};

const DAY_MAP: Record<string, DayOfWeek> = {
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

const EXCLUDED_SUBJECT_CODES = new Set([
  'EX_PGDE',
  'EX_RPG',
  'EX_TPG',
  'EX_UG',
  'XCBS',
  'XCCS',
  'XFUD',
  'XUNC',
  'XUSC',
  'XWAS',
]);

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    repo: 'EagleZhen/another-cuhk-course-planner',
    ref: 'main',
    dataPath: 'data',
    targetTerm: '2025-26-Summer',
    academicYear: '2025-26',
    seasonKeyword: 'Summer',
    output: path.resolve(process.cwd(), 'data/courses-2025-26-Summer.json'),
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const value = argv[index + 1];

    switch (key) {
      case 'repo':
        if (value) {
          options.repo = value;
          index++;
        }
        break;
      case 'ref':
        if (value) {
          options.ref = value;
          index++;
        }
        break;
      case 'dataPath':
        if (value) {
          options.dataPath = value;
          index++;
        }
        break;
      case 'term':
        if (value) {
          options.targetTerm = value;
          index++;
        }
        break;
      case 'academicYear':
        if (value) {
          options.academicYear = value;
          index++;
        }
        break;
      case 'season':
        if (value) {
          options.seasonKeyword = value;
          index++;
        }
        break;
      case 'output':
        if (value) {
          options.output = path.resolve(process.cwd(), value);
          index++;
        }
        break;
      case 'limit':
        if (value) {
          const parsed = Number(value);
          if (Number.isFinite(parsed) && parsed > 0) {
            options.limit = parsed;
          }
          index++;
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      default:
        break;
    }
  }

  if (!options.output.includes(path.sep)) {
    options.output = path.resolve(process.cwd(), options.output);
  }

  return options;
};

const parseNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const cleanText = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.replace(/\u00a0/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const to24Hour = (value: string): string => {
  const match = value.match(/^(\d{1,2}):(\d{2})([AP]M)$/i);
  if (!match) return value;

  let hour = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

const parseTimeSlot = (time: string | undefined, location: string | undefined): TimeSlot | null => {
  if (!time) return null;
  const normalized = time.replace(/\u00a0/g, ' ').trim();
  const match = normalized.match(/^([A-Za-z]{2})\s+(\d{1,2}:\d{2}[AP]M)\s*-\s*(\d{1,2}:\d{2}[AP]M)$/i);
  if (!match) return null;

  const day = DAY_MAP[match[1] as keyof typeof DAY_MAP];
  if (!day) return null;

  const parsedLocation = cleanText(location);

  return {
    day,
    startTime: to24Hour(match[2].toUpperCase()),
    endTime: to24Hour(match[3].toUpperCase()),
    location:
      parsedLocation && parsedLocation.toUpperCase() !== 'TBA' && parsedLocation.toUpperCase() !== 'NO ROOM REQUIRED'
        ? parsedLocation
        : undefined,
  };
};

const parseSectionMeta = (rawSection: string | undefined): {
  sectionId: string;
  sectionType: Section['sectionType'];
  classNumber?: number;
} => {
  const normalized = cleanText(rawSection) ?? '';

  const match = normalized.match(/^([A-Z0-9-]*)-([A-Z]{3,4})\s*(?:\((\d+)\))?$/i);

  const rawId = match?.[1] ?? '';
  const rawType = (match?.[2] ?? 'LEC').toUpperCase();
  const classNumber = match?.[3] ? Number(match[3]) : undefined;

  const cleanedId = rawId.replace(/^-+/, '').replace(/-+$/, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  return {
    sectionId: cleanedId || 'A',
    sectionType: SECTION_TYPE_MAP[rawType] ?? 'Seminar',
    classNumber,
  };
};

const isTargetTerm = (termName: string | undefined, academicYear: string, seasonKeyword: string): boolean => {
  if (!termName) return false;
  const normalized = termName.toLowerCase();
  return normalized.includes(academicYear.toLowerCase()) && normalized.includes(seasonKeyword.toLowerCase());
};

const mapExternalCourse = (
  externalCourse: ExternalCourse,
  externalTerm: ExternalTerm,
  mappedTerm: string,
  fallbackSubject: string
): Course | null => {
  const subject = cleanText(externalCourse.subject) ?? fallbackSubject;
  const courseCodePart = cleanText(externalCourse.course_code);
  const title = cleanText(externalCourse.title);

  if (!subject || !courseCodePart || !title) {
    return null;
  }

  const fullCode = `${subject}${courseCodePart}`.replace(/\s+/g, '').toUpperCase();

  const sectionsRaw = externalTerm.schedule ?? [];
  const sections: Section[] = sectionsRaw.map((sectionRaw) => {
    const sectionMeta = parseSectionMeta(sectionRaw.section);

    const meetings = sectionRaw.meetings ?? [];
    const slotSet = new Set<string>();
    const timeSlots: TimeSlot[] = [];

    for (const meeting of meetings) {
      const slot = parseTimeSlot(meeting.time, meeting.location);
      if (!slot) continue;
      const key = `${slot.day}|${slot.startTime}|${slot.endTime}|${slot.location ?? ''}`;
      if (slotSet.has(key)) continue;
      slotSet.add(key);
      timeSlots.push(slot);
    }

    const instructorNames = meetings
      .map((meeting) => cleanText(meeting.instructor))
      .filter((name): name is string => Boolean(name && name.toUpperCase() !== 'TBA'));
    const uniqueInstructor = Array.from(new Set(instructorNames)).join(', ');

    const availability = sectionRaw.availability;
    const quota = parseNumber(availability?.capacity);
    const enrolled = parseNumber(availability?.enrolled);
    const seatsRemaining = parseNumber(availability?.available_seats);
    const waitlist = parseNumber(availability?.waitlist_total);

    return {
      sectionId: sectionMeta.sectionId,
      sectionType: sectionMeta.sectionType,
      instructor: uniqueInstructor ? { name: uniqueInstructor } : undefined,
      timeSlots,
      quota,
      enrolled,
      seatsRemaining,
      waitlist: waitlist > 0 ? waitlist : undefined,
      language: cleanText(sectionRaw.class_attributes),
      classNumber: sectionMeta.classNumber,
    };
  });

  const filteredSections = sections.filter(
    (section, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.sectionId === section.sectionId &&
          candidate.sectionType === section.sectionType &&
          candidate.classNumber === section.classNumber
      ) === index
  );

  return {
    courseCode: fullCode,
    courseName: title,
    department: subject,
    credits: Math.max(0, Math.round(parseNumber(externalCourse.credits) || 0)),
    description: cleanText(externalCourse.description),
    enrollmentRequirements: cleanText(externalCourse.enrollment_requirement),
    prerequisites: [],
    sections: filteredSections,
    term: mappedTerm as Course['term'],
    career: 'Undergraduate',
    dataSource: 'github',
    isActive: true,
    lastUpdated: new Date(),
  };
};

const fetchJson = async <T>(url: string, token?: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'queuesis-sync-script',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}) ${url}\n${body.slice(0, 200)}`);
  }

  return response.json() as Promise<T>;
};

const sendDiscordNotification = async (message: string) => {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch (error) {
    console.warn('⚠️ Failed to send Discord notification:', error);
  }
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const githubToken = process.env.GITHUB_TOKEN;
  const prisma = new PrismaClient();

  const stats: SyncStats = {
    filesFound: 0,
    filesFetched: 0,
    filesFailed: 0,
    coursesMapped: 0,
    upserted: 0,
    skipped: 0,
    markedInactive: 0,
  };

  const [owner, repoName] = options.repo.split('/');
  if (!owner || !repoName) {
    throw new Error(`Invalid repo format: ${options.repo}. Expected owner/repo.`);
  }

  const listUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${options.dataPath}?ref=${options.ref}`;
  console.log(`🔎 Listing upstream data files from ${listUrl}`);

  const contentItems = await fetchJson<GitHubContentItem[]>(listUrl, githubToken);
  const rawSubjectFiles = contentItems
    .filter((item) => item.type === 'file' && item.name.endsWith('.json') && item.download_url)
    .filter((item) => !EXCLUDED_SUBJECT_CODES.has(item.name.replace(/\.json$/, '').toUpperCase()));

  const subjectFiles =
    typeof options.limit === 'number' ? rawSubjectFiles.slice(0, options.limit) : rawSubjectFiles;

  stats.filesFound = subjectFiles.length;

  console.log(`📦 Found ${stats.filesFound} eligible subject files`);

  const mappedCoursesByCode = new Map<string, Course>();

  for (const file of subjectFiles) {
    const subjectCode = file.name.replace(/\.json$/, '').toUpperCase();

    try {
      const payload = await fetchJson<ExternalCourseDataFile>(file.download_url as string, githubToken);
      stats.filesFetched += 1;

      const externalCourses = payload.courses ?? [];

      for (const externalCourse of externalCourses) {
        const matchedTerm = (externalCourse.terms ?? []).find((term) =>
          isTargetTerm(term.term_name, options.academicYear, options.seasonKeyword)
        );

        if (!matchedTerm) continue;

        const mapped = mapExternalCourse(externalCourse, matchedTerm, options.targetTerm, subjectCode);
        if (!mapped) continue;

        const existing = mappedCoursesByCode.get(mapped.courseCode);
        if (!existing) {
          mappedCoursesByCode.set(mapped.courseCode, mapped);
          continue;
        }

        const mergedSections = [...existing.sections];
        for (const section of mapped.sections) {
          const duplicate = mergedSections.some(
            (current) =>
              current.sectionId === section.sectionId &&
              current.sectionType === section.sectionType &&
              current.classNumber === section.classNumber
          );
          if (!duplicate) mergedSections.push(section);
        }

        mappedCoursesByCode.set(mapped.courseCode, {
          ...existing,
          sections: mergedSections,
          enrollmentRequirements: existing.enrollmentRequirements ?? mapped.enrollmentRequirements,
          description: existing.description ?? mapped.description,
          credits: existing.credits || mapped.credits,
        });
      }
    } catch (error) {
      stats.filesFailed += 1;
      console.warn(`⚠️ Failed to process ${file.name}:`, error);
    }
  }

  const mappedCourses = Array.from(mappedCoursesByCode.values()).sort((left, right) =>
    left.courseCode.localeCompare(right.courseCode)
  );

  stats.coursesMapped = mappedCourses.length;
  console.log(`🧭 Mapped ${stats.coursesMapped} courses for ${options.targetTerm}`);

  const outputDir = path.dirname(options.output);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(options.output, JSON.stringify(mappedCourses, null, 2), 'utf-8');
  console.log(`💾 Snapshot written to ${options.output}`);

  if (options.dryRun) {
    console.log('🧪 Dry run enabled: database upsert skipped.');
    await sendDiscordNotification(
      `✅ [Dry Run] Queuesis Summer sync mapped ${stats.coursesMapped} courses from ${stats.filesFetched} files.`
    );
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for non-dry-run sync.');
  }

  const fetchedKeys = new Set(mappedCourses.map((course) => `${course.courseCode}::${course.term}`));
  const now = new Date();
  const courseDelegate = prisma.course as any;

  for (const mappedCourse of mappedCourses) {
    const existing = await courseDelegate.findUnique({
      where: {
        courseCode_term: {
          courseCode: mappedCourse.courseCode,
          term: mappedCourse.term,
        },
      },
    });

    if (existing && existing.dataSource !== 'github') {
      stats.skipped += 1;
      continue;
    }

    await courseDelegate.upsert({
      where: {
        courseCode_term: {
          courseCode: mappedCourse.courseCode,
          term: mappedCourse.term,
        },
      },
      update: {
        courseName: mappedCourse.courseName,
        department: mappedCourse.department,
        credits: mappedCourse.credits,
        description: mappedCourse.description,
        enrollmentRequirements: mappedCourse.enrollmentRequirements,
        prerequisites: mappedCourse.prerequisites ?? [],
        sections: mappedCourse.sections,
        term: mappedCourse.term,
        career: mappedCourse.career,
        dataSource: 'github',
        isActive: true,
        lastUpdated: now,
      },
      create: {
        courseCode: mappedCourse.courseCode,
        courseName: mappedCourse.courseName,
        department: mappedCourse.department,
        credits: mappedCourse.credits,
        description: mappedCourse.description,
        enrollmentRequirements: mappedCourse.enrollmentRequirements,
        prerequisites: mappedCourse.prerequisites ?? [],
        sections: mappedCourse.sections,
        term: mappedCourse.term,
        career: mappedCourse.career,
        dataSource: 'github',
        isActive: true,
        lastUpdated: now,
      },
    });

    stats.upserted += 1;
  }

  const githubSummerCourses = await courseDelegate.findMany({
    where: {
      term: options.targetTerm,
      dataSource: 'github',
      OR: [{ isActive: true }, { isActive: null }, { isActive: { isSet: false } }],
    },
    select: {
      courseCode: true,
      term: true,
    },
  });

  for (const existing of githubSummerCourses) {
    if (fetchedKeys.has(`${existing.courseCode}::${existing.term}`)) continue;

    await courseDelegate.update({
      where: {
        courseCode_term: {
          courseCode: existing.courseCode,
          term: existing.term,
        },
      },
      data: {
        isActive: false,
        lastUpdated: now,
      },
    });

    stats.markedInactive += 1;
  }

  console.log('Sync finished');
  console.table(stats);

  await sendDiscordNotification(
    `Queuesis Summer sync done: mapped=${stats.coursesMapped}, upserted=${stats.upserted}, inactive=${stats.markedInactive}, skipped=${stats.skipped}, failedFiles=${stats.filesFailed}`
  );

  await prisma.$disconnect();
};

main().catch(async (error) => {
  console.error('Sync failed:', error);
  await sendDiscordNotification(`Queuesis Summer sync failed: ${String(error)}`);
  process.exit(1);
});
