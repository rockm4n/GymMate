-- migration: add_get_dashboard_kpis_function
-- description: creates a PostgreSQL function to calculate and return admin dashboard KPIs
-- function:
--   - public.get_dashboard_kpis()
--
-- This function aggregates key performance indicators for the admin dashboard:
-- 1. today_occupancy_rate: percentage of booked spots for today's classes
-- 2. total_waiting_list_count: total number of users on waiting lists
-- 3. most_popular_classes: top classes by booking count (all time)

/************************************************************************************************
  function: get_dashboard_kpis
  description: calculates and returns admin dashboard KPIs in a single query
  returns: jsonb object with KPI data
  security: definer (runs with creator's privileges, requires STAFF role check at app level)
************************************************************************************************/

create or replace function public.get_dashboard_kpis()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today_occupancy_rate numeric;
  v_total_waiting_list_count integer;
  v_most_popular_classes jsonb;
begin
  -- Calculate today's occupancy rate
  -- Formula: (total booked spots today) / (total capacity today) for classes with capacity set
  -- If no classes today or all have unlimited capacity, return 0
  select 
    coalesce(
      case 
        when sum(sc.capacity) > 0 then
          round(
            (count(b.id)::numeric / sum(sc.capacity)::numeric),
            4
          )
        else 0
      end,
      0
    )
  into v_today_occupancy_rate
  from public.scheduled_classes sc
  left join public.bookings b on b.scheduled_class_id = sc.id
  where 
    sc.status = 'scheduled'
    and sc.capacity is not null
    and date(sc.start_time at time zone 'UTC') = date(now() at time zone 'UTC');

  -- Count total waiting list entries
  select count(*)
  into v_total_waiting_list_count
  from public.waiting_list;

  -- Get most popular classes (top 5 by booking count, all time)
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', name,
        'booking_count', booking_count
      )
      order by booking_count desc
    ),
    '[]'::jsonb
  )
  into v_most_popular_classes
  from (
    select 
      c.name,
      count(b.id) as booking_count
    from public.classes c
    inner join public.scheduled_classes sc on sc.class_id = c.id
    left join public.bookings b on b.scheduled_class_id = sc.id
    group by c.id, c.name
    having count(b.id) > 0
    order by booking_count desc
    limit 5
  ) as popular_classes_data;

  -- Return all KPIs as a single JSONB object
  return jsonb_build_object(
    'today_occupancy_rate', v_today_occupancy_rate,
    'total_waiting_list_count', v_total_waiting_list_count,
    'most_popular_classes', v_most_popular_classes
  );
end;
$$;

comment on function public.get_dashboard_kpis() is 
  'Calculates and returns admin dashboard KPIs including occupancy rate, waiting list count, and most popular classes.';

