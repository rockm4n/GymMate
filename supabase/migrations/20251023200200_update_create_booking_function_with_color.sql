-- Migration: update_create_booking_function_with_color
-- Description: Updates the create_booking function to include class id and color in the returned JSONB
-- Date: 2025-10-23

-- Drop the old function
DROP FUNCTION IF EXISTS public.create_booking(uuid, uuid);

-- Recreate the function with class id and color
create or replace function public.create_booking(
  p_user_id uuid,
  p_scheduled_class_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scheduled_class record;
  v_current_bookings bigint;
  v_new_booking record;
  v_result jsonb;
begin
  -- step 1: lock the scheduled class row and verify it exists
  -- using FOR UPDATE to prevent race conditions
  select
    sc.id,
    sc.capacity,
    sc.status,
    sc.start_time,
    sc.end_time,
    c.id as class_id,
    c.name as class_name,
    c.color as class_color,
    i.full_name as instructor_full_name
  into v_scheduled_class
  from public.scheduled_classes sc
  inner join public.classes c on sc.class_id = c.id
  left join public.instructors i on sc.instructor_id = i.id
  where sc.id = p_scheduled_class_id
  for update;

  -- check if class exists
  if not found then
    raise exception 'CLASS_NOT_FOUND' using hint = 'scheduled class does not exist';
  end if;

  -- step 2: verify class is available for booking
  if v_scheduled_class.status != 'scheduled' then
    raise exception 'CLASS_NOT_AVAILABLE' using hint = 'class status must be scheduled';
  end if;

  -- step 3: check capacity (only if capacity is set)
  if v_scheduled_class.capacity is not null then
    select count(*)
    into v_current_bookings
    from public.bookings
    where scheduled_class_id = p_scheduled_class_id;

    if v_current_bookings >= v_scheduled_class.capacity then
      raise exception 'CLASS_FULL' using hint = 'no available spots remaining';
    end if;
  end if;

  -- step 4: create the booking
  -- the unique constraint will raise an exception if user already booked
  insert into public.bookings (user_id, scheduled_class_id)
  values (p_user_id, p_scheduled_class_id)
  returning id, created_at into v_new_booking;

  -- step 5: build and return the result as jsonb
  v_result := jsonb_build_object(
    'id', v_new_booking.id,
    'created_at', v_new_booking.created_at,
    'scheduled_class', jsonb_build_object(
      'id', v_scheduled_class.id,
      'start_time', v_scheduled_class.start_time,
      'end_time', v_scheduled_class.end_time,
      'class', jsonb_build_object(
        'id', v_scheduled_class.class_id,
        'name', v_scheduled_class.class_name,
        'color', v_scheduled_class.class_color
      ),
      'instructor', case
        when v_scheduled_class.instructor_full_name is not null then
          jsonb_build_object('full_name', v_scheduled_class.instructor_full_name)
        else null
      end
    )
  );

  return v_result;

exception
  when unique_violation then
    raise exception 'ALREADY_BOOKED' using hint = 'user has already booked this class';
end;
$$;

comment on function public.create_booking(uuid, uuid) is
  'atomically creates a booking with capacity checking. ensures race-condition safety through row locking. includes class id and color in response.';
