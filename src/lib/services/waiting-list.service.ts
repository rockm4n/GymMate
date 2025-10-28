import type { SupabaseClient } from "../../db/supabase.client";
import type { WaitingListEntryDto, CreateWaitingListEntryCommand } from "../../types";

/**
 * Error types for waiting list operations
 */
export class WaitingListError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "CLASS_NOT_FULL" | "ALREADY_ON_WAITING_LIST" | "ALREADY_BOOKED" | "DATABASE_ERROR"
  ) {
    super(message);
    this.name = "WaitingListError";
  }
}

/**
 * Creates a new waiting list entry for a user on a scheduled class.
 * This function validates that:
 * - The scheduled class exists
 * - The class is fully booked (capacity reached)
 * - The user is not already booked for this class
 * - The user is not already on the waiting list for this class
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user joining the waiting list
 * @param command - Command object containing scheduled_class_id
 * @returns WaitingListEntryDto with the created entry
 * @throws WaitingListError with appropriate error code
 */
export async function createWaitingListEntry(
  supabase: SupabaseClient,
  userId: string,
  command: CreateWaitingListEntryCommand
): Promise<WaitingListEntryDto> {
  const { scheduled_class_id } = command;

  // Step 1: Check if the scheduled class exists and get its capacity info
  const { data: scheduledClass, error: classError } = await supabase
    .from("scheduled_classes")
    .select("id, capacity, status")
    .eq("id", scheduled_class_id)
    .single();

  if (classError || !scheduledClass) {
    throw new WaitingListError(`Scheduled class with ID ${scheduled_class_id} not found`, "NOT_FOUND");
  }

  // Step 2: Check if the class is available (not cancelled or completed)
  if (scheduledClass.status !== "scheduled") {
    throw new WaitingListError("Cannot join waiting list for a class that is not scheduled", "CLASS_NOT_FULL");
  }

  // Step 3: Check if user is already booked for this class
  const { data: existingBooking, error: bookingCheckError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("scheduled_class_id", scheduled_class_id)
    .maybeSingle();

  if (bookingCheckError) {
    throw new WaitingListError(`Failed to check existing bookings: ${bookingCheckError.message}`, "DATABASE_ERROR");
  }

  if (existingBooking) {
    throw new WaitingListError("You are already booked for this class", "ALREADY_BOOKED");
  }

  // Step 4: Check if the class is full
  const { count: bookingsCount, error: countError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("scheduled_class_id", scheduled_class_id);

  if (countError) {
    throw new WaitingListError(`Failed to check class capacity: ${countError.message}`, "DATABASE_ERROR");
  }

  // If capacity is set and class is not full, user cannot join waiting list
  if (scheduledClass.capacity !== null && (bookingsCount ?? 0) < scheduledClass.capacity) {
    throw new WaitingListError(
      "Cannot join waiting list. The class still has available spots. Please book directly instead.",
      "CLASS_NOT_FULL"
    );
  }

  // Step 5: Check if user is already on the waiting list
  const { data: existingWaitingListEntry, error: waitingListCheckError } = await supabase
    .from("waiting_list")
    .select("id")
    .eq("user_id", userId)
    .eq("scheduled_class_id", scheduled_class_id)
    .maybeSingle();

  if (waitingListCheckError) {
    throw new WaitingListError(`Failed to check waiting list: ${waitingListCheckError.message}`, "DATABASE_ERROR");
  }

  if (existingWaitingListEntry) {
    throw new WaitingListError("You are already on the waiting list for this class", "ALREADY_ON_WAITING_LIST");
  }

  // Step 6: Insert the new waiting list entry
  const { data: newEntry, error: insertError } = await supabase
    .from("waiting_list")
    .insert({
      user_id: userId,
      scheduled_class_id: scheduled_class_id,
    })
    .select("id, created_at, scheduled_class_id")
    .single();

  if (insertError || !newEntry) {
    throw new WaitingListError(
      `Failed to create waiting list entry: ${insertError?.message ?? "Unknown error"}`,
      "DATABASE_ERROR"
    );
  }

  // Return the DTO
  return {
    id: newEntry.id,
    created_at: newEntry.created_at,
    scheduled_class_id: newEntry.scheduled_class_id,
  };
}
