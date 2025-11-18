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
      DEFAULT: '#ffadad',
      100: '#560000',
      200: '#ab0000',
      300: '#ff0202',
      400: '#ff5858',
      500: '#ffadad',
      600: '#ffbebe',
      700: '#ffcece',
      800: '#ffdede',
      900: '#ffefef',
    },
  ],
  [
    {
      DEFAULT: '#ffd6a5',
      100: '#542e00',
      200: '#a75c00',
      300: '#fb8a00',
      400: '#ffb050',
      500: '#ffd6a5',
      600: '#ffdeb6',
      700: '#ffe6c8',
      800: '#ffeeda',
      900: '#fff7ed',
    },
  ],
  [
    {
      DEFAULT: '#fdffb6',
      100: '#555800',
      200: '#aaaf00',
      300: '#f7ff08',
      400: '#faff60',
      500: '#fdffb6',
      600: '#fdffc6',
      700: '#feffd4',
      800: '#feffe2',
      900: '#fffff1',
    },
  ],
  [
    {
      DEFAULT: '#caffbf',
      100: '#0f5900',
      200: '#1eb100',
      300: '#34ff0b',
      400: '#7eff64',
      500: '#caffbf',
      600: '#d3ffca',
      700: '#deffd7',
      800: '#e9ffe4',
      900: '#f4fff2',
    },
  ],
  [
    {
      DEFAULT: '#9bf6ff',
      100: '#004b52',
      200: '#0096a3',
      300: '#00e0f5',
      400: '#47f0ff',
      500: '#9bf6ff',
      600: '#adf8ff',
      700: '#c2faff',
      800: '#d6fcff',
      900: '#ebfdff',
    },
  ],
  [
    {
      DEFAULT: '#a0c4ff',
      100: '#002053',
      200: '#003fa5',
      300: '#005ff8',
      400: '#4b90ff',
      500: '#a0c4ff',
      600: '#b1cfff',
      700: '#c5dbff',
      800: '#d8e7ff',
      900: '#ecf3ff',
    },
  ],
  [
    {
      DEFAULT: '#bdb2ff',
      100: '#0d0057',
      200: '#1a00ad',
      300: '#2b05ff',
      400: '#745cff',
      500: '#bdb2ff',
      600: '#cbc2ff',
      700: '#d8d1ff',
      800: '#e5e0ff',
      900: '#f2f0ff',
    },
  ],
  [
    {
      DEFAULT: '#ffc6ff',
      100: '#5b005b',
      200: '#b600b6',
      300: '#ff11ff',
      400: '#ff6cff',
      500: '#ffc6ff',
      600: '#ffd2ff',
      700: '#ffddff',
      800: '#ffe9ff',
      900: '#fff4ff',
    },
  ],
  [
    {
      DEFAULT: '#fffffc',
      100: '#656500',
      200: '#caca00',
      300: '#ffff30',
      400: '#ffff95',
      500: '#fffffc',
      600: '#fffffb',
      700: '#fffffc',
      800: '#fffffd',
      900: '#fffffe',
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
