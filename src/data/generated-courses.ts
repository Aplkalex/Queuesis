import fs from 'node:fs';
import path from 'node:path';
import type { Course } from '@/types';

type SerializedCourse = Omit<Course, 'lastUpdated'> & {
  lastUpdated?: string;
};

const cacheByPath = new Map<string, Course[]>();

const DEFAULT_DATASET_PATH_BY_TERM: Partial<Record<string, string>> = {
  '2025-26-T2': path.join(process.cwd(), 'data', 'courses-2025-26-T2.json'),
  '2025-26-Summer': path.join(process.cwd(), 'data', 'courses-2025-26-Summer.json'),
};

const parseCourses = (raw: string): Course[] => {
  const parsed = JSON.parse(raw) as SerializedCourse[];
  return parsed.map((course) => ({
    ...course,
    lastUpdated: course.lastUpdated ? new Date(course.lastUpdated) : undefined,
  }));
};

const loadCoursesFromPath = (datasetPath: string): Course[] => {
  const cached = cacheByPath.get(datasetPath);
  if (cached) return cached;

  try {
    const data = fs.readFileSync(datasetPath, 'utf-8');
    const parsed = parseCourses(data);
    cacheByPath.set(datasetPath, parsed);
    return parsed;
  } catch (error) {
    console.warn(
      `[generated-courses] Failed to load ${datasetPath}. Using empty dataset.`,
      error
    );
    cacheByPath.set(datasetPath, []);
    return [];
  }
};

const getDatasetPathForTerm = (term?: string | null): string => {
  const legacyPath = process.env.GENERATED_COURSES_PATH;
  if (legacyPath) {
    return legacyPath;
  }

  if (!term) {
    return DEFAULT_DATASET_PATH_BY_TERM['2025-26-T2']!;
  }

  const envKey = `GENERATED_COURSES_PATH_${term.replace(/-/g, '_').toUpperCase()}`;
  const termSpecificFromEnv = process.env[envKey];
  if (termSpecificFromEnv) {
    return termSpecificFromEnv;
  }

  const defaultPath = DEFAULT_DATASET_PATH_BY_TERM[term];
  if (defaultPath) {
    return defaultPath;
  }

  return path.join(process.cwd(), 'data', `courses-${term}.json`);
};

export const loadGeneratedCourses = (term?: string | null): Course[] => {
  const datasetPath = getDatasetPathForTerm(term);
  return loadCoursesFromPath(datasetPath);
};

export const getGeneratedCoursesForTerm = (term?: string | null): Course[] => {
  return loadGeneratedCourses(term);
};

export const generatedCourses = loadGeneratedCourses();
