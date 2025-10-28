/**
 * ClassDetailsModal - Modal displaying full information about selected class
 */

import { useState } from "react";
import type { ScheduleViewModel } from "../lib/view-models";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, User, Users, Loader2 } from "lucide-react";

interface ClassDetailsModalProps {
  classItem: ScheduleViewModel | null;
  onClose: () => void;
  onBook: (classId: string) => Promise<void>;
  onCancel: (bookingId: string) => Promise<void>;
  onJoinWaitingList: (classId: string) => Promise<void>;
}

/**
 * Helper function to format date
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Helper function to format time
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function ClassDetailsModal({ classItem, onClose, onBook, onCancel, onJoinWaitingList }: ClassDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!classItem) {
    return null;
  }

  const occupancyPercentage = (classItem.bookings_count / classItem.capacity) * 100;

  /**
   * Handle booking action
   */
  const handleBook = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await onBook(classItem.id);
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nie udało się zarezerwować zajęć");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel booking action
   */
  const handleCancel = async () => {
    if (!classItem.bookingId) return;

    setIsLoading(true);
    setActionError(null);
    try {
      await onCancel(classItem.bookingId);
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nie udało się anulować rezerwacji");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle join waiting list action
   */
  const handleJoinWaitingList = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await onJoinWaitingList(classItem.id);
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nie udało się dołączyć do listy oczekujących");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={!!classItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{classItem.class.name}</DialogTitle>
          <DialogDescription>Szczegóły zajęć</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(classItem.start_time)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
              </span>
            </div>
          </div>

          {/* Instructor */}
          {classItem.instructor && (
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                Instruktor: <span className="font-medium">{classItem.instructor.full_name}</span>
              </span>
            </div>
          )}

          {/* Occupancy */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                Obłożenie: {classItem.bookings_count} / {classItem.capacity}
              </span>
            </div>
            <Progress value={occupancyPercentage} className="h-2" />
          </div>

          {/* Status Badge */}
          {classItem.userStatus === "BOOKED" && (
            <div className="rounded-lg bg-primary/10 border border-primary p-3 text-sm">
              <p className="font-medium text-primary">Jesteś zapisany na te zajęcia</p>
            </div>
          )}

          {classItem.userStatus === "WAITING_LIST" && (
            <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm dark:bg-amber-950 dark:border-amber-800">
              <p className="font-medium text-amber-700 dark:text-amber-400">Jesteś na liście oczekujących</p>
            </div>
          )}

          {classItem.isFull && classItem.userStatus === "AVAILABLE" && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
              <p className="font-medium text-destructive">Zajęcia są pełne</p>
              <p className="text-muted-foreground mt-1">
                Możesz dołączyć do listy oczekujących, aby otrzymać powiadomienie o wolnym miejscu.
              </p>
            </div>
          )}

          {classItem.hasStarted && (
            <div className="rounded-lg bg-muted border p-3 text-sm">
              <p className="font-medium text-muted-foreground">Zajęcia już się rozpoczęły</p>
            </div>
          )}

          {/* Error message */}
          {actionError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive p-3 text-sm">
              <p className="font-medium text-destructive">{actionError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Cancel Booking Button */}
          {classItem.isCancellable && (
            <Button variant="destructive" onClick={handleCancel} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anulowanie...
                </>
              ) : (
                "Anuluj rezerwację"
              )}
            </Button>
          )}

          {/* Book Button */}
          {classItem.isBookable && (
            <Button onClick={handleBook} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rezerwowanie...
                </>
              ) : (
                "Zarezerwuj"
              )}
            </Button>
          )}

          {/* Join Waiting List Button */}
          {classItem.isWaitlistable && (
            <Button
              variant="secondary"
              onClick={handleJoinWaitingList}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dołączanie...
                </>
              ) : (
                "Dołącz do listy oczekujących"
              )}
            </Button>
          )}

          {/* Close Button (always visible) */}
          {!classItem.isBookable && !classItem.isCancellable && !classItem.isWaitlistable && (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Zamknij
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
