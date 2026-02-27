'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { SelectedCourse, DayOfWeek, TimeSlot, Section } from '@/types';
import { TIMETABLE_CONFIG, WEEKDAYS, SHORT_CLASS_INLINE_NUMBER_THRESHOLD_MINUTES } from '@/lib/constants';
import { timeToMinutes, formatTime, hasAvailableSeats } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { X, AlertCircle, GripVertical } from 'lucide-react';

interface TimetableGridDraggableProps {
  selectedCourses: SelectedCourse[];
  onCourseClick?: (course: SelectedCourse) => void;
  onRemoveCourse?: (course: SelectedCourse) => void;
  onLocationClick?: (location: string) => void;
  conflictingCourses?: string[];
  onDragEnd: (courseCode: string, sectionId: string, newDay: DayOfWeek) => void;
}

const DEFAULT_COURSE_COLOR = '#8B5CF6';
const DEFAULT_OVERLAP_GAP = 8;

type SectionType = Section['sectionType'];

interface DraggedSectionData {
  courseCode: string;
  sectionId: string;
  sectionType: SectionType;
  timeSlots: TimeSlot[];
  color?: string;
}

interface TextLayoutConfig {
  layout: 'compact' | 'comfortable' | 'spacious';
  fontSize: {
    primary: number;
    secondary: number;
    tertiary: number;
  };
  abbreviatedCourse: boolean;
  showLocation: boolean;
  badgeSize: 'tiny' | 'small' | 'normal';
}

const calculateTextLayout = (
  blockWidth: number,
  blockHeight: number,
  isSmallScreen: boolean
): TextLayoutConfig | null => {
  if (!isSmallScreen) return null;
  const paddingX = 10;
  const paddingY = 6;
  const availableWidth = Math.max(60, blockWidth - paddingX * 2);
  const availableHeight = Math.max(28, blockHeight - paddingY * 2);

  let layout: TextLayoutConfig['layout'] = 'spacious';
  if (availableHeight < 38) layout = 'compact';
  else if (availableHeight < 64) layout = 'comfortable';

  const basePrimary = layout === 'compact' ? 8.6 : layout === 'comfortable' ? 10.4 : 12.2;
  const baseSecondary = layout === 'compact' ? 7.6 : layout === 'comfortable' ? 9.1 : 10.4;
  const baseTertiary = layout === 'compact' ? 7.1 : layout === 'comfortable' ? 8.4 : 9.6;

  const widthFactor = Math.min(1.15, Math.max(0.5, availableWidth / 130));
  const heightFactor = Math.min(1.2, Math.max(0.45, availableHeight / 70));
  const scale = Math.min(widthFactor, heightFactor);

  const fontSize = {
    primary: Math.max(7, Math.min(12.5, basePrimary * scale)),
    secondary: Math.max(6.4, Math.min(10.5, baseSecondary * scale)),
    tertiary: Math.max(6, Math.min(9.8, baseTertiary * scale)),
  };

  const abbreviatedCourse = availableWidth < 100;
  const showLocation = availableHeight > 38 && layout !== 'compact';
  const badgeSize: TextLayoutConfig['badgeSize'] =
    layout === 'compact' ? 'tiny' : layout === 'comfortable' ? 'small' : 'normal';

  return { layout, fontSize, abbreviatedCourse, showLocation, badgeSize };
};

// Draggable Course Block Component
interface DraggableCourseBlockProps {
  selectedCourse: SelectedCourse;
  blockId: string;
  style: CSSProperties;
  slot: TimeSlot;
  slotHeight: number;
  overlapCount: number;
  onRemove?: (course: SelectedCourse) => void;
  onClick?: (course: SelectedCourse) => void;
  conflictingCourses?: string[];
  isDraggedSection: boolean;
  isSmallScreen: boolean;
}

function DraggableCourseBlock({
  selectedCourse,
  blockId,
  style,
  slot,
  slotHeight,
  overlapCount,
  onRemove,
  onClick,
  conflictingCourses = [],
  isDraggedSection,
  isSmallScreen,
}: DraggableCourseBlockProps) {
  const blockWidth = typeof style.width === 'number'
    ? Number(style.width)
    : typeof style.width === 'string' && style.width.endsWith('px')
      ? Number.parseFloat(style.width)
      : undefined;
  const blockHeight = typeof style.height === 'number'
    ? Number(style.height)
    : typeof style.height === 'string' && style.height.endsWith('px')
      ? Number.parseFloat(style.height)
      : undefined;
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  const durationMinutes = endMinutes - startMinutes;
  const blockHeightPx = (durationMinutes / 60) * slotHeight;

  const textConfig = useMemo(
    () => calculateTextLayout(blockWidth ?? 0, blockHeight ?? blockHeightPx, isSmallScreen),
    [blockWidth, blockHeight, blockHeightPx, isSmallScreen]
  );

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: blockId,
    data: {
      courseCode: selectedCourse.course.courseCode,
      sectionId: selectedCourse.selectedSection.sectionId,
      sectionType: selectedCourse.selectedSection.sectionType,
      timeSlots: selectedCourse.selectedSection.timeSlots,
      color: selectedCourse.color,
    } satisfies DraggedSectionData,
  });

  const isFull = !hasAvailableSeats(selectedCourse.selectedSection);
  const hasConflict = conflictingCourses.includes(selectedCourse.course.courseCode);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute rounded-[7px] cursor-grab active:cursor-grabbing group overflow-hidden border',
        'timetable-block-enter',
        'hover:scale-[1.02]',
        'text-white flex flex-col',
        'px-[5px] py-[4px] sm:px-1.5 sm:py-1',
        hasConflict && 'conflict-pattern',
        (isDragging || isDraggedSection) && 'opacity-30 scale-95'
      )}
      style={{
        ...style,
        borderRadius: '7px',
        borderWidth: isFull || hasConflict || selectedCourse.locked ? 2 : 1,
        borderColor: selectedCourse.locked
          ? 'rgba(255,255,255,0.95)'
          : isFull
            ? 'rgba(225, 29, 72, 0.94)'
            : hasConflict
              ? 'rgba(234, 179, 8, 0.95)'
              : style.borderColor,
        boxShadow: 'none',
        transition: isDragging ? 'none' : 'transform 0.25s ease, box-shadow 0.25s ease',
        minHeight: '32px',
      }}
      {...attributes}
      {...listeners}
    >
      {/* Delete button */}
      {onRemove && !selectedCourse.locked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(selectedCourse);
          }}
          className={cn(
            'absolute top-0 right-0 translate-x-[60%] -translate-y-[60%] w-7 h-7 rounded-full',
            'bg-red-500 hover:bg-red-600 text-white',
            'shadow-[0_0_0_2px_rgba(255,255,255,0.96),0_10px_20px_rgba(0,0,0,0.45)]',
            'flex items-center justify-center',
            'transition-all transform',
            'opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100',
            'z-[100000]'
          )}
          title="Remove course"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {onRemove && selectedCourse.locked && (
        <div
          className={cn(
            'absolute -top-2 -right-2 w-6 h-6 rounded-lg',
            'bg-gray-500/70 text-white',
            'flex items-center justify-center shadow-lg',
            'transition-all transform',
            'opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100',
            'z-[150]',
            'pointer-events-none'
          )}
          title="Locked (unlock to remove)"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Drag handle indicator */}
      <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Content */}
      <div
      className={cn(
        'overflow-hidden flex flex-col justify-start h-full',
        isSmallScreen && blockHeightPx < 40 ? 'gap-[1px]' : 'gap-[3px]'
      )}
        onClick={() => onClick?.(selectedCourse)}
      >
        {(() => {
          const isTiny = blockHeightPx < 48;
          const isMicro = blockHeightPx < 36;
          const firstFs = isMicro ? 8.5 : isTiny ? 10 : 11.5;
          const secondFs = isMicro ? 7.5 : isTiny ? 9 : 10;
          const thirdFs = isMicro ? 7 : isTiny ? 8 : 9;
          const inlineBadges = (isTiny || isMicro) && !isSmallScreen;
          const abbr = selectedCourse.selectedSection.sectionType === 'Lecture'
            ? 'LEC'
            : (selectedCourse.selectedSection.sectionType === 'Tutorial' ? 'TUT' : selectedCourse.selectedSection.sectionType);
          const first = `${selectedCourse.course.courseCode} | ${abbr} ${selectedCourse.selectedSection.sectionId}`;
          const classLabel = selectedCourse.selectedSection.classNumber ? `#${selectedCourse.selectedSection.classNumber}` : '';
          const isShortCourse = durationMinutes < SHORT_CLASS_INLINE_NUMBER_THRESHOLD_MINUTES;
          const locationLabelRaw = slot.location || selectedCourse.selectedSection.timeSlots.find((s) => s.location)?.location || 'Location TBA';
          const normalizedLocationLabel = locationLabelRaw.replace(/[_]+/g, ' ');
          const second = classLabel && normalizedLocationLabel
              ? `${classLabel} • ${normalizedLocationLabel}`
              : (classLabel || normalizedLocationLabel || 'TBA');
          const timeRange = `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`;
          const formattedCourseCode = selectedCourse.course.courseCode.replace(/([A-Za-z]+)(\d+)/, '$1 $2');
          const mobileLineTwo = `${abbr} ${selectedCourse.selectedSection.sectionId}${classLabel ? ` • ${classLabel}` : ''}`;
            const mobileLineThree = `${normalizedLocationLabel}${normalizedLocationLabel ? ' • ' : ''}${timeRange}`;

          const badgePreset = textConfig?.badgeSize ?? 'normal';
          const badgeClass =
            badgePreset === 'tiny' ? 'h-3 w-3' : badgePreset === 'small' ? 'h-3.5 w-3.5' : 'h-4 w-4';
          const badgeIconClass =
            badgePreset === 'tiny' ? 'h-2 w-2' : 'h-2.5 w-2.5';
          const renderConflictBadge = () => (
            <span className={cn('flex items-center justify-center rounded-full bg-yellow-300/90 text-slate-900', badgeClass)}>
              <AlertCircle className={cn(badgeIconClass)} />
            </span>
          );

          const renderFullBadge = () => (
            <span className={cn('flex items-center justify-center rounded-full bg-rose-400/90 text-white', badgeClass)}>
              <AlertCircle className={cn(badgeIconClass)} />
            </span>
          );

          if (isSmallScreen && textConfig) {
            const { layout, fontSize, abbreviatedCourse, showLocation } = textConfig;
            const courseDisplay = abbreviatedCourse ? selectedCourse.course.courseCode.replace(/[0-9]/g, '') : formattedCourseCode;
            if (layout === 'compact') {
              return (
                <>
                  <div
                    className="font-semibold whitespace-normal break-words"
                    style={{ fontSize: `${fontSize.primary}px`, lineHeight: 1.05 }}
                    title={formattedCourseCode}
                  >
                    {courseDisplay}
                  </div>
                  <div
                    className="font-medium whitespace-normal break-words opacity-95"
                    style={{ fontSize: `${fontSize.secondary}px`, lineHeight: 1.04 }}
                    title={mobileLineTwo}
                  >
                    {mobileLineTwo}
                  </div>
                  {showLocation && (
                    <div
                      className="whitespace-normal break-words opacity-85"
                      style={{ fontSize: `${fontSize.tertiary}px`, lineHeight: 1.06 }}
                      title={mobileLineThree}
                    >
                      {mobileLineThree}
                    </div>
                  )}
                </>
              );
            }
            if (layout === 'comfortable') {
              return (
                <>
                  <div
                    className="font-semibold whitespace-normal break-words"
                    style={{ fontSize: `${fontSize.primary}px`, lineHeight: 1.08 }}
                    title={formattedCourseCode}
                  >
                    {courseDisplay}
                  </div>
                  <div
                    className="font-medium whitespace-normal break-words opacity-95"
                    style={{ fontSize: `${fontSize.secondary}px`, lineHeight: 1.06 }}
                    title={mobileLineTwo}
                  >
                    {mobileLineTwo}
                  </div>
                  {showLocation && (
                    <div
                      className="whitespace-normal break-words opacity-90"
                      style={{ fontSize: `${fontSize.tertiary}px`, lineHeight: 1.08 }}
                      title={mobileLineThree}
                    >
                      {mobileLineThree}
                    </div>
                  )}
                </>
              );
            }
            return (
              <>
                <div
                  className="font-semibold whitespace-normal break-words"
                  style={{ fontSize: `${fontSize.primary}px`, lineHeight: 1.1 }}
                  title={formattedCourseCode}
                >
                  {formattedCourseCode}
                </div>
                <div
                  className="font-medium whitespace-normal break-words opacity-95"
                  style={{ fontSize: `${fontSize.secondary}px`, lineHeight: 1.1 }}
                  title={mobileLineTwo}
                >
                  {mobileLineTwo}
                </div>
                <div
                  className="whitespace-normal break-words opacity-90"
                  style={{ fontSize: `${fontSize.tertiary}px`, lineHeight: 1.12 }}
                  title={mobileLineThree}
                >
                  {mobileLineThree}
                </div>
              </>
            );
          }

          return (
            <>
              <div
                className="flex items-start gap-1 leading-[1.05]"
              >
                <div
                  className={cn(
                    'font-semibold flex-1',
                    isSmallScreen ? 'whitespace-normal break-words' : 'truncate'
                  )}
                  style={{ fontSize: `${firstFs}px` }}
                  title={first}
                >
                  {selectedCourse.course.courseCode} <span className="opacity-90">|</span> {abbr} {selectedCourse.selectedSection.sectionId}
                </div>
                {(inlineBadges || (hasConflict || isFull)) && !isSmallScreen && (
                  <div className="flex flex-col items-end gap-0.5">
                    {hasConflict && renderConflictBadge()}
                    {isFull && renderFullBadge()}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'leading-[1.05] opacity-90',
                  isSmallScreen ? 'whitespace-normal break-words' : 'truncate'
                )}
                style={{ fontSize: `${secondFs}px` }}
              >
                {second}
              </div>
              <div
                className={cn(
                  'leading-[1.05] opacity-85 text-white/90',
                  isSmallScreen ? 'break-words' : 'truncate'
                )}
                style={{ fontSize: `${thirdFs}px` }}
              >
                {timeRange}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// Drop Shadow Preview Component
interface DropShadowPreviewProps {
  entries: Array<{ style: CSSProperties }>;
  color: string;
}

function DropShadowPreview({ entries, color }: DropShadowPreviewProps) {
  return (
    <>
      {entries.map((entry, idx) => (
        <div
          key={idx}
          className="absolute rounded-lg border-2 border-dashed pointer-events-none animate-pulse"
          style={{
            ...entry.style,
            backgroundColor: `${color}30`,
            borderColor: `${color}`,
            opacity: 0.6,
          }}
        />
      ))}
    </>
  );
}

// Droppable Day Column Component
interface DroppableDayColumnProps {
  day: DayOfWeek;
  hours: number[];
  slotHeight: number;
  isSmallScreen: boolean;
  selectedCourses: SelectedCourse[];
  onRemoveCourse?: (course: SelectedCourse) => void;
  onCourseClick?: (course: SelectedCourse) => void;
  conflictingCourses?: string[];
  draggedData: DraggedSectionData | null;
  draggedCourseCode?: string;
  draggedSectionId?: string;
}

function DroppableDayColumn({
  day,
  hours,
  slotHeight,
  isSmallScreen,
  selectedCourses,
  onRemoveCourse,
  onCourseClick,
  conflictingCourses,
  draggedData,
  draggedCourseCode,
  draggedSectionId,
}: DroppableDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: {
      day: day,
    },
  });

  // Show drop shadow if dragging and this is a valid drop zone
  const showDropShadow = isOver && draggedData !== null;
  const canDrop = Boolean(draggedData);

  // Compute side-by-side lanes for this day (including preview entries when dragging over)
  type SlotLayoutInput = {
    key: string;
    start: number;
    end: number;
    origin: 'course' | 'preview';
    course?: SelectedCourse;
    slot?: TimeSlot;
  };
  type SlotLayoutOutput = SlotLayoutInput & {
    lane: number;
    overlapCount: number;
  };

  const OVERLAP_GAP = DEFAULT_OVERLAP_GAP;

  const layoutDaySlots = (blocks: SlotLayoutInput[]): SlotLayoutOutput[] => {
    const sorted = [...blocks].sort((a, b) => {
      if (a.start === b.start) return a.end - b.end;
      return a.start - b.start;
    });
    const active: SlotLayoutOutput[] = [];
    const result: SlotLayoutOutput[] = [];
    for (const block of sorted) {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        if (active[i].end <= block.start) {
          active.splice(i, 1);
        }
      }
      const usedLanes = new Set(active.map((e) => e.lane));
      let lane = 0;
      while (usedLanes.has(lane)) lane += 1;
      const layoutBlock: SlotLayoutOutput = { ...block, lane, overlapCount: Math.max(1, active.length + 1) };
      active.push(layoutBlock);
      result.push(layoutBlock);
      const currentOverlap = active.length;
      active.forEach((e) => {
        e.overlapCount = Math.max(e.overlapCount, currentOverlap);
      });
    }
    return result;
  };

  const dayLayout = useMemo(() => {
    const entries: SlotLayoutInput[] = [];
    // Existing blocks for this day
    for (const sc of selectedCourses) {
      for (const slot of sc.selectedSection.timeSlots) {
        // use real day filter
        if (slot.day !== day) continue;
        const start = timeToMinutes(slot.startTime);
        const end = timeToMinutes(slot.endTime);
        entries.push({
          key: `course-${sc.course.courseCode}-${sc.selectedSection.sectionId}-${slot.startTime}-${slot.endTime}`,
          start,
          end,
          origin: 'course',
          course: sc,
          slot,
        });
      }
    }
    // Preview entries: treat times as occurring on this day (ignore original day)
    if (showDropShadow && draggedData) {
      draggedData.timeSlots.forEach((slot, idx) => {
        const start = timeToMinutes(slot.startTime);
        const end = timeToMinutes(slot.endTime);
        entries.push({
          key: `preview-${idx}-${slot.startTime}-${slot.endTime}`,
          start,
          end,
          origin: 'preview',
        });
      });
    }
    const laidOut = layoutDaySlots(entries);
    // Convert to computed styles
    const withStyle = laidOut.map((e) => {
      const top = ((e.start - TIMETABLE_CONFIG.startHour * 60) / 60) * slotHeight;
      const height = ((e.end - e.start) / 60) * slotHeight - 4;
      const adjustedTop = top + 2;
      const widthPercent = 100 / e.overlapCount;
      const style: CSSProperties = {
        top: `${adjustedTop}px`,
      height: `${height}px`,
      left: `calc(${widthPercent * e.lane}% + ${OVERLAP_GAP / 2}px)`,
      width: `calc(${widthPercent}% - ${OVERLAP_GAP}px)`,
    };
    return { ...e, style, overlapCount: e.overlapCount };
  });
  return withStyle;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourses, draggedData, showDropShadow, day, slotHeight]);

  const previewEntries = useMemo(
    () => dayLayout.filter((e) => e.origin === 'preview').map((e) => ({ style: e.style })),
    [dayLayout]
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-sm rounded-lg border transition-all duration-300',
        isOver && canDrop
          ? 'border-4 shadow-2xl ring-2 ring-offset-2' 
          : 'border border-gray-200/40 dark:border-gray-700/40',
        'overflow-hidden'
      )}
      style={{ 
  height: `${slotHeight * hours.length}px`,
  borderColor: isOver && canDrop && draggedData ? draggedData.color : undefined,
  backgroundColor: isOver && canDrop && draggedData ? `${draggedData.color ?? DEFAULT_COURSE_COLOR}15` : undefined,
      }}
    >
      {/* Hour grid lines */}
      {hours.slice(1).map((hour, idx) => (
        <div
          key={hour}
          className="absolute w-full border-t border-gray-100/50 dark:border-gray-800/50"
          style={{ top: `${(idx + 1) * slotHeight}px` }}
        />
      ))}

      {/* Drop shadow preview when dragging over */}
      {showDropShadow && draggedData && previewEntries.length > 0 && (
        <DropShadowPreview entries={previewEntries} color={draggedData.color ?? DEFAULT_COURSE_COLOR} />
      )}

      {/* Course blocks */}
      {dayLayout.filter(e => e.origin === 'course').map((entry, idx) => {
        const sc = entry.course!;
        const isDraggedSection =
          draggedCourseCode === sc.course.courseCode &&
          draggedSectionId === sc.selectedSection.sectionId;
        const blockId = `${sc.course.courseCode}-${sc.selectedSection.sectionId}-${day}-${idx}`;
        const style: CSSProperties = {
          ...entry.style,
          backgroundColor: sc.color ?? DEFAULT_COURSE_COLOR,
        };
        return (
          <DraggableCourseBlock
            key={blockId}
            selectedCourse={sc}
            blockId={blockId}
            style={style}
            slot={entry.slot!}
            slotHeight={slotHeight}
            overlapCount={entry.overlapCount}
            onRemove={onRemoveCourse}
            onClick={onCourseClick}
            conflictingCourses={conflictingCourses}
            isDraggedSection={isDraggedSection}
            isSmallScreen={isSmallScreen}
          />
        );
      })}
    </div>
  );
}

export function TimetableGridDraggable(props: TimetableGridDraggableProps) {
  const {
    selectedCourses,
    onCourseClick,
    onRemoveCourse,
    conflictingCourses = [],
    onDragEnd,
  } = props;
  const { startHour, endHour } = TIMETABLE_CONFIG;
  const [draggedData, setDraggedData] = useState<DraggedSectionData | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 640px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 640px)');
    const handler = (event: MediaQueryListEvent) => setIsSmallScreen(event.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handler);
    } else {
      media.addListener(handler);
    }
    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, []);

  const baseSlotHeight = TIMETABLE_CONFIG.slotHeight;
  const slotHeight = isSmallScreen ? baseSlotHeight * 1.35 : baseSlotHeight;
  const timeColWidth = isSmallScreen ? 56 : 70;
  
  // Generate hours array (8 AM to 9 PM)
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  
  // Use only weekdays for now (Mon-Fri)
  const displayDays = WEEKDAYS.slice(0, 5) as DayOfWeek[];
  const gridTemplateColumns = `${timeColWidth}px repeat(${displayDays.length}, minmax(0, 1fr))`;

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DraggedSectionData | undefined;
    if (data) {
      setDraggedData(data);
    }
  };

  const handleDragEndInternal = (event: DragEndEvent) => {
    const { /* active, */ over } = event;
    
    if (!over || !draggedData) {
      setDraggedData(null);
      return;
    }

    const dropData = over.data.current as { day?: DayOfWeek } | undefined;

    if (dropData?.day) {
      const newDay = dropData.day;
      onDragEnd(draggedData.courseCode, draggedData.sectionId, newDay);
    }

    setDraggedData(null);
  };

  return (
    <DndContext 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndInternal}
    >
      <div
        className="w-full bg-white/60 dark:bg-[#252526]/60 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden border border-gray-200/40 dark:border-gray-700/40"
        style={{ touchAction: draggedData ? 'none' : undefined }}
      >
        <div className="overflow-x-auto">
          <div className="min-w-0 sm:min-w-[600px] lg:min-w-0 w-full px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-3">
            {/* Header with days */}
            <div className="grid gap-1 sm:gap-1.5 lg:gap-2 mb-2" style={{ gridTemplateColumns }}>
              <div /> {/* Empty corner */}
              {displayDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-700 dark:text-gray-200 py-2 sm:py-2.5 lg:py-3 bg-white/50 dark:bg-[#2d2d30]/50 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/40 dark:border-gray-700/40"
                >
                  <div className="text-xs sm:text-sm lg:text-base">{day}</div>
                </div>
              ))}
            </div>

            {/* Timetable grid */}
            <div className="relative grid gap-1 sm:gap-1.5 lg:gap-2" style={{ gridTemplateColumns }}>
              {/* Time labels */}
              <div className="space-y-0">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="text-right pr-1.5 sm:pr-2 text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium"
                    style={{ height: `${slotHeight}px`, lineHeight: `${slotHeight}px` }}
                  >
                    {formatTime(`${hour}:00`)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {displayDays.map((day) => (
                <DroppableDayColumn
                  key={day}
                  day={day}
                  hours={hours}
                  slotHeight={slotHeight}
                  isSmallScreen={isSmallScreen}
                  selectedCourses={selectedCourses}
                  onRemoveCourse={onRemoveCourse}
                  onCourseClick={onCourseClick}
                  conflictingCourses={conflictingCourses}
                  draggedData={draggedData}
                  draggedCourseCode={draggedData?.courseCode}
                  draggedSectionId={draggedData?.sectionId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {draggedData && (
          <div
            className="rounded-lg text-white flex flex-col px-2 py-1.5 shadow-2xl opacity-90 border-2 border-white"
            style={{
              backgroundColor: draggedData.color ?? DEFAULT_COURSE_COLOR,
              width: '140px',
              minHeight: '60px',
            }}
          >
            <div className="font-semibold text-xs leading-tight">
              {draggedData.courseCode}
            </div>
            <div className="text-[10px] leading-tight opacity-90">
              {draggedData.sectionType === 'Lecture' ? 'LEC' : 'TUT'} {draggedData.sectionId}
            </div>
            <div className="text-[9px] leading-tight opacity-75 mt-0.5">
              {draggedData.timeSlots?.length || 0} session{draggedData.timeSlots?.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
