import { describe, expect, it } from '@jest/globals';
import type { SelectedCourse } from '@/types';
import { buildScheduleICS } from '../calendar-export';

describe('calendar export', () => {
  it('combines the course code and section and labels the section type', () => {
    const selectedCourse: SelectedCourse = {
      course: {
        courseCode: 'UGFH 1000',
        courseName: 'Humanities',
        department: 'General Education',
        credits: 3,
        sections: [],
        term: '2025-26-T1',
        career: 'Undergraduate',
      },
      selectedSection: {
        sectionId: 'A',
        sectionType: 'Lecture',
        timeSlots: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', location: 'YIA 101' }],
        quota: 1,
        enrolled: 0,
        seatsRemaining: 1,
      },
    };

    const { ics } = buildScheduleICS([selectedCourse], '2025-26-T1');

    expect(ics).toContain('SUMMARY:UGFH1000A - LEC');
    expect(ics).toContain('LOCATION:YIA 101');
    expect(ics).toContain('DTSTART;TZID=Asia/Hong_Kong:20250901T090000');
    expect(ics).toContain('DTEND;TZID=Asia/Hong_Kong:20250901T100000');
  });
});
