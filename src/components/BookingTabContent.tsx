/**
 * Component responsible for fetching and displaying bookings for a given status.
 */

import { useEffect } from "react";
import { BookingList } from "@/components/BookingList";
import { EmptyState } from "@/components/EmptyState";
import type { BookingViewModel } from "@/types";

interface BookingTabContentProps {
  status: "UPCOMING" | "PAST";
  bookings: BookingViewModel[];
  isLoading: boolean;
  error: Error | null;
  onFetch: (status: "UPCOMING" | "PAST") => Promise<void>;
  onCancelBooking: (bookingId: string) => void;
}

export function BookingTabContent({
  status,
  bookings,
  isLoading,
  error,
  onFetch,
  onCancelBooking,
}: BookingTabContentProps) {
  useEffect(() => {
    onFetch(status);
  }, [status, onFetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-destructive/10 p-6 mb-4">
          <svg
            className="w-12 h-12 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-destructive text-lg font-medium mb-2">
          Wystąpił błąd
        </p>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    const message =
      status === "UPCOMING"
        ? "Brak nadchodzących rezerwacji"
        : "Brak przeszłych rezerwacji";
    return <EmptyState message={message} />;
  }

  return <BookingList bookings={bookings} onCancelClick={onCancelBooking} />;
}

