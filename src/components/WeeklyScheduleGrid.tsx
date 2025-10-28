/**
 * WeeklyScheduleGrid - Grid view showing full week with hourly time slots
 * Displays Mon-Sun in columns, 8:00-22:00 in rows, with weekends highlighted
 */

import type { ScheduleViewModel } from "@/lib/view-models";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface WeeklyScheduleGridProps {
  classes: ScheduleViewModel[];
  currentWeekStart: Date;
  onClassSelect: (classItem: ScheduleViewModel) => void;
}

// Time slots from 8:00 to 22:00
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 8);

// Day names in Polish
const DAY_NAMES = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

/**
 * Helper function to format time slot (e.g., "08:00")
 */
function formatTimeSlot(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Helper function to get date for a specific day of the week
 */
function getDateForDay(weekStart: Date, dayIndex: number): Date {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  return date;
}

/**
 * Helper function to format date (e.g., "23 paź")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/**
 * Helper function to check if date is weekend
 */
function isWeekend(dayIndex: number): boolean {
  return dayIndex === 5 || dayIndex === 6; // Saturday (5) or Sunday (6)
}

/**
 * Helper function to get hour from Date
 */
function getHour(date: Date): number {
  return date.getHours();
}

/**
 * Helper function to check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Groups classes by day and time slot
 */
function groupClassesByDayAndTime(classes: ScheduleViewModel[], weekStart: Date): Map<string, ScheduleViewModel[]> {
  const grouped = new Map<string, ScheduleViewModel[]>();

  classes.forEach((classItem) => {
    const startTime = new Date(classItem.start_time);
    const hour = getHour(startTime);

    // Find which day of the week this class falls on
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = getDateForDay(weekStart, dayIndex);
      if (isSameDay(startTime, dayDate)) {
        const key = `${dayIndex}-${hour}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        const keyClasses = grouped.get(key);
        if (keyClasses) {
          keyClasses.push(classItem);
        }
        break;
      }
    }
  });

  return grouped;
}

/**
 * Helper function to format time
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Compact class item for grid cells
 */
function CompactClassItem({ classItem, onClick }: { classItem: ScheduleViewModel; onClick: () => void }) {
  const isBooked = classItem.userStatus === "BOOKED";
  const isFull = classItem.isFull;
  const hasStarted = classItem.hasStarted;
  const classColor = classItem.class.color || "#3b82f6"; // Default to blue-500

  return (
    <button
      onClick={onClick}
      disabled={hasStarted}
      className={cn(
        "w-full text-left p-2 rounded-md text-xs transition-all cursor-pointer relative overflow-hidden",
        "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        hasStarted && "opacity-50 cursor-not-allowed"
      )}
      style={{
        backgroundColor: isBooked ? classColor : isFull ? `${classColor}20` : `${classColor}15`,
        borderLeft: `4px solid ${classColor}`,
        color: isBooked ? "#ffffff" : "inherit",
      }}
    >
      <div className="space-y-1">
        <div className={cn("font-semibold truncate", isBooked && "text-white")}>{classItem.class.name}</div>
        <div className={cn("text-xs", isBooked ? "text-white/90" : "text-muted-foreground")}>
          {formatTime(classItem.start_time)}
        </div>
        {classItem.instructor && (
          <div className={cn("text-xs truncate", isBooked ? "text-white/80" : "text-muted-foreground")}>
            {classItem.instructor.full_name}
          </div>
        )}
        <div className={cn("text-xs", isBooked ? "text-white/80" : "text-muted-foreground")}>
          {classItem.bookings_count}/{classItem.capacity}
          {isFull && !isBooked && " - Pełne"}
          {isBooked && " - Zapisany"}
        </div>
      </div>
    </button>
  );
}

export function WeeklyScheduleGrid({ classes, currentWeekStart, onClassSelect }: WeeklyScheduleGridProps) {
  // Group classes by day and time slot
  const groupedClasses = useMemo(
    () => groupClassesByDayAndTime(classes, currentWeekStart),
    [classes, currentWeekStart]
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with day names */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          {/* Empty corner cell for time column */}
          <div className="text-center font-semibold text-sm text-muted-foreground p-2">Godzina</div>

          {/* Day headers */}
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayDate = getDateForDay(currentWeekStart, dayIndex);
            const weekend = isWeekend(dayIndex);

            return (
              <div
                key={dayIndex}
                className={`text-center p-3 rounded-t-lg ${weekend ? "bg-muted/50" : "bg-background"}`}
              >
                <h3 className={`font-semibold text-sm ${weekend ? "text-primary" : ""}`}>{DAY_NAMES[dayIndex]}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(dayDate)}</p>
              </div>
            );
          })}
        </div>

        {/* Time slots grid */}
        <div className="space-y-1">
          {TIME_SLOTS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2">
              {/* Time label */}
              <div className="flex items-start justify-center pt-2">
                <span className="text-sm font-medium text-muted-foreground">{formatTimeSlot(hour)}</span>
              </div>

              {/* Day cells */}
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const key = `${dayIndex}-${hour}`;
                const dayClasses = groupedClasses.get(key) || [];
                const weekend = isWeekend(dayIndex);

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "min-h-[100px] p-2 rounded-lg border",
                      weekend ? "bg-muted/30 border-muted" : "bg-background border-border"
                    )}
                  >
                    {/* Classes in this time slot */}
                    <div className="space-y-2">
                      {dayClasses.map((classItem) => (
                        <CompactClassItem
                          key={classItem.id}
                          classItem={classItem}
                          onClick={() => onClassSelect(classItem)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
