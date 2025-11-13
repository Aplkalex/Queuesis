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
      DEFAULT: '#2563EB',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    {
      DEFAULT: '#0EA5E9',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    {
      DEFAULT: '#14B8A6',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
  ],
  [
    {
      DEFAULT: '#F97316',
      100: '#FFF7ED',
      200: '#FFEDD5',
      300: '#FED7AA',
      400: '#FDBA74',
      500: '#FB923C',
      600: '#F97316',
      700: '#EA580C',
      800: '#C2410C',
      900: '#9A3412',
    },
    {
      DEFAULT: '#F43F5E',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      700: '#BE123C',
      800: '#9F1239',
      900: '#881337',
    },
    {
      DEFAULT: '#F59E0B',
      100: '#FFFBEB',
      200: '#FEF3C7',
      300: '#FDE68A',
      400: '#FCD34D',
      500: '#FBBF24',
      600: '#F59E0B',
      700: '#D97706',
      800: '#B45309',
      900: '#92400E',
    },
  ],
  [
    {
      DEFAULT: '#9333EA',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
    },
    {
      DEFAULT: '#8B5CF6',
      100: '#F5F3FF',
      200: '#EDE9FE',
      300: '#DDD6FE',
      400: '#C4B5FD',
      500: '#A78BFA',
      600: '#8B5CF6',
      700: '#7C3AED',
      800: '#6D28D9',
      900: '#5B21B6',
    },
    {
      DEFAULT: '#EC4899',
      100: '#FDF2F8',
      200: '#FCE7F3',
      300: '#FBCFE8',
      400: '#F9A8D4',
      500: '#F472B6',
      600: '#EC4899',
      700: '#DB2777',
      800: '#BE185D',
      900: '#9D174D',
    },
  ],
  [
    {
      DEFAULT: '#22C55E',
      100: '#ECFDF5',
      200: '#D1FAE5',
      300: '#A7F3D0',
      400: '#6EE7B7',
      500: '#34D399',
      600: '#22C55E',
      700: '#16A34A',
      800: '#15803D',
      900: '#166534',
    },
    {
      DEFAULT: '#0891B2',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#0E7490',
      900: '#164E63',
    },
    {
      DEFAULT: '#475569',
      100: '#F8FAFC',
      200: '#F1F5F9',
      300: '#E2E8F0',
      400: '#CBD5F5',
      500: '#94A3B8',
      600: '#64748B',
      700: '#475569',
      800: '#334155',
      900: '#1E293B',
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
