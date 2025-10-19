-- migration: add_create_booking_function
-- description: creates an RPC function to atomically create a booking with capacity checking
-- functions:
--   - public.create_booking(p_user_id, p_scheduled_class_id)

/************************************************************************************************
  function: create_booking
  description: atomically creates a booking for a user on a scheduled class.
               this function ensures race-condition-safe capacity checking and booking creation.
               
  business logic:
    1. verifies the scheduled class exists and is available for booking (status = 'scheduled')
    2. checks if there are available spots (current bookings < capacity)
    3. ensures the user hasn't already booked this class (unique constraint)
    4. creates the booking record
    5. returns the booking with related class and instructor data
    
  parameters:
    - p_user_id (uuid): the id of the user creating the booking
    - p_scheduled_class_id (uuid): the id of the scheduled class to book
    
  returns: jsonb object with booking details matching BookingDto structure
  
  errors:
    - raises exception 'CLASS_NOT_FOUND' if scheduled class doesn't exist
    - raises exception 'CLASS_NOT_AVAILABLE' if class status is not 'scheduled'
    - raises exception 'CLASS_FULL' if no available spots remain
    - raises exception 'ALREADY_BOOKED' if user already has a booking (caught by unique constraint)
    
  security: accessible to authenticated users (matches RLS policy on bookings)
************************************************************************************************/

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
    c.name as class_name,
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
        'name', v_scheduled_class.class_name
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
  'atomically creates a booking with capacity checking. ensures race-condition safety through row locking.';

