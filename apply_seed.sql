-- Apply seed data to local database
-- Run this in Supabase Studio SQL Editor: http://127.0.0.1:54323

-- First, clear existing data (CRITICAL - run this before inserting)
TRUNCATE public.bookings CASCADE;
TRUNCATE public.scheduled_classes CASCADE;
TRUNCATE public.classes CASCADE;
TRUNCATE public.class_categories CASCADE;
TRUNCATE public.instructors CASCADE;

-- Insert test instructors
INSERT INTO public.instructors (id, full_name, bio, photo_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Anna Kowalska', 'Certified yoga instructor with 10 years of experience', null),
  ('22222222-2222-2222-2222-222222222222', 'Jan Nowak', 'Personal trainer specializing in strength training', null),
  ('33333333-3333-3333-3333-333333333333', 'Maria Wiśniewska', 'Spinning and cardio expert', null),
  ('44444444-4444-4444-4444-444444444444', 'Piotr Zieliński', 'CrossFit coach and HIIT specialist', null),
  ('55555555-5555-5555-5555-555555555555', 'Katarzyna Lewandowska', 'Pilates and stretching instructor', null),
  ('66666666-6666-6666-6666-666666666666', 'Tomasz Kamiński', 'Boxing and martial arts trainer', null);

-- Insert test class categories
INSERT INTO public.class_categories (id, name, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Yoga', 'Mind and body wellness through yoga practice'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Strength Training', 'Build muscle and increase strength'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cardio', 'High-intensity cardiovascular workouts'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Flexibility', 'Stretching and mobility exercises'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Combat Sports', 'Boxing, kickboxing and martial arts'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Dance', 'Dance-based fitness classes');

-- Insert test classes with colors
INSERT INTO public.classes (id, name, description, duration_minutes, category_id, color) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Morning Yoga', 'Start your day with energizing yoga flow', 60, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '#10b981'),
  ('c0000002-0000-0000-0000-000000000002', 'Evening Yoga', 'Relaxing yoga session to end your day', 60, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '#10b981'),
  ('c0000003-0000-0000-0000-000000000003', 'Power Yoga', 'Dynamic and challenging yoga practice', 75, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '#059669'),
  ('c0000004-0000-0000-0000-000000000004', 'Pilates', 'Core strengthening and flexibility', 60, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '#8b5cf6'),
  ('c0000005-0000-0000-0000-000000000005', 'Power Lifting', 'Advanced strength training session', 90, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#0891b2'),
  ('c0000006-0000-0000-0000-000000000006', 'CrossFit', 'High-intensity functional training', 60, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#f97316'),
  ('c0000007-0000-0000-0000-000000000007', 'HIIT', 'High-intensity interval training', 45, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '#f97316'),
  ('c0000008-0000-0000-0000-000000000008', 'Spinning', 'High-energy indoor cycling', 45, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '#ef4444'),
  ('c0000009-0000-0000-0000-000000000009', 'Cardio Blast', 'Full-body cardio workout', 50, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '#f59e0b'),
  ('c0000010-0000-0000-0000-000000000010', 'Stretching', 'Deep stretching and flexibility', 45, 'dddddddd-dddd-dddd-dddd-dddddddddddd', '#06b6d4'),
  ('c0000011-0000-0000-0000-000000000011', 'Boxing', 'Boxing techniques and conditioning', 60, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '#dc2626'),
  ('c0000012-0000-0000-0000-000000000012', 'Zumba', 'Dance fitness party', 60, 'ffffffff-ffff-ffff-ffff-ffffffffffff', '#ec4899'),
  ('c0000013-0000-0000-0000-000000000013', 'TRX Training', 'Suspension training workout', 50, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#0891b2'),
  ('c0000014-0000-0000-0000-000000000014', 'Abs & Core', 'Core strengthening workout', 30, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '#0891b2'),
  ('c0000015-0000-0000-0000-000000000015', 'Kickboxing', 'Martial arts cardio workout', 60, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '#dc2626');

