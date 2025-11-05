'use client';

import { Course, Section } from '@/types';
import { hasAvailableSeats } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { X, RefreshCw, AlertCircle } from 'lucide-react';

interface SectionSwapModalProps {
  course: Course;
  currentSection: Section;
  onSwap: (newSectionId: string) => void;
  onClose: () => void;
}

export function SectionSwapModal({ course, currentSection, onSwap, onClose }: SectionSwapModalProps) {
  // Get all lecture sections for this course
  const lectureSections = course.sections.filter(s => s.sectionType === 'Lecture');
  
  // Get tutorials for each lecture to show availability
  const getTutorialsForLecture = (lectureId: string) => {
    return course.sections.filter(s => s.sectionType === 'Tutorial' && s.parentLecture === lectureId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Change Section
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {course.courseCode} - {course.courseName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section List */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-3">
            {lectureSections.map((section) => {
              const isCurrent = section.sectionId === currentSection.sectionId;
              const tutorials = getTutorialsForLecture(section.sectionId);
              const isFull = !hasAvailableSeats(section);

              return (
                <button
                  key={section.sectionId}
                  onClick={() => {
                    if (!isCurrent && !isFull) {
                      onSwap(section.sectionId);
                      onClose();
                    }
                  }}
                  disabled={isCurrent || isFull}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    isCurrent && 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 cursor-default',
                    !isCurrent && !isFull && 'border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:shadow-lg cursor-pointer',
                    isFull && !isCurrent && 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Section Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          Lecture {section.sectionId}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">
                            Current
                          </span>
                        )}
                        {isFull && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Full
                          </span>
                        )}
                      </div>

                      {/* Instructor */}
                      {section.instructor && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          👨‍🏫 {section.instructor.name}
                        </div>
                      )}

                      {/* Time Slots */}
                      <div className="space-y-1 mb-2">
                        {section.timeSlots.map((slot, idx) => (
                          <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                            📅 {slot.day} {slot.startTime}-{slot.endTime} @ {slot.location}
                          </div>
                        ))}
                      </div>

                      {/* Tutorials Available */}
                      {tutorials.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 inline-block">
                          {tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} available
                        </div>
                      )}

                      {/* Seats */}
                      <div className="mt-2 text-sm">
                        {hasAvailableSeats(section) ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ {section.seatsRemaining}/{section.quota} seats available
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ✗ Full ({section.enrolled}/{section.quota})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 When you change the lecture, a tutorial will be randomly assigned from the available tutorials.
          </p>
        </div>
      </div>
    </div>
  );
}
