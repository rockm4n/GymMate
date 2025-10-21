/**
 * Confirmation dialog for canceling a booking.
 * Uses AlertDialog from Shadcn/ui.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CancelBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelBookingDialog({
  isOpen,
  onClose,
  onConfirm,
}: CancelBookingDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz anulować rezerwację?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja nie może być cofnięta. Twoja rezerwacja zostanie usunięta
            i miejsce będzie dostępne dla innych użytkowników.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Potwierdź anulowanie
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

