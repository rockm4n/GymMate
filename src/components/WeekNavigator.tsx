/**
 * WeekNavigator - Displays current week range and navigation buttons
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigatorProps {
  currentWeek: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

/**
 * Helper function to format date range for display
 */
function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = weekStart.toLocaleDateString("pl-PL", options);
  const endStr = weekEnd.toLocaleDateString("pl-PL", options);
  const year = weekStart.getFullYear();

  return `${startStr} - ${endStr}, ${year}`;
}

export function WeekNavigator({ currentWeek, onPreviousWeek, onNextWeek }: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="outline" size="icon" onClick={onPreviousWeek} aria-label="Poprzedni tydzień">
        <ChevronLeft />
      </Button>

      <h2 className="text-xl font-semibold">{formatWeekRange(currentWeek)}</h2>

      <Button variant="outline" size="icon" onClick={onNextWeek} aria-label="Następny tydzień">
        <ChevronRight />
      </Button>
    </div>
  );
}
