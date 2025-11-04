'use client';

import { useState } from 'react';
import { Course, Section, SelectedCourse } from '@/types';
import { mockCourses } from '@/data/mock-courses';
import { TimetableGrid } from '@/components/TimetableGrid';
import { CourseList } from '@/components/CourseList';
import { SearchBar, FilterBar, FilterButton } from '@/components/SearchBar';
import { BuildingReference } from '@/components/BuildingReference';
import { BuildingModal } from '@/components/BuildingModal';
import { generateCourseColor, calculateTotalCredits, detectConflicts } from '@/lib/schedule-utils';
import { DISCLAIMER } from '@/lib/constants';
import { Calendar, Book, AlertCircle, Trash2 } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Filter courses based on search and filters
  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch = 
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.sections.some(s => 
        s.instructor?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesDepartment = !selectedDepartment || course.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = Array.from(new Set(mockCourses.map(c => c.department)));

  // Add a course section to schedule
  const handleAddSection = (course: Course, section: Section) => {
    const newCourse: SelectedCourse = {
      course,
      selectedSection: section,
      color: generateCourseColor(selectedCourses.length),
    };
    setSelectedCourses([...selectedCourses, newCourse]);
  };

  // Remove a course from schedule
  const handleRemoveCourse = (index: number) => {
    setSelectedCourses(selectedCourses.filter((_, i) => i !== index));
  };

  // Clear all courses
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const handleClearSchedule = () => {
    setShowClearConfirm(true);
  };

  const confirmClearSchedule = () => {
    setSelectedCourses([]);
    setShowClearConfirm(false);
  };

  // Calculate stats
  const totalCredits = calculateTotalCredits(selectedCourses);
  const conflicts = detectConflicts(selectedCourses);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header - More compact */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-purple-600 text-white p-2 lg:p-2.5 rounded-lg shadow-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                  CUHK Course Scheduler
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Plan your perfect timetable
                </p>
              </div>
            </div>

            {/* Stats - More compact on mobile */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{selectedCourses.length}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Courses</div>
              </div>
              <div className="text-center hidden sm:block">
                <div className="text-xl lg:text-2xl font-bold text-purple-600">{totalCredits}</div>
                <div className="text-xs text-gray-500">Credits</div>
              </div>
              {conflicts.length > 0 && (
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{conflicts.length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Conflicts</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 lg:py-6">
        {/* Disclaimer - Compact on desktop, full on mobile */}
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 max-w-[1600px] mx-auto">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-800">{DISCLAIMER}</p>
        </div>

        {/* Conflicts warning */}
        {conflicts.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-[1600px] mx-auto">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1 text-sm">Schedule Conflicts Detected!</p>
                {conflicts.map((conflict, idx) => (
                  <p key={idx} className="text-xs text-red-700">
                    {conflict.course1.course.courseCode} conflicts with {conflict.course2.course.courseCode}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 max-w-[1600px] mx-auto">
          {/* Left sidebar - Course search - Narrower on desktop */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Book className="w-4 h-4 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Find Courses</h2>
              </div>

              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search courses..."
                className="mb-3"
              />

              <FilterBar
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
              >
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                    Department
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <FilterButton
                      active={selectedDepartment === null}
                      onClick={() => setSelectedDepartment(null)}
                    >
                      All
                    </FilterButton>
                    {departments.map((dept) => (
                      <FilterButton
                        key={dept}
                        active={selectedDepartment === dept}
                        onClick={() => setSelectedDepartment(dept)}
                      >
                        {dept.split(' ')[0]}
                      </FilterButton>
                    ))}
                  </div>
                </div>
              </FilterBar>
            </div>

            {/* Course list - Scrollable */}
            <div className="max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-220px)] overflow-y-auto space-y-3 pr-1">
              <CourseList
                courses={filteredCourses}
                onAddSection={handleAddSection}
              />
            </div>
          </div>

          {/* Right side - Timetable - Takes remaining space */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* My Schedule header - More compact */}
            <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">My Schedule</h2>
                <p className="text-xs text-gray-500">2025-26 Term 1</p>
              </div>
              {selectedCourses.length > 0 && (
                <button
                  onClick={handleClearSchedule}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>

            {/* Timetable - Fits viewport */}
            {selectedCourses.length > 0 ? (
              <TimetableGrid
                selectedCourses={selectedCourses}
                onRemoveCourse={(course) => {
                  const index = selectedCourses.indexOf(course);
                  handleRemoveCourse(index);
                }}
                onLocationClick={(location) => setSelectedLocation(location)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12 text-center border border-gray-100">
                <Calendar className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Your schedule is empty
                </h3>
                <p className="text-sm text-gray-500">
                  Search for courses and click the + button to add them to your schedule
                </p>
              </div>
            )}

            {/* Selected courses list */}
            {selectedCourses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                  Selected Courses ({selectedCourses.length})
                </h3>
                <div className="space-y-2">
                  {selectedCourses.map((sc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sc.color }}
                        />
                        <div>
                          <div className="font-semibold text-sm text-gray-900">
                            {sc.course.courseCode} - {sc.selectedSection.sectionType} {sc.selectedSection.sectionId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sc.course.credits} credits
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCourse(idx)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                        title="Remove course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Building Reference floating button */}
      <BuildingReference />

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Clear Schedule?</h3>
                <p className="text-sm text-gray-500">This will remove all courses</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear your entire schedule? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearSchedule}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Building Location Modal - Single instance for entire page */}
      {selectedLocation && (
        <BuildingModal
          location={selectedLocation}
          isOpen={true}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
