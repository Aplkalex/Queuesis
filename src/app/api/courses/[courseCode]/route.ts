import { NextRequest, NextResponse } from 'next/server';
import type { Prisma, Course as PrismaCourse } from '@prisma/client';
import { prisma } from '@/lib/db';
import { mockCourses } from '@/data/mock-courses';
import { generatedCourses } from '@/data/generated-courses';
import { testCourses } from '@/data/test-courses';
import type { Course as SchedulerCourse } from '@/types';

const hasDatabase = Boolean(process.env.MONGODB_URI);
const allowFallback = process.env.ALLOW_FALLBACK_DATA !== 'false';

const normalizeCourse = (course: PrismaCourse): SchedulerCourse => ({
  _id: course.id,
  courseCode: course.courseCode,
  courseName: course.courseName,
  department: course.department,
  credits: course.credits,
  description: course.description ?? undefined,
  enrollmentRequirements: course.enrollmentRequirements ?? undefined,
  prerequisites: course.prerequisites ?? [],
  sections: course.sections as SchedulerCourse['sections'],
  term: course.term as SchedulerCourse['term'],
  career: course.career as SchedulerCourse['career'],
  isActive: (course as PrismaCourse & { isActive?: boolean | null }).isActive ?? true,
  dataSource: (course as PrismaCourse & { dataSource?: string | null }).dataSource ?? undefined,
  lastUpdated: course.lastUpdated ?? undefined,
});

// Next.js 16 typed routes may pass params as a Promise in the context.
// Support both shapes to satisfy the RouteHandlerConfig type.
export async function GET(
  request: NextRequest,
  context: { params: { courseCode: string } } | { params: Promise<{ courseCode: string }> }
) {
  // Normalize params regardless of whether it's a Promise
  const resolved = 'then' in context.params
    ? await (context.params as Promise<{ courseCode: string }>)
    : (context.params as { courseCode: string });
  const { courseCode } = resolved;
  const useTestData = request.nextUrl.searchParams.get('testMode') === 'true';

  if (useTestData) {
    const testCourse = testCourses.find((c) => c.courseCode === courseCode);
    if (testCourse) {
      return NextResponse.json({ success: true, data: testCourse });
    }
  } else if (hasDatabase) {
    try {
      const dbCourse = await prisma.course.findFirst({
        where: {
          courseCode,
          OR: [{ isActive: true }, { isActive: null }],
        } as any,
      });

      if (dbCourse) {
        return NextResponse.json({ success: true, data: normalizeCourse(dbCourse) });
      }
    } catch (error) {
      console.error('[course detail] Failed to load course from MongoDB:', error);
    }
  }

  if (allowFallback) {
    const source =
      generatedCourses.length > 0 ? generatedCourses : mockCourses;
    const fallbackCourse = source.find((c) => c.courseCode === courseCode);

    if (fallbackCourse) {
      return NextResponse.json({ success: true, data: fallbackCourse });
    }
  }

  return NextResponse.json(
    { success: false, error: 'Course not found' },
    { status: 404 }
  );
}
