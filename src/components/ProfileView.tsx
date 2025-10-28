/**
 * Main profile view component with tabs for upcoming and historical bookings.
 */

import { useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingTabContent } from "@/components/BookingTabContent";
import { CancelBookingDialog } from "@/components/CancelBookingDialog";
import { useMyBookings } from "@/lib/hooks/useMyBookings";

export function ProfileView() {
  const {
    upcomingBookings,
    historicalBookings,
    isLoading,
    error,
    bookingToCancelId,
    fetchBookings,
    cancelBooking,
    openCancelDialog,
    closeCancelDialog,
  } = useMyBookings();

  // Pokazuj komunikat błędu jako toast
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const handleCancelBooking = async () => {
    try {
      await cancelBooking();
      toast.success("Rezerwacja została anulowana");
    } catch {
      toast.error("Nie udało się anulować rezerwacji. Spróbuj ponownie.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mój Profil</h1>
        <p className="text-muted-foreground">Zarządzaj swoimi rezerwacjami na zajęcia</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upcoming">Nadchodzące</TabsTrigger>
          <TabsTrigger value="historical">Historyczne</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <BookingTabContent
            status="UPCOMING"
            bookings={upcomingBookings}
            isLoading={isLoading}
            error={error}
            onFetch={fetchBookings}
            onCancelBooking={openCancelDialog}
          />
        </TabsContent>

        <TabsContent value="historical">
          <BookingTabContent
            status="PAST"
            bookings={historicalBookings}
            isLoading={isLoading}
            error={error}
            onFetch={fetchBookings}
            onCancelBooking={openCancelDialog}
          />
        </TabsContent>
      </Tabs>

      <CancelBookingDialog
        isOpen={bookingToCancelId !== null}
        onClose={closeCancelDialog}
        onConfirm={handleCancelBooking}
      />
    </div>
  );
}
