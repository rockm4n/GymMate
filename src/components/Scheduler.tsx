/**
 * Scheduler - Renders the schedule as a timeline (grid on desktop, list on mobile)
 */

import type { ScheduleViewModel } from "../lib/view-models";
import { SchedulerItem } from "./SchedulerItem";

interface SchedulerProps {
  classes: ScheduleViewModel[];
  onClassSelect: (classItem: ScheduleViewModel) => void;
}

/**
 * Helper function to get day name in Polish
 */
function getDayName(date: Date): string {
  return date.toLocaleDateString("pl-PL", { weekday: "long" });
}

/**
 * Helper function to get short date format
 */
function getShortDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/**
 * Group classes by day
 */
function groupClassesByDay(classes: ScheduleViewModel[]): Map<string, ScheduleViewModel[]> {
  const grouped = new Map<string, ScheduleViewModel[]>();

  classes.forEach((classItem) => {
    const date = new Date(classItem.start_time);
    const dayKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, []);
    }
    grouped.get(dayKey)!.push(classItem);
  });

  // Sort classes within each day by start time
  grouped.forEach((dayClasses) => {
    dayClasses.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  });

  return grouped;
}

export function Scheduler({ classes, onClassSelect }: SchedulerProps) {
  // Handle empty state
  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-2">Brak zajęć w tym tygodniu</p>
          <p className="text-sm text-muted-foreground">Sprawdź inny tydzień lub wróć później</p>
        </div>
      </div>
    );
  }

  const groupedClasses = groupClassesByDay(classes);
  const sortedDays = Array.from(groupedClasses.keys()).sort();

  return (
    <div className="space-y-8">
      {/* Desktop view: Grid layout */}
      <div className="hidden md:grid md:grid-cols-7 gap-4">
        {sortedDays.map((dayKey) => {
          const dayClasses = groupedClasses.get(dayKey)!;
          const date = new Date(dayKey);

          return (
            <div key={dayKey} className="space-y-3">
              {/* Day header */}
              <div className="text-center pb-2 border-b">
                <h3 className="font-semibold capitalize">{getDayName(date)}</h3>
                <p className="text-sm text-muted-foreground">{getShortDate(date)}</p>
              </div>

              {/* Classes for this day */}
              <div className="space-y-3">
                {dayClasses.map((classItem) => (
                  <SchedulerItem
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

      {/* Mobile view: List layout */}
      <div className="md:hidden space-y-6">
        {sortedDays.map((dayKey) => {
          const dayClasses = groupedClasses.get(dayKey)!;
          const date = new Date(dayKey);

          return (
            <div key={dayKey} className="space-y-3">
              {/* Day header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-semibold text-lg capitalize">{getDayName(date)}</h3>
                <p className="text-sm text-muted-foreground">{getShortDate(date)}</p>
              </div>

              {/* Classes for this day */}
              <div className="space-y-3">
                {dayClasses.map((classItem) => (
                  <SchedulerItem
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
    </div>
  );
}

