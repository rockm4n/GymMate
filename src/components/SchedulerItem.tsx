/**
 * SchedulerItem - Represents a single class block in the schedule
 */

import type { ScheduleViewModel } from "../lib/view-models";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SchedulerItemProps {
  classItem: ScheduleViewModel;
  onClick?: () => void;
}

/**
 * Helper function to format time from ISO string
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Get background color class based on user status
 */
function getStatusColor(userStatus: ScheduleViewModel["userStatus"]): string {
  switch (userStatus) {
    case "BOOKED":
      return "bg-primary/10 border-primary hover:bg-primary/20";
    case "WAITING_LIST":
      return "bg-amber-50 border-amber-300 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800 dark:hover:bg-amber-900";
    case "AVAILABLE":
      return "bg-card border-border hover:bg-accent";
  }
}

/**
 * Get status badge
 */
function getStatusBadge(classItem: ScheduleViewModel): React.ReactNode {
  if (classItem.userStatus === "BOOKED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
        Zapisany
      </span>
    );
  }
  if (classItem.userStatus === "WAITING_LIST") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500 text-white dark:bg-amber-600">
        Lista oczekujących
      </span>
    );
  }
  if (classItem.isFull) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive dark:bg-destructive/20">
        Pełne
      </span>
    );
  }
  if (classItem.hasStarted) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
        Rozpoczęte
      </span>
    );
  }
  return null;
}

export function SchedulerItem({ classItem, onClick }: SchedulerItemProps) {
  const occupancyPercentage = (classItem.bookings_count / classItem.capacity) * 100;
  const statusColor = getStatusColor(classItem.userStatus);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        statusColor,
        classItem.hasStarted && "opacity-60"
      )}
      disabled={classItem.hasStarted}
    >
      <div className="space-y-3">
        {/* Header with time and status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{classItem.class.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
            </p>
          </div>
          {getStatusBadge(classItem)}
        </div>

        {/* Instructor */}
        {classItem.instructor && (
          <p className="text-sm text-muted-foreground">
            Instruktor: <span className="font-medium text-foreground">{classItem.instructor.full_name}</span>
          </p>
        )}

        {/* Occupancy progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Obłożenie</span>
            <span>
              {classItem.bookings_count} / {classItem.capacity}
            </span>
          </div>
          <Progress value={occupancyPercentage} className="h-2" />
        </div>
      </div>
    </button>
  );
}

