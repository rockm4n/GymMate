-- seed.sql
-- description: seed data for local development and testing

-- insert test profiles (these will be linked to auth.users created separately)
-- note: in real scenario, profiles are created via trigger when auth.users are created

-- Clear existing data first
TRUNCATE public.bookings CASCADE;
TRUNCATE public.scheduled_classes CASCADE;
TRUNCATE public.classes CASCADE;
TRUNCATE public.class_categories CASCADE;
TRUNCATE public.instructors CASCADE;

-- insert test instructors
insert into public.instructors (id, full_name, bio, photo_url) values
  ('11111111-1111-1111-1111-111111111111', 'Anna Kowalska', 'Certified yoga instructor with 10 years of experience', null),
  ('22222222-2222-2222-2222-222222222222', 'Jan Nowak', 'Personal trainer specializing in strength training', null),
  ('33333333-3333-3333-3333-333333333333', 'Maria Wiśniewska', 'Spinning and cardio expert', null);

-- insert test class categories
insert into public.class_categories (id, name, description) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Yoga', 'Mind and body wellness through yoga practice'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Strength Training', 'Build muscle and increase strength'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cardio', 'High-intensity cardiovascular workouts');

-- insert test classes
insert into public.classes (id, name, description, duration_minutes, category_id) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Morning Yoga', 'Start your day with energizing yoga flow', 60, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Power Lifting', 'Advanced strength training session', 90, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Spinning Class', 'High-energy indoor cycling', 45, 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- insert test scheduled classes (future dates)
insert into public.scheduled_classes (id, class_id, instructor_id, start_time, end_time, capacity, status) values
  -- tomorrow morning yoga (capacity 10)
  ('99999999-9999-9999-9999-999999999991'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (now() + interval '1 day')::date + time '08:00:00', (now() + interval '1 day')::date + time '09:00:00', 10, 'scheduled'::class_status),
  -- tomorrow power lifting (capacity 5)
  ('99999999-9999-9999-9999-999999999992'::uuid, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, (now() + interval '1 day')::date + time '10:00:00', (now() + interval '1 day')::date + time '11:30:00', 5, 'scheduled'::class_status),
  -- tomorrow spinning (capacity 2 - for testing full class)
  ('99999999-9999-9999-9999-999999999993'::uuid, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, (now() + interval '1 day')::date + time '18:00:00', (now() + interval '1 day')::date + time '18:45:00', 2, 'scheduled'::class_status),
  -- cancelled class (for testing unavailable status)
  ('99999999-9999-9999-9999-999999999994'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, (now() + interval '2 days')::date + time '08:00:00', (now() + interval '2 days')::date + time '09:00:00', 10, 'cancelled'::class_status),
  -- class with unlimited capacity (null)
  ('99999999-9999-9999-9999-999999999995',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '33333333-3333-3333-3333-333333333333',
   (now() + interval '3 days')::date + time '18:00:00',
   (now() + interval '3 days')::date + time '18:45:00',
   null,
   'scheduled');

-- note: to test the booking endpoint, you'll need to:
-- 1. create a test user via supabase auth
-- 2. get their user_id
-- 3. use the scheduled_class_id from above (e.g., '99999999-9999-9999-9999-999999999991')

