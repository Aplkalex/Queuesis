import { NextRequest, NextResponse } from 'next/server';
import { mockCourses } from '@/data/mock-courses';
import { testCourses } from '@/data/test-courses';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const term = params.get('term');
  const search = params.get('search')?.toLowerCase();
  const department = params.get('department');
  const useTestData = params.get('testMode') === 'true';

  const source = useTestData ? testCourses : mockCourses;

  const filtered = source.filter((course) => {
    if (term && course.term !== term) return false;
    if (department && course.department !== department) return false;
    if (!search) return true;

    return (
      course.courseCode.toLowerCase().includes(search) ||
      course.courseName.toLowerCase().includes(search) ||
      course.sections.some((section) =>
        section.instructor?.name.toLowerCase().includes(search)
      )
    );
  });

  return NextResponse.json({ success: true, count: filtered.length, data: filtered });
}
