'use client';

import { Course, Section } from '@/types';
import { hasAvailableSeats } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface CourseListItemProps {
  course: Course;
  onAddSection: (course: Course, section: Section) => void;
}

function CourseListItem({ course, onAddSection }: CourseListItemProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      {/* Course header - More compact */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">
            {course.courseCode}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
            {course.courseName}
          </p>
        </div>
        <div className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold ml-2 whitespace-nowrap">
          {course.credits} {course.credits === 1 ? 'credit' : 'credits'}
        </div>
      </div>

      {/* Department */}
      <div className="text-[10px] text-gray-500 mb-2">
        {course.department}
      </div>

      {/* Sections - More compact */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
          Sections
        </div>
        {course.sections.map((section) => (
          <div
            key={section.sectionId}
            className={cn(
              'flex items-center justify-between p-2 rounded-md border transition-all',
              hasAvailableSeats(section)
                ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                : 'border-gray-100 bg-gray-50 opacity-60'
            )}
          >
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-semibold text-gray-900 text-xs">
                  {section.sectionType} {section.sectionId}
                </span>
                {section.instructor && (
                  <span className="text-[10px] text-gray-500 truncate">
                    • {section.instructor.name.split(' ')[0]}
                  </span>
                )}
              </div>
              
              <div className="text-[10px] text-gray-600 space-y-0">
                {section.timeSlots.slice(0, 2).map((slot, idx) => (
                  <div key={idx} className="truncate">
                    {slot.day.slice(0, 3)} {slot.startTime}-{slot.endTime}
                    {slot.location && ` @ ${slot.location}`}
                  </div>
                ))}
                {section.timeSlots.length > 2 && (
                  <div className="text-gray-400">+{section.timeSlots.length - 2} more</div>
                )}
              </div>

              <div className="mt-1 text-[10px]">
                {hasAvailableSeats(section) ? (
                  <span className="text-green-600 font-medium">
                    {section.seatsRemaining}/{section.quota} seats
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    Full ({section.enrolled}/{section.quota})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onAddSection(course, section)}
              disabled={!hasAvailableSeats(section)}
              className={cn(
                'flex-shrink-0 p-1.5 rounded-md transition-all',
                hasAvailableSeats(section)
                  ? 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-110'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
              title="Add to schedule"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CourseListProps {
  courses: Course[];
  onAddSection: (course: Course, section: Section) => void;
}

export function CourseList({ courses, onAddSection }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No courses found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <CourseListItem
          key={course.courseCode}
          course={course}
          onAddSection={onAddSection}
        />
      ))}
    </div>
  );
}
