-- migration: add_get_scheduled_classes_function
-- description: creates an RPC function to fetch scheduled classes with related data
-- functions:
--   - public.get_scheduled_classes(start_filter, end_filter)

/************************************************************************************************
  function: get_scheduled_classes
  description: retrieves scheduled classes with related class and instructor information,
               and the current number of bookings. Supports optional time range filtering.
  parameters:
    - start_filter (timestamptz, optional): filter classes starting at or after this time
    - end_filter (timestamptz, optional): filter classes starting before or at this time
  returns: table with structure matching ScheduledClassDto
  security: accessible to authenticated users (matches RLS policy on scheduled_classes)
************************************************************************************************/

create or replace function public.get_scheduled_classes(
  start_filter timestamptz default null,
  end_filter timestamptz default null
)
returns table (
  id uuid,
  start_time timestamptz,
  end_time timestamptz,
  capacity int,
  status text,
  class jsonb,
  instructor jsonb,
  bookings_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    sc.id,
    sc.start_time,
    sc.end_time,
    sc.capacity,
    sc.status::text,
    jsonb_build_object(
      'id', c.id,
      'name', c.name
    ) as class,
    case
      when i.id is not null then
        jsonb_build_object(
          'id', i.id,
          'full_name', i.full_name
        )
      else null
    end as instructor,
    coalesce(count(b.id), 0) as bookings_count
  from public.scheduled_classes sc
  inner join public.classes c on sc.class_id = c.id
  left join public.instructors i on sc.instructor_id = i.id
  left join public.bookings b on sc.id = b.scheduled_class_id
  where
    (start_filter is null or sc.start_time >= start_filter)
    and (end_filter is null or sc.start_time <= end_filter)
  group by sc.id, c.id, i.id
  order by sc.start_time asc;
$$;

comment on function public.get_scheduled_classes(timestamptz, timestamptz) is 
  'retrieves scheduled classes with class details, instructor info, and booking counts. supports optional time range filtering.';

