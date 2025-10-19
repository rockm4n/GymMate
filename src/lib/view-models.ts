/**
 * This file contains View Models for the application.
 * View Models extend DTOs with UI-specific state and logic.
 */

import type { ScheduledClassDto } from "../types";

/**
 * Extends ScheduledClassDto with state specific to the logged-in user
 * and flags to facilitate UI logic.
 */
export type ScheduleViewModel = ScheduledClassDto & {
  // Status of the logged-in user relative to this class
  userStatus: "BOOKED" | "WAITING_LIST" | "AVAILABLE";

  // IDs of booking or waiting list entry, needed for cancellation
  bookingId: string | null;
  waitingListEntryId: string | null;

  // Boolean flags to control UI logic
  isFull: boolean; // Is the class full? (bookings_count >= capacity)
  hasStarted: boolean; // Has the class already started? (start_time < now)
  isBookable: boolean; // Can the user book? (!isFull && !hasStarted && userStatus === 'AVAILABLE')
  isCancellable: boolean; // Can the user cancel booking? (userStatus === 'BOOKED' && start_time > 8 hours from now)
  isWaitlistable: boolean; // Can the user join waiting list? (isFull && !hasStarted && userStatus === 'AVAILABLE')
};

