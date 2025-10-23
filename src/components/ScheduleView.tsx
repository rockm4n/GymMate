/**
 * ScheduleView - Main container for the schedule view
 * Manages state, fetches data from API, and coordinates child components
 */

import { useSchedule } from "@/lib/hooks/useSchedule";
import { WeekNavigator } from "./WeekNavigator";
import { Scheduler } from "./Scheduler";
import { ClassDetailsModal } from "./ClassDetailsModal";
import { Button } from "@/components/ui/button";

export function ScheduleView() {
  const {
    currentWeekStartDate,
    scheduledClasses,
    isLoading,
    error,
    selectedClass,
    goToNextWeek,
    goToPreviousWeek,
    selectClass,
    bookClass,
    cancelBooking,
    joinWaitingList,
    refetch,
  } = useSchedule();

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Wystąpił błąd</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
          </div>
          <Button onClick={refetch}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Harmonogram zajęć</h1>

      <WeekNavigator
        currentWeek={currentWeekStartDate}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie harmonogramu...</p>
          </div>
        </div>
      ) : (
        <Scheduler
          classes={scheduledClasses}
          currentWeekStart={currentWeekStartDate}
          onClassSelect={selectClass}
        />
      )}

      <ClassDetailsModal
        classItem={selectedClass}
        onClose={() => selectClass(null)}
        onBook={bookClass}
        onCancel={cancelBooking}
        onJoinWaitingList={joinWaitingList}
      />
    </div>
  );
}

