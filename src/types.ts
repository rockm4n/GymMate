/**
 * This file contains shared types for the application, including entities,
 * Data Transfer Objects (DTOs), and Command Models.
 *
 * These types are derived from the database schema to ensure consistency
 * between the backend and frontend.
 */

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// #region Database Entities
// These types represent the raw data structure from the database tables.

export type Profile = Tables<"profiles">;
export type Instructor = Tables<"instructors">;
export type ClassCategory = Tables<"class_categories">;
export type Class = Tables<"classes">;
export type ScheduledClass = Tables<"scheduled_classes">;
export type Booking = Tables<"bookings">;
export type WaitingListEntry = Tables<"waiting_list">;

// #endregion

// #region Data Transfer Objects (DTOs)
// DTOs represent the shape of data sent from the server to the client.

/**
 * DTO for a user's profile information.
 * Omits sensitive or unnecessary fields like 'updated_at'.
 */
export type ProfileDto = Omit<Profile, "updated_at">;

/**
 * DTO for a scheduled class, including related class and instructor details,
 * and the current number of bookings. This is a composite type built for client-side display.
 */
export type ScheduledClassDto = Pick<ScheduledClass, "id" | "start_time" | "end_time" | "capacity" | "status"> & {
  class: Pick<Class, "id" | "name" | "color">;
  instructor: Pick<Instructor, "id" | "full_name"> | null;
  bookings_count: number;
};

/**
 * DTO for a user's booking, with nested details about the scheduled class.
 */
export type BookingDto = Pick<Booking, "id" | "created_at"> & {
  scheduled_class: Pick<ScheduledClass, "id" | "start_time" | "end_time"> & {
    class: Pick<Class, "id" | "name" | "color">;
    instructor: Pick<Instructor, "full_name"> | null;
  };
};

/**
 * DTO for a waiting list entry.
 * Based on the assumption it returns the core details of the entry.
 */
export type WaitingListEntryDto = Pick<WaitingListEntry, "id" | "created_at" | "scheduled_class_id">;

/**
 * DTO for the admin dashboard, containing aggregated Key Performance Indicators (KPIs).
 * This is a custom shape not directly mapped to a single database table.
 */
export interface AdminDashboardDto {
  today_occupancy_rate: number;
  total_waiting_list_count: number;
  most_popular_classes: {
    name: Class["name"];
    booking_count: number;
  }[];
}

// #endregion

// #region View Models
// View Models extend DTOs with computed properties for UI display.

/**
 * View Model for a booking, extending BookingDto with computed properties
 * for easier rendering and logic in components.
 */
export interface BookingViewModel {
  id: string;                      // ID rezerwacji
  className: string;               // Nazwa zajęć
  instructorName: string | null;   // Imię i nazwisko instruktora
  startTime: Date;                 // Czas rozpoczęcia jako obiekt Date
  endTime: Date;                   // Czas zakończenia jako obiekt Date
  formattedDate: string;           // Sformatowana data, np. "20 października 2025"
  formattedTime: string;           // Sformatowany czas, np. "09:00 - 10:00"
  isCancellable: boolean;          // Flaga, czy rezerwację można anulować
  isHistorical: boolean;           // Flaga, czy rezerwacja jest historyczna
}

// #endregion

// #region Command Models
// Command Models represent the shape of data sent from the client to the server for CUD operations.

/**
 * Command for updating a user's profile.
 * Only 'full_name' is exposed for modification.
 */
export type UpdateProfileCommand = Pick<TablesUpdate<"profiles">, "full_name">;

/**
 * Command for creating a new booking for a scheduled class.
 */
export type CreateBookingCommand = Pick<TablesInsert<"bookings">, "scheduled_class_id">;

/**
 * Command for adding a user to a waiting list for a scheduled class.
 */
export type CreateWaitingListEntryCommand = Pick<TablesInsert<"waiting_list">, "scheduled_class_id">;

/**
 * Command for creating a new scheduled class (Admin operation).
 */
export type CreateScheduledClassCommand = Pick<
  TablesInsert<"scheduled_classes">,
  "class_id" | "instructor_id" | "start_time" | "end_time" | "capacity"
>;

/**
 * Command for updating a scheduled class (Admin operation).
 * Allows modification of instructor, status, capacity, and times.
 */
export type UpdateScheduledClassCommand = Pick<
  TablesUpdate<"scheduled_classes">,
  "instructor_id" | "status" | "capacity" | "start_time" | "end_time"
>;

// #endregion
