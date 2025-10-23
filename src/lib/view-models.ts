/**
 * Utility functions for transforming DTOs to View Models.
 */

import type { BookingDto, BookingViewModel, ScheduledClassDto } from "@/types";

/**
 * ScheduleViewModel extends ScheduledClassDto with computed UI properties
 */
export type ScheduleViewModel = ScheduledClassDto & {
  userStatus: "BOOKED" | "AVAILABLE";
  bookingId: string | null;
  waitingListEntryId: string | null;
  isFull: boolean;
  hasStarted: boolean;
  isBookable: boolean;
  isCancellable: boolean;
  isWaitlistable: boolean;
};

/**
 * Transforms a BookingDto into a BookingViewModel with computed properties.
 */
export function transformBookingToViewModel(booking: BookingDto): BookingViewModel {
  const startTime = new Date(booking.scheduled_class.start_time);
  const endTime = new Date(booking.scheduled_class.end_time);
  const now = new Date();

  // Rezerwacja jest anulowalna jeśli do startu zostało więcej niż 8 godzin
  const cancellationDeadline = new Date(startTime.getTime() - 8 * 60 * 60 * 1000);
  const isCancellable = now < cancellationDeadline;

  // Rezerwacja jest historyczna jeśli czas rozpoczęcia minął (zgodnie z logiką API)
  const isHistorical = startTime < now;

  // Formatowanie daty w polskim formacie
  const formattedDate = startTime.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Formatowanie czasu
  const formattedTime = `${startTime.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endTime.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return {
    id: booking.id,
    className: booking.scheduled_class.class.name,
    instructorName: booking.scheduled_class.instructor?.full_name ?? null,
    startTime,
    endTime,
    formattedDate,
    formattedTime,
    isCancellable,
    isHistorical,
  };
}
