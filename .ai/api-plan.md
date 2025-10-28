# REST API Plan

## 1. Resources

- **Profiles**: Represents user profiles, extending Supabase `auth.users`. (Corresponds to `profiles` table).
- **Instructors**: Represents class instructors. (Corresponds to `instructors` table).
- **Class Categories**: Represents categories for different classes. (Corresponds to `class_categories` table).
- **Classes**: Represents the general definitions of classes offered. (Corresponds to `classes` table).
- **Scheduled Classes**: Represents specific instances of classes on the schedule. (Corresponds to `scheduled_classes` table).
- **Bookings**: Represents a user's booking for a scheduled class. (Corresponds to `bookings` table).
- **Waiting List Entries**: Represents a user's entry on a waiting list for a full class. (Corresponds to `waiting_list` table).
- **Dashboard**: A virtual resource for aggregating admin-level KPIs.

## 2. Endpoints

### Profiles

#### GET /api/profiles/me

- **Description**: Get the profile of the currently authenticated user.
- **Request Payload**: None.
- **Response Payload**:
  ```json
  {
    "id": "c1b2a3d4-e5f6-7890-1234-567890abcdef",
    "full_name": "Jane Doe",
    "role": "MEMBER",
    "created_at": "2025-10-18T10:00:00Z"
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `404 Not Found`

#### PATCH /api/profiles/me

- **Description**: Update the profile of the currently authenticated user.
- **Request Payload**:
  ```json
  {
    "full_name": "Jane Smith"
  }
  ```
- **Response Payload**: The updated profile object.
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

---

### Scheduled Classes

#### GET /api/scheduled-classes

- **Description**: Get a list of scheduled classes, filterable by a time range.
- **Query Parameters**:
  - `start_time` (string, ISO 8601 format, e.g., `2025-10-20T00:00:00Z`): The beginning of the time range.
  - `end_time` (string, ISO 8601 format, e.g., `2025-10-27T00:00:00Z`): The end of the time range.
- **Response Payload**:
  ```json
  [
    {
      "id": "scl-1",
      "start_time": "2025-10-20T09:00:00Z",
      "end_time": "2025-10-20T10:00:00Z",
      "capacity": 20,
      "status": "SCHEDULED",
      "class": {
        "id": "cls-1",
        "name": "Yoga Flow"
      },
      "instructor": {
        "id": "ins-1",
        "full_name": "John Instructor"
      },
      "bookings_count": 15
    }
  ]
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request`

#### GET /api/scheduled-classes/{id}/suggestions

- **Description**: Get alternative class suggestions for a specific class that is full.
- **Request Payload**: None.
- **Response Payload**: An array of scheduled class objects, similar to `GET /api/scheduled-classes`.
- **Success Codes**: `200 OK`
- **Error Codes**: `404 Not Found`

---

### Bookings

#### GET /api/bookings/my

- **Description**: Get all bookings for the currently authenticated user.
- **Query Parameters**:
  - `status` (string, enum: `UPCOMING`, `HISTORICAL`): Filter bookings by their status relative to the current time.
- **Response Payload**:
  ```json
  [
    {
      "id": "bk-1",
      "created_at": "2025-10-15T12:00:00Z",
      "scheduled_class": {
        "id": "scl-1",
        "start_time": "2025-10-20T09:00:00Z",
        "end_time": "2025-10-20T10:00:00Z",
        "class": { "name": "Yoga Flow" },
        "instructor": { "full_name": "John Instructor" }
      }
    }
  ]
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### POST /api/bookings

- **Description**: Create a new booking for the authenticated user.
- **Request Payload**:
  ```json
  {
    "scheduled_class_id": "scl-1"
  }
  ```
- **Response Payload**: The newly created booking object.
- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (e.g., class is full, already booked), `401 Unauthorized`, `404 Not Found` (class does not exist)

#### DELETE /api/bookings/{id}

- **Description**: Cancel a booking. The user must be the owner of the booking.
- **Request Payload**: None.
- **Response Payload**: None.
- **Success Codes**: `204 No Content`
- **Error Codes**: `400 Bad Request` (e.g., cancellation window has passed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### Waiting List

#### POST /api/waiting-list-entries

- **Description**: Add the authenticated user to the waiting list for a class.
- **Request Payload**:
  ```json
  {
    "scheduled_class_id": "scl-2"
  }
  ```
- **Response Payload**: The newly created waiting list entry object.
- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request` (e.g., already on list, class not full), `401 Unauthorized`, `404 Not Found`

#### DELETE /api/waiting-list-entries/{id}

- **Description**: Remove the authenticated user from a waiting list.
- **Request Payload**: None.
- **Response Payload**: None.
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### Admin Endpoints (requires 'STAFF' role)

#### GET /api/admin/dashboard

- **Description**: Get key performance indicators for the admin dashboard.
- **Request Payload**: None.
- **Response Payload**:
  ```json
  {
    "today_occupancy_rate": 0.85,
    "total_waiting_list_count": 42,
    "most_popular_classes": [
      { "name": "Yoga Flow", "booking_count": 150 },
      { "name": "HIIT", "booking_count": 120 }
    ]
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden`

#### POST /api/admin/scheduled-classes

- **Description**: Create a new scheduled class.
- **Request Payload**:
  ```json
  {
    "class_id": "cls-1",
    "instructor_id": "ins-1",
    "start_time": "2025-11-01T18:00:00Z",
    "end_time": "2025-11-01T19:00:00Z",
    "capacity": 25
  }
  ```
- **Response Payload**: The newly created scheduled class object.
- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### PATCH /api/admin/scheduled-classes/{id}

- **Description**: Update a scheduled class (e.g., change instructor or cancel).
- **Request Payload**:
  ```json
  {
    "instructor_id": "ins-2",
    "status": "CANCELLED"
  }
  ```
- **Response Payload**: The updated scheduled class object.
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 3. Authentication and Authorization

- **Authentication**: Authentication will be handled using Supabase Auth. Clients will authenticate using JWTs obtained via Supabase's email/password provider. The JWT must be included in the `Authorization` header of every request as a Bearer token.
- **Authorization**: Authorization will be managed by a combination of Supabase Row Level Security (RLS) policies and middleware in the Astro backend.
  - **RLS**: The database schema includes RLS policies that restrict data access at the database level. For example, a user can only view or manage their own bookings.
  - **API Middleware**: An Astro middleware will verify the JWT on incoming requests to protected endpoints. It will also check the user's role (e.g., `MEMBER` vs. `STAFF`) from the `profiles` table to authorize access to admin-only endpoints (e.g., `/api/admin/*`).

## 4. Validation and Business Logic

- **Payload Validation**: All incoming request bodies and query parameters will be validated using a library like Zod to ensure type safety and the presence of required fields.
- **Business Logic Implementation**:
  - **Booking Cancellation Policy**: The logic for the `DELETE /api/bookings/{id}` endpoint will check if the cancellation attempt is made more than 8 hours before the `start_time` of the `scheduled_class`. If not, it will return a `400 Bad Request` error.
  - **Unique Bookings**: The database constraint `unique_booking` prevents a user from booking the same class twice. The API will catch this database error and return a user-friendly `400 Bad Request` message.
  - **Class Capacity**: Before creating a booking via `POST /api/bookings`, the API will verify that the number of existing bookings for the `scheduled_class_id` is less than its `capacity`.
  - **Notifications**: When an admin cancels a class (`PATCH /api/admin/scheduled-classes/{id}` with `status: 'CANCELLED'`), the API will trigger a Supabase Edge Function to send email notifications to all booked users and those on the waiting list. This is handled asynchronously to avoid blocking the API response.
  - **Waiting List Notifications**: When a booking is cancelled (`DELETE /api/bookings/{id}`), a Supabase Edge Function will be triggered. It will check if the class now has capacity and, if so, send a notification email to everyone on the waiting list for that class.
