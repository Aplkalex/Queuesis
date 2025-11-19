import { TimeSlot, SelectedCourse, Conflict, DayOfWeek, Course, Section } from '@/types';

export type CourseColorShades = {
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

export type ColorFamily = CourseColorShades[];

const COLOR_FAMILIES: ColorFamily[] = [
  [
    {
      DEFAULT: '#ff0000',
      100: '#330000',
      200: '#660000',
      300: '#990000',
      400: '#cc0000',
      500: '#ff0000',
      600: '#ff3333',
      700: '#ff6666',
      800: '#ff9999',
      900: '#ffcccc',
    },
  ],
  [
    {
      DEFAULT: '#ff8700',
      100: '#331b00',
      200: '#663600',
      300: '#995200',
      400: '#cc6d00',
      500: '#ff8700',
      600: '#ffa033',
      700: '#ffb866',
      800: '#ffcf99',
      900: '#ffe7cc',
    },
  ],
  [
    {
      DEFAULT: '#ffd300',
      100: '#332b00',
      200: '#665500',
      300: '#998000',
      400: '#ccaa00',
      500: '#ffd300',
      600: '#ffdd33',
      700: '#ffe666',
      800: '#ffee99',
      900: '#fff6cc',
    },
  ],
  [
    {
      DEFAULT: '#deff0a',
      100: '#2e3500',
      200: '#5c6a00',
      300: '#8a9f00',
      400: '#b8d400',
      500: '#deff0a',
      600: '#e5ff3b',
      700: '#ebff6c',
      800: '#f2ff9d',
      900: '#f8ffce',
    },
  ],
  [
    {
      DEFAULT: '#a1ff0a',
      100: '#213500',
      200: '#416a00',
      300: '#629f00',
      400: '#83d400',
      500: '#a1ff0a',
      600: '#b4ff3b',
      700: '#c7ff6c',
      800: '#d9ff9d',
      900: '#ecffce',
    },
  ],
  [
    {
      DEFAULT: '#0aff99',
      100: '#00351f',
      200: '#006a3e',
      300: '#009f5d',
      400: '#00d47c',
      500: '#0aff99',
      600: '#3bffad',
      700: '#6cffc2',
      800: '#9dffd6',
      900: '#ceffeb',
    },
  ],
  [
    {
      DEFAULT: '#0aefff',
      100: '#003235',
      200: '#00636a',
      300: '#00959f',
      400: '#00c6d4',
      500: '#0aefff',
      600: '#3bf2ff',
      700: '#6cf5ff',
      800: '#9df8ff',
      900: '#cefcff',
    },
  ],
  [
    {
      DEFAULT: '#147df5',
      100: '#021933',
      200: '#043266',
      300: '#064b99',
      400: '#0864cc',
      500: '#147df5',
      600: '#4397f7',
      700: '#72b1f9',
      800: '#a1cbfb',
      900: '#d0e5fd',
    },
  ],
  [
    {
      DEFAULT: '#580aff',
      100: '#110035',
      200: '#22006a',
      300: '#32009f',
      400: '#4300d4',
      500: '#580aff',
      600: '#793bff',
      700: '#9b6cff',
      800: '#bc9dff',
      900: '#deceff',
    },
  ],
  [
    {
      DEFAULT: '#be0aff',
      100: '#270035',
      200: '#4e006a',
      300: '#75009f',
      400: '#9c00d4',
      500: '#be0aff',
      600: '#cb3bff',
      700: '#d86cff',
      800: '#e59dff',
      900: '#f2ceff',
    },
  ],
];

export const COURSE_COLOR_POOL = COLOR_FAMILIES.flatMap((family) =>
  family.map((palette) => palette.DEFAULT)
);

const DEFAULT_TO_PALETTE = (() => {
  const map = new Map<string, CourseColorShades>();
  COLOR_FAMILIES.flat().forEach((palette) => {
    map.set(palette.DEFAULT.toLowerCase(), palette);
    map.set(palette[100].toLowerCase(), palette);
  });
  return map;
})();

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
export function generateCourseColor(courseCode: string, usedColors: string[], options?: { theme?: 'light' | 'dark' }): string {
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
  return COURSE_COLOR_POOL[Math.abs(hash) % COURSE_COLOR_POOL.length];
}

/**
 * Given a stored course color, map it to the appropriate shade for the current theme.
 */
export function adjustCourseColorForTheme(color: string | undefined, theme: 'light' | 'dark'): string {
  if (!color) return color ?? '#8B5CF6';
  if (theme === 'dark') return color;
  const palette = DEFAULT_TO_PALETTE.get(color.toLowerCase());
  if (!palette) return color;
  return palette[100] ?? palette.DEFAULT;
}

/**
 * Check if a course has available seats
 */
type SeatAwareSection = {
  quota?: number | null;
  enrolled?: number | null;
  seatsRemaining?: number | null;
};

export function hasAvailableSeats(section: SeatAwareSection): boolean {
  if (typeof section.seatsRemaining === 'number') {
    return section.seatsRemaining > 0;
  }

  if (typeof section.quota === 'number' && typeof section.enrolled === 'number') {
    return section.enrolled < section.quota;
  }

  return true;
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

  for (const existingCourse of existingCourses) {
    if (existingCourse.course.courseCode === newCourse.course.courseCode) {
      continue;
    }
    
    // Check if any time slots overlap
    for (const newSlot of newCourse.selectedSection.timeSlots) {
      for (const existingSlot of existingCourse.selectedSection.timeSlots) {
        const overlaps = timeSlotsOverlap(newSlot, existingSlot);
        if (overlaps) {
          conflicts.push(existingCourse.course.courseCode);
          break; // Only add each course once
        }
      }
      if (conflicts.includes(existingCourse.course.courseCode)) break;
    }
  }
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
