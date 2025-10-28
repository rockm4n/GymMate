/**
 * Renders a list of booking items.
 */

import { BookingListItem } from "@/components/BookingListItem";
import type { BookingViewModel } from "@/types";

interface BookingListProps {
  bookings: BookingViewModel[];
  onCancelClick: (bookingId: string) => void;
}

export function BookingList({ bookings, onCancelClick }: BookingListProps) {
  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingListItem key={booking.id} booking={booking} onCancelClick={onCancelClick} />
      ))}
    </div>
  );
}
