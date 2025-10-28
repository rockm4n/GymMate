/**
 * useSchedule - Custom hook for managing schedule view state and data
 * Handles fetching scheduled classes, user bookings, and provides actions for booking management
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { ScheduleViewModel } from "../view-models";
import type { ScheduledClassDto, BookingDto } from "../../types";

interface UseScheduleReturn {
  // State
  currentWeekStartDate: Date;
  scheduledClasses: ScheduleViewModel[];
  isLoading: boolean;
  error: Error | null;
  selectedClass: ScheduleViewModel | null;

  // Actions
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  selectClass: (classItem: ScheduleViewModel | null) => void;
  bookClass: (classId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  joinWaitingList: (classId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Helper function to get the start of the week (Monday) for a given date
 * Uses UTC methods to avoid timezone issues
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0); // Set to start of day in UTC
  return d;
}

/**
 * Helper function to get the end of the week (Sunday) for a given date
 * Uses UTC methods to avoid timezone issues
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Helper function to add days to a date
 * Uses UTC methods to avoid timezone issues
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Transforms ScheduledClassDto and BookingDto arrays into ScheduleViewModel array
 */
function transformToViewModel(scheduledClasses: ScheduledClassDto[], userBookings: BookingDto[]): ScheduleViewModel[] {
  const now = new Date();
  const bookingMap = new Map(userBookings.map((b) => [b.scheduled_class.id, b]));

  return scheduledClasses.map((scheduledClass) => {
    const booking = bookingMap.get(scheduledClass.id);
    const startTime = new Date(scheduledClass.start_time);
    const isFull = scheduledClass.bookings_count >= scheduledClass.capacity;
    const hasStarted = startTime < now;
    const userStatus = booking ? "BOOKED" : "AVAILABLE";

    // Calculate if cancellable (more than 8 hours before start)
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isCancellable = userStatus === "BOOKED" && hoursUntilStart > 8;

    const viewModel: ScheduleViewModel = {
      ...scheduledClass,
      userStatus,
      bookingId: booking?.id || null,
      waitingListEntryId: null, // TODO: Add waiting list support
      isFull,
      hasStarted,
      isBookable: !isFull && !hasStarted && userStatus === "AVAILABLE",
      isCancellable,
      isWaitlistable: isFull && !hasStarted && userStatus === "AVAILABLE",
    };

    return viewModel;
  });
}

export function useSchedule(): UseScheduleReturn {
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<Date>(() => getWeekStart(new Date()));
  const [scheduledClasses, setScheduledClasses] = useState<ScheduleViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedClass, setSelectedClass] = useState<ScheduleViewModel | null>(null);

  /**
   * Fetches scheduled classes and user bookings for the current week
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const weekStart = getWeekStart(currentWeekStartDate);
      const weekEnd = getWeekEnd(currentWeekStartDate);

      // Fetch scheduled classes and user bookings in parallel
      const [classesResponse, bookingsResponse] = await Promise.all([
        fetch(`/api/scheduled-classes?start_time=${weekStart.toISOString()}&end_time=${weekEnd.toISOString()}`),
        fetch("/api/bookings/my?status=UPCOMING"),
      ]);

      if (!classesResponse.ok) {
        throw new Error("Failed to fetch scheduled classes");
      }

      // Bookings endpoint requires authentication, but we handle 401 gracefully
      let userBookings: BookingDto[] = [];
      if (bookingsResponse.ok) {
        userBookings = await bookingsResponse.json();
      } else if (bookingsResponse.status !== 401) {
        throw new Error("Failed to fetch user bookings");
      }

      const scheduledClassesData: ScheduledClassDto[] = await classesResponse.json();

      // Transform data to view models
      const viewModels = transformToViewModel(scheduledClassesData, userBookings);
      setScheduledClasses(viewModels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStartDate]);

  /**
   * Fetch data when component mounts or week changes
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Navigate to next week
   */
  const goToNextWeek = useCallback(() => {
    setCurrentWeekStartDate((prev) => addDays(prev, 7));
  }, []);

  /**
   * Navigate to previous week
   */
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStartDate((prev) => addDays(prev, -7));
  }, []);

  /**
   * Select a class to view details
   */
  const selectClass = useCallback((classItem: ScheduleViewModel | null) => {
    setSelectedClass(classItem);
  }, []);

  /**
   * Book a class
   */
  const bookClass = useCallback(
    async (classId: string) => {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scheduled_class_id: classId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to book class");
        }

        // Show success toast
        toast.success("Rezerwacja zakończona sukcesem!", {
          description: "Zostałeś zapisany na zajęcia.",
        });

        // Refetch data to update the view
        await fetchData();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        toast.error("Nie udało się zarezerwować zajęć", {
          description: errorMessage,
        });
        throw err instanceof Error ? err : new Error("An unknown error occurred");
      }
    },
    [fetchData]
  );

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(
    async (bookingId: string) => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to cancel booking");
        }

        // Show success toast
        toast.success("Rezerwacja anulowana", {
          description: "Twoja rezerwacja została pomyślnie anulowana.",
        });

        // Refetch data to update the view
        await fetchData();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        toast.error("Nie udało się anulować rezerwacji", {
          description: errorMessage,
        });
        throw err instanceof Error ? err : new Error("An unknown error occurred");
      }
    },
    [fetchData]
  );

  /**
   * Join waiting list for a class
   */
  const joinWaitingList = useCallback(
    async (classId: string) => {
      try {
        const response = await fetch("/api/waiting-list-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scheduled_class_id: classId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to join waiting list");
        }

        // Show success toast
        toast.success("Dołączono do listy oczekujących", {
          description: "Powiadomimy Cię, gdy zwolni się miejsce.",
        });

        // Refetch data to update the view
        await fetchData();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        toast.error("Nie udało się dołączyć do listy oczekujących", {
          description: errorMessage,
        });
        throw err instanceof Error ? err : new Error("An unknown error occurred");
      }
    },
    [fetchData]
  );

  return {
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
    refetch: fetchData,
  };
}
