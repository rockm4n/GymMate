/**
 * Displays a single booking item with details and cancel button.
 */

import { Button } from "@/components/ui/button";
import type { BookingViewModel } from "@/types";

interface BookingListItemProps {
  booking: BookingViewModel;
  onCancelClick: (bookingId: string) => void;
}

export function BookingListItem({ booking, onCancelClick }: BookingListItemProps) {
  const handleCancelClick = () => {
    onCancelClick(booking.id);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-lg">{booking.className}</h3>
          {booking.instructorName && (
            <p className="text-sm text-muted-foreground">
              Instruktor: {booking.instructorName}
            </p>
          )}
        </div>
        
        {!booking.isHistorical && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelClick}
            disabled={!booking.isCancellable}
            title={
              !booking.isCancellable
                ? "Rezerwację można anulować najpóźniej 8 godzin przed rozpoczęciem"
                : "Anuluj rezerwację"
            }
          >
            Anuluj
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{booking.formattedDate}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{booking.formattedTime}</span>
        </div>
      </div>
      
      {!booking.isCancellable && !booking.isHistorical && (
        <p className="text-xs text-muted-foreground italic">
          Anulowanie możliwe najpóźniej 8 godzin przed zajęciami
        </p>
      )}
    </div>
  );
}

