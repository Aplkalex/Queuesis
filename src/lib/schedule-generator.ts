/**
 * Schedule Generation Algorithm
 * 
 * Generates all valid schedule combinations from selected courses,
 * filters out conflicts, and ranks by user preferences.
 */

import { Course, Section, SelectedCourse, TimeSlot, DayOfWeek } from '@/types';
import { timeSlotsOverlap } from './schedule-utils';

// ============================================================================
// TYPES
// ============================================================================

export type GeneratedSchedule = {
  sections: SelectedCourse[];
  score: number;
  metadata?: {
    totalGapMinutes?: number;
    daysUsed?: number;
    avgStartTime?: number;
    avgEndTime?: number;
    freeDays?: number;
    longBreakCount?: number;
  };
};

export type ScheduleGenerationOptions = {
  preference: 'shortBreaks' | 'longBreaks' | 'consistentStart' | 'startLate' | 'endEarly' | 'daysOff' | null;
  maxResults?: number; // Default 100
};

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generates all valid schedule combinations from courses
 * @param courses - Array of courses to schedule
 * @param options - Generation options including preference
 * @returns Array of valid schedules ranked by score
 */
export function generateSchedules(
  courses: Course[],
  options: ScheduleGenerationOptions
): GeneratedSchedule[] {
  // Handle edge case: empty courses
  if (!courses || courses.length === 0) {
    return [];
  }

  const maxResults = options.maxResults || 100;

  // Step 1: Generate all possible combinations
  const allCombinations = generateAllCombinations(courses);
  
  // Step 2: Filter out conflicting schedules
  const validSchedules = allCombinations.filter(combination => 
    !hasConflicts(combination)
  );

  // Step 3: Score each schedule based on preference
  const scoredSchedules = validSchedules.map(sections => {
    const score = options.preference 
      ? calculateScore(sections, options.preference)
      : 0;
    
    const metadata = calculateMetadata(sections, options.preference);
    
    return {
      sections,
      score,
      metadata,
    };
  });

  // Step 4: Sort by score (descending) and limit results
  scoredSchedules.sort((a, b) => b.score - a.score);
  
  return scoredSchedules.slice(0, maxResults);
}

// ============================================================================
// COMBINATION GENERATION
// ============================================================================

/**
 * Generates all possible combinations of sections across courses
 * For each course, we need to select one lecture section and ONE tutorial/lab per lecture
 */
function generateAllCombinations(courses: Course[]): SelectedCourse[][] {
  // For each course, get all possible section combinations (lecture + required sections)
  const sectionCombinationsByCourse = courses.map(course => {
    const lectures = course.sections.filter(section => section.sectionType === 'Lecture');
    const allCourseCombinations: SelectedCourse[][] = [];

    for (const lecture of lectures) {
      // Find related sections (tutorials, labs) for this lecture
      const relatedSections = course.sections.filter(section => 
        section.sectionType !== 'Lecture' && 
        (section.parentLecture === lecture.sectionId || section.parentLecture === undefined)
      );

      if (relatedSections.length === 0) {
        // No tutorials/labs required - just the lecture
        allCourseCombinations.push([{
          course,
          selectedSection: lecture,
        }]);
      } else {
        // Generate one combination for each tutorial/lab option
        for (const relatedSection of relatedSections) {
          allCourseCombinations.push([
            {
              course,
              selectedSection: lecture,
            },
            {
              course,
              selectedSection: relatedSection,
            }
          ]);
        }
      }
    }

    return allCourseCombinations;
  });

  // Generate Cartesian product of all course combinations
  const allSchedules = cartesianProduct(sectionCombinationsByCourse);

  // Flatten: each schedule is an array of SelectedCourse arrays, flatten to single array
  return allSchedules.map(schedule => schedule.flat());
}

/**
 * Generates Cartesian product of arrays
 * Example: [[A, B], [1, 2]] => [[A, 1], [A, 2], [B, 1], [B, 2]]
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map(item => [item]);

  const result: T[][] = [];
  const rest = cartesianProduct(arrays.slice(1));

  for (const item of arrays[0]) {
    for (const combination of rest) {
      result.push([item, ...combination]);
    }
  }

  return result;
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Checks if a schedule has any time conflicts
 */
function hasConflicts(schedule: SelectedCourse[]): boolean {
  // Check all pairs of sections
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const section1 = schedule[i].selectedSection;
      const section2 = schedule[j].selectedSection;

      // Check if any time slots overlap
      for (const slot1 of section1.timeSlots) {
        for (const slot2 of section2.timeSlots) {
          if (timeSlotsOverlap(slot1, slot2)) {
            return true; // Conflict found
          }
        }
      }
    }
  }

  return false; // No conflicts
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculates score for a schedule based on preference
 * Higher score = better match to preference
 */
function calculateScore(schedule: SelectedCourse[], preference: string): number {
  switch (preference) {
    case 'shortBreaks':
      return scoreShortBreaks(schedule);
    case 'longBreaks':
      return scoreLongBreaks(schedule);
    case 'consistentStart':
      return scoreConsistentStart(schedule);
    case 'startLate':
      return scoreStartLate(schedule);
    case 'endEarly':
      return scoreEndEarly(schedule);
    case 'daysOff':
      return scoreDaysOff(schedule);
    default:
      return 0;
  }
}

/**
 * Short Breaks: Minimize gaps between classes
 * Lower total gap = higher score
 */
function scoreShortBreaks(schedule: SelectedCourse[]): number {
  const totalGap = calculateTotalGapMinutes(schedule);
  // Convert to score: fewer gaps = higher score
  // Use 1000 - gap so that 0 gap = 1000 score
  return Math.max(0, 1000 - totalGap);
}

/**
 * Long Breaks: Maximize number of breaks >= 60 minutes
 * More long breaks = higher score
 */
function scoreLongBreaks(schedule: SelectedCourse[]): number {
  const longBreakCount = countLongBreaks(schedule);
  return longBreakCount * 100; // Each long break = 100 points
}

/**
 * Consistent Start: Minimize variance in daily start times
 * Lower variance = higher score
 */
function scoreConsistentStart(schedule: SelectedCourse[]): number {
  const variance = calculateStartTimeVariance(schedule);
  // Lower variance = higher score
  return Math.max(0, 1000 - variance);
}

/**
 * Start Late: Maximize average start time
 * Later start = higher score
 */
function scoreStartLate(schedule: SelectedCourse[]): number {
  const avgStartTime = calculateAverageStartTime(schedule);
  // Start time in minutes (9:00 = 540, 14:00 = 840)
  // Score = start time directly (later = higher)
  return avgStartTime;
}

/**
 * End Early: Minimize average end time
 * Earlier end = higher score
 */
function scoreEndEarly(schedule: SelectedCourse[]): number {
  const avgEndTime = calculateAverageEndTime(schedule);
  // Convert to score: earlier = higher
  // Max end time ~= 20:00 (1200 minutes), so 1200 - avgEnd
  return Math.max(0, 1200 - avgEndTime);
}

/**
 * Days Off: Maximize number of free weekdays
 * More free days = higher score
 */
function scoreDaysOff(schedule: SelectedCourse[]): number {
  const daysUsed = getUniqueDays(schedule);
  const freeDays = 5 - daysUsed.length; // 5 weekdays
  return freeDays * 200; // Each free day = 200 points
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total gap minutes in a schedule
 */
function calculateTotalGapMinutes(schedule: SelectedCourse[]): number {
  const daySchedules = groupByDay(schedule);
  let totalGap = 0;

  for (const [day, slots] of Object.entries(daySchedules)) {
    // Sort slots by start time
    const sorted = slots.sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    // Calculate gaps between consecutive classes
    for (let i = 0; i < sorted.length - 1; i++) {
      const endTime = timeToMinutes(sorted[i].endTime);
      const nextStartTime = timeToMinutes(sorted[i + 1].startTime);
      const gap = Math.max(0, nextStartTime - endTime);
      totalGap += gap;
    }
  }

  return totalGap;
}

/**
 * Count breaks >= 60 minutes
 */
function countLongBreaks(schedule: SelectedCourse[]): number {
  const daySchedules = groupByDay(schedule);
  let count = 0;

  for (const [day, slots] of Object.entries(daySchedules)) {
    const sorted = slots.sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const endTime = timeToMinutes(sorted[i].endTime);
      const nextStartTime = timeToMinutes(sorted[i + 1].startTime);
      const gap = nextStartTime - endTime;
      
      if (gap >= 60) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Calculate variance in daily start times
 */
function calculateStartTimeVariance(schedule: SelectedCourse[]): number {
  const daySchedules = groupByDay(schedule);
  const startTimes: number[] = [];

  for (const [day, slots] of Object.entries(daySchedules)) {
    if (slots.length > 0) {
      const earliestStart = Math.min(...slots.map(s => timeToMinutes(s.startTime)));
      startTimes.push(earliestStart);
    }
  }

  if (startTimes.length === 0) return 0;

  const mean = startTimes.reduce((a, b) => a + b, 0) / startTimes.length;
  const variance = startTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / startTimes.length;
  
  return variance;
}

/**
 * Calculate average start time across all days
 */
function calculateAverageStartTime(schedule: SelectedCourse[]): number {
  const daySchedules = groupByDay(schedule);
  const startTimes: number[] = [];

  for (const [day, slots] of Object.entries(daySchedules)) {
    if (slots.length > 0) {
      const earliestStart = Math.min(...slots.map(s => timeToMinutes(s.startTime)));
      startTimes.push(earliestStart);
    }
  }

  if (startTimes.length === 0) return 0;
  
  return startTimes.reduce((a, b) => a + b, 0) / startTimes.length;
}

/**
 * Calculate average end time across all days
 */
function calculateAverageEndTime(schedule: SelectedCourse[]): number {
  const daySchedules = groupByDay(schedule);
  const endTimes: number[] = [];

  for (const [day, slots] of Object.entries(daySchedules)) {
    if (slots.length > 0) {
      const latestEnd = Math.max(...slots.map(s => timeToMinutes(s.endTime)));
      endTimes.push(latestEnd);
    }
  }

  if (endTimes.length === 0) return 0;
  
  return endTimes.reduce((a, b) => a + b, 0) / endTimes.length;
}

/**
 * Get unique days used in schedule
 */
function getUniqueDays(schedule: SelectedCourse[]): string[] {
  const days = new Set<string>();
  
  for (const selected of schedule) {
    for (const slot of selected.selectedSection.timeSlots) {
      days.add(slot.day);
    }
  }

  return Array.from(days);
}

/**
 * Group time slots by day
 */
function groupByDay(schedule: SelectedCourse[]): Record<string, TimeSlot[]> {
  const grouped: Record<string, TimeSlot[]> = {};

  for (const selected of schedule) {
    for (const slot of selected.selectedSection.timeSlots) {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    }
  }

  return grouped;
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate metadata for a schedule
 */
function calculateMetadata(
  schedule: SelectedCourse[],
  preference: string | null
): GeneratedSchedule['metadata'] {
  return {
    totalGapMinutes: calculateTotalGapMinutes(schedule),
    daysUsed: getUniqueDays(schedule).length,
    avgStartTime: calculateAverageStartTime(schedule),
    avgEndTime: calculateAverageEndTime(schedule),
    freeDays: 5 - getUniqueDays(schedule).length,
    longBreakCount: countLongBreaks(schedule),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { scoreSchedule };

/**
 * Score a single schedule (used by tests)
 */
function scoreSchedule(schedule: GeneratedSchedule, preference: string): number {
  return calculateScore(schedule.sections, preference);
}
