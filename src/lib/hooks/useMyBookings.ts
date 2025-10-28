/**
 * Custom hook for managing user bookings.
 * Handles fetching, state management, and cancellation logic.
 */

import { useState, useCallback, useEffect } from "react";
import type { BookingDto, BookingViewModel } from "@/types";
import { transformBookingToViewModel } from "@/lib/view-models";

interface UseMyBookingsReturn {
  upcomingBookings: BookingViewModel[];
  historicalBookings: BookingViewModel[];
  isLoading: boolean;
  error: Error | null;
  bookingToCancelId: string | null;
  fetchBookings: (status: "UPCOMING" | "PAST") => Promise<void>;
  cancelBooking: () => Promise<void>;
  openCancelDialog: (bookingId: string) => void;
  closeCancelDialog: () => void;
}

export function useMyBookings(): UseMyBookingsReturn {
  const [upcomingBookings, setUpcomingBookings] = useState<BookingViewModel[]>([]);
  const [historicalBookings, setHistoricalBookings] = useState<BookingViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [bookingToCancelId, setBookingToCancelId] = useState<string | null>(null);

  /**
   * Fetches bookings from the API based on status.
   */
  const fetchBookings = useCallback(async (status: "UPCOMING" | "PAST") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/my?status=${status}`);

      if (!response.ok) {
        throw new Error(`Nie udało się pobrać rezerwacji: ${response.statusText}`);
      }

      const data: BookingDto[] = await response.json();
      const viewModels = data.map(transformBookingToViewModel);

      if (status === "UPCOMING") {
        setUpcomingBookings(viewModels);
      } else {
        setHistoricalBookings(viewModels);
      }
    } catch (err) {
      setError(new Error("Nieznany błąd"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cancels the booking that was selected for cancellation.
   */
  const cancelBooking = useCallback(async () => {
    if (!bookingToCancelId) return;

    const bookingId = bookingToCancelId;

    // Optymistyczna aktualizacja UI - usuwamy rezerwację z listy
    setUpcomingBookings((prev) => prev.filter((b) => b.id !== bookingId));
    closeCancelDialog();

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Nie udało się anulować rezerwacji: ${response.statusText}`);
      }
    } catch (err) {
      // W przypadku błędu, przywróć rezerwację na listę
      await fetchBookings("UPCOMING");
      setError(new Error("Nieznany błąd"));
    }
  }, [bookingToCancelId, fetchBookings]);

  /**
   * Opens the cancel confirmation dialog for a specific booking.
   */
  const openCancelDialog = useCallback((bookingId: string) => {
    setBookingToCancelId(bookingId);
  }, []);

  /**
   * Closes the cancel confirmation dialog.
   */
  const closeCancelDialog = useCallback(() => {
    setBookingToCancelId(null);
  }, []);

  return {
    upcomingBookings,
    historicalBookings,
    isLoading,
    error,
    bookingToCancelId,
    fetchBookings,
    cancelBooking,
    openCancelDialog,
    closeCancelDialog,
  };
}

