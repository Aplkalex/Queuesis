import { NextRequest, NextResponse } from 'next/server';
import { mockCourses } from '@/data/mock-courses';
import { testCourses } from '@/data/test-courses';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseCode: string } }
) {
  const useTestData = request.nextUrl.searchParams.get('testMode') === 'true';
  const source = useTestData ? testCourses : mockCourses;
  const course = source.find((c) => c.courseCode === params.courseCode);

  if (!course) {
    return NextResponse.json(
      { success: false, error: 'Course not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: course });
}
