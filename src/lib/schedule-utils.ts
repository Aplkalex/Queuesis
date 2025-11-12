import { TimeSlot, SelectedCourse, Conflict, DayOfWeek, Course, Section } from '@/types';

type CourseColorShades = {
  DEFAULT: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

type ColorFamily = CourseColorShades[];

const COLOR_FAMILIES: ColorFamily[] = [
  [
    {
      DEFAULT: '#cdb4db',
      100: '#2b1a36',
      200: '#57346b',
      300: '#824ea1',
      400: '#a87ec1',
      500: '#cdb4db',
      600: '#d6c2e2',
      700: '#e0d2e9',
      800: '#ebe1f0',
      900: '#f5f0f8',
    },
    {
      DEFAULT: '#ffc8dd',
      100: '#5b0023',
      200: '#b60046',
      300: '#ff116c',
      400: '#ff6ca4',
      500: '#ffc8dd',
      600: '#ffd2e3',
      700: '#ffddea',
      800: '#ffe9f1',
      900: '#fff4f8',
    },
    {
      DEFAULT: '#ffafcc',
      100: '#56001f',
      200: '#ab003f',
      300: '#ff025f',
      400: '#ff5895',
      500: '#ffafcc',
      600: '#ffbed6',
      700: '#ffcee0',
      800: '#ffdeea',
      900: '#ffeff5',
    },
    {
      DEFAULT: '#bde0fe',
      100: '#012f57',
      200: '#035eaf',
      300: '#0f8dfb',
      400: '#66b6fd',
      500: '#bde0fe',
      600: '#cbe6fe',
      700: '#d8ecfe',
      800: '#e5f3ff',
      900: '#f2f9ff',
    },
    {
      DEFAULT: '#a2d2ff',
      100: '#002b54',
      200: '#0056a7',
      300: '#0082fb',
      400: '#50aaff',
      500: '#a2d2ff',
      600: '#b6dcff',
      700: '#c8e4ff',
      800: '#daedff',
      900: '#edf6ff',
    },
  ],
  [
    {
      DEFAULT: '#ff595e',
      100: '#440002',
      200: '#890005',
      300: '#cd0007',
      400: '#ff121a',
      500: '#ff595e',
      600: '#ff787d',
      700: '#ff9a9d',
      800: '#ffbcbe',
      900: '#ffddde',
    },
    {
      DEFAULT: '#ffca3a',
      100: '#3e2e00',
      200: '#7c5b00',
      300: '#bb8900',
      400: '#f9b700',
      500: '#ffca3a',
      600: '#ffd560',
      700: '#ffdf88',
      800: '#ffeaaf',
      900: '#fff4d7',
    },
    {
      DEFAULT: '#8ac926',
      100: '#1c2808',
      200: '#38510f',
      300: '#537917',
      400: '#6fa11f',
      500: '#8ac926',
      600: '#a4dc49',
      700: '#bbe577',
      800: '#d2eea4',
      900: '#e8f6d2',
    },
    {
      DEFAULT: '#1982c4',
      100: '#051a27',
      200: '#0a344e',
      300: '#0f4e74',
      400: '#14679b',
      500: '#1982c4',
      600: '#31a0e4',
      700: '#65b7eb',
      800: '#98cff2',
      900: '#cce7f8',
    },
    {
      DEFAULT: '#6a4c93',
      100: '#150f1e',
      200: '#2a1f3b',
      300: '#402e59',
      400: '#553d76',
      500: '#6a4c93',
      600: '#8768b1',
      700: '#a58ec5',
      800: '#c3b4d8',
      900: '#e1d9ec',
    },
  ],
  [
    {
      DEFAULT: '#22223b',
      100: '#07070c',
      200: '#0d0d17',
      300: '#141423',
      400: '#1b1b2f',
      500: '#22223b',
      600: '#40406f',
      700: '#6060a3',
      800: '#9595c2',
      900: '#cacae0',
    },
    {
      DEFAULT: '#4a4e69',
      100: '#0f1015',
      200: '#1e1f2a',
      300: '#2c2f3f',
      400: '#3b3e54',
      500: '#4a4e69',
      600: '#666b8f',
      700: '#8b8fac',
      800: '#b1b4c8',
      900: '#d8dae3',
    },
    {
      DEFAULT: '#9a8c98',
      100: '#1f1c1f',
      200: '#3f383e',
      300: '#5e535c',
      400: '#7d6f7b',
      500: '#9a8c98',
      600: '#aea4ad',
      700: '#c3bbc1',
      800: '#d7d2d6',
      900: '#ebe8ea',
    },
    {
      DEFAULT: '#c9ada7',
      100: '#2e1f1c',
      200: '#5b3e38',
      300: '#895d54',
      400: '#ad8279',
      500: '#c9ada7',
      600: '#d4bdb8',
      700: '#dececa',
      800: '#e9dedc',
      900: '#f4efed',
    },
    {
      DEFAULT: '#f2e9e4',
      100: '#3f2a1e',
      200: '#7f543d',
      300: '#b58165',
      400: '#d3b5a4',
      500: '#f2e9e4',
      600: '#f4ede9',
      700: '#f7f1ee',
      800: '#faf6f4',
      900: '#fcfaf9',
    },
  ],
];

export const COURSE_COLOR_POOL = COLOR_FAMILIES.flatMap((family) =>
  family.map((palette) => palette.DEFAULT)
);

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time slots overlap
 */
export function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Must be on the same day
  if (slot1.day !== slot2.day) {
    console.log('      Different days:', slot1.day, 'vs', slot2.day);
    return false;
  }

  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  console.log('      Same day:', slot1.day);
  console.log('      Slot1:', slot1.startTime, '-', slot1.endTime, '=', start1, '-', end1);
  console.log('      Slot2:', slot2.startTime, '-', slot2.endTime, '=', start2, '-', end2);
  console.log('      Overlap check: start1 < end2 && start2 < end1 =', start1, '<', end2, '&&', start2, '<', end1, '=', start1 < end2 && start2 < end1);

  // Check for overlap
  return start1 < end2 && start2 < end1;
}

/**
 * Detect conflicts between selected courses
 */
export function detectConflicts(courses: SelectedCourse[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const course1 = courses[i];
      const course2 = courses[j];

      if (course1.course.courseCode === course2.course.courseCode) {
        continue;
      }

      const conflictingSlots: { slot1: TimeSlot; slot2: TimeSlot }[] = [];

      // Check each time slot combination
      for (const slot1 of course1.selectedSection.timeSlots) {
        for (const slot2 of course2.selectedSection.timeSlots) {
          if (timeSlotsOverlap(slot1, slot2)) {
            conflictingSlots.push({ slot1, slot2 });
          }
        }
      }

      if (conflictingSlots.length > 0) {
        conflicts.push({
          course1,
          course2,
          conflictingTimeSlots: conflictingSlots,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Calculate duration of a time slot in minutes
 */
export function getSlotDuration(slot: TimeSlot): number {
  return timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
}

/**
 * Get all unique days from selected courses
 */
export function getScheduleDays(courses: SelectedCourse[]): DayOfWeek[] {
  const daysSet = new Set<DayOfWeek>();
  
  courses.forEach(course => {
    course.selectedSection.timeSlots.forEach(slot => {
      daysSet.add(slot.day);
    });
  });

  const dayOrder: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayOrder.filter(day => daysSet.has(day));
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(slot: TimeSlot): string {
  return `${slot.day.slice(0, 3)} ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`;
}

/**
 * Format time from 24h to 12h format
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

/**
 * Generate a unique color for course visualization
 * Uses courseCode hash to ensure consistent unique colors
 */
export function generateCourseColor(courseCode: string, usedColors: string[]): string {
  const familyOptions = COLOR_FAMILIES
    .map((family) => family.map((palette) => palette.DEFAULT).filter((color) => !usedColors.includes(color)))
    .filter((available) => available.length > 0);

  if (familyOptions.length > 0) {
    const familyIndex = Math.floor(Math.random() * familyOptions.length);
    const family = familyOptions[familyIndex];
    const colorIndex = Math.floor(Math.random() * family.length);
    return family[colorIndex];
  }

  const remainingColors = COURSE_COLOR_POOL.filter((color) => !usedColors.includes(color));
  if (remainingColors.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingColors.length);
    return remainingColors[randomIndex];
  }

  // If all colors used, generate hash-based color
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const fallbackPalette = COURSE_COLOR_POOL;
  return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
}

/**
 * Check if a course has available seats
 */
export function hasAvailableSeats(section: { quota: number; enrolled: number }): boolean {
  return section.enrolled < section.quota;
}

/**
 * Calculate total credits for selected courses
 */
export function calculateTotalCredits(courses: SelectedCourse[]): number {
  const seen = new Set<string>();

  return courses.reduce((total, selected) => {
    const code = selected.course.courseCode;
    if (seen.has(code)) {
      return total;
    }
    seen.add(code);
    return total + (selected.course.credits ?? 0);
  }, 0);
}

/**
 * Count distinct courses in the current selection (ignores tutorial/lab sections).
 */
export function countUniqueCourses(courses: SelectedCourse[]): number {
  const seen = new Set<string>();
  courses.forEach(({ course }) => {
    seen.add(course.courseCode);
  });
  return seen.size;
}

/**
 * Detect conflicts when adding a new course
 * Returns array of conflicting course codes
 */
export function detectNewCourseConflicts(
  newCourse: SelectedCourse,
  existingCourses: SelectedCourse[]
): string[] {
  const conflicts: string[] = [];

  console.log('🔍 Checking conflicts for:', newCourse.course.courseCode, newCourse.selectedSection.sectionId);
  console.log('   Time slots:', newCourse.selectedSection.timeSlots);

  for (const existingCourse of existingCourses) {
    if (existingCourse.course.courseCode === newCourse.course.courseCode) {
      continue;
    }

    console.log('  Against:', existingCourse.course.courseCode, existingCourse.selectedSection.sectionId);
    console.log('    Time slots:', existingCourse.selectedSection.timeSlots);
    
    // Check if any time slots overlap
    for (const newSlot of newCourse.selectedSection.timeSlots) {
      for (const existingSlot of existingCourse.selectedSection.timeSlots) {
        const overlaps = timeSlotsOverlap(newSlot, existingSlot);
        if (overlaps) {
          console.log('    ⚠️ CONFLICT FOUND!', newSlot, 'overlaps with', existingSlot);
          conflicts.push(existingCourse.course.courseCode);
          break; // Only add each course once
        }
      }
      if (conflicts.includes(existingCourse.course.courseCode)) break;
    }
  }

  console.log('  Total conflicts found:', conflicts);
  return conflicts;
}

const DEPENDENT_SECTION_TYPES = new Set<Section['sectionType']>(['Tutorial', 'Lab']);

const isDependentSectionType = (type: Section['sectionType']) =>
  DEPENDENT_SECTION_TYPES.has(type);

/**
 * Determine which lecture is effectively active for a course based on current selections.
 * Falls back to the parent lecture of any selected tutorial/lab if the lecture itself
 * hasn't been explicitly added yet.
 */
export function getActiveLectureId(
  selectedCourses: SelectedCourse[],
  course: Course
): string | null {
  const directLecture = selectedCourses.find(
    (sc) =>
      sc.course.courseCode === course.courseCode &&
      sc.selectedSection.sectionType === 'Lecture'
  );

  if (directLecture) {
    return directLecture.selectedSection.sectionId;
  }

  const dependentSection = selectedCourses.find(
    (sc) =>
      sc.course.courseCode === course.courseCode &&
      isDependentSectionType(sc.selectedSection.sectionType) &&
      sc.selectedSection.parentLecture
  );

  if (!dependentSection?.selectedSection.parentLecture) {
    return null;
  }

  const parentLectureId = dependentSection.selectedSection.parentLecture;
  const lectureExists = course.sections.some(
    (section) =>
      section.sectionType === 'Lecture' && section.sectionId === parentLectureId
  );

  return lectureExists ? parentLectureId : null;
}

/**
 * Remove sections (lectures/tutorials/labs) that don't belong to the supplied lecture.
 * Useful when switching lectures to ensure dependent sections stay in sync.
 */
export function removeDependentSectionsForLecture(
  selectedCourses: SelectedCourse[],
  courseCode: string,
  lectureId: string
): SelectedCourse[] {
  return selectedCourses.filter((sc) => {
    if (sc.course.courseCode !== courseCode) {
      return true;
    }

    const { selectedSection } = sc;

    if (selectedSection.sectionType === 'Lecture') {
      return selectedSection.sectionId === lectureId;
    }

    if (isDependentSectionType(selectedSection.sectionType)) {
      return selectedSection.parentLecture === lectureId;
    }

    return true;
  });
}

/**
 * Remove a lecture and all of its dependent sections from the current selection.
 */
export function removeLectureAndDependents(
  selectedCourses: SelectedCourse[],
  courseCode: string,
  lectureId: string
): SelectedCourse[] {
  return selectedCourses.filter((sc) => {
    if (sc.course.courseCode !== courseCode) {
      return true;
    }

    const { selectedSection } = sc;

    if (selectedSection.sectionType === 'Lecture') {
      return selectedSection.sectionId !== lectureId;
    }

    if (isDependentSectionType(selectedSection.sectionType)) {
      if (!selectedSection.parentLecture) {
        return false;
      }
      return selectedSection.parentLecture !== lectureId;
    }

    return true;
  });
}
