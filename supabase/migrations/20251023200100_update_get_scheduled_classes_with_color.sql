-- Migration: update_get_scheduled_classes_with_color
-- Description: Updates the get_scheduled_classes function to include class color
-- Date: 2025-10-23

-- Drop the old function
DROP FUNCTION IF EXISTS public.get_scheduled_classes(timestamptz, timestamptz);

-- Recreate the function with color field
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
      'name', c.name,
      'color', c.color
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
  'retrieves scheduled classes with class details (including color), instructor info, and booking counts. supports optional time range filtering.';

