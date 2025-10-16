-- migration: init_schema
-- description: initial database schema for the gymmate application.
-- tables:
--   - public.profiles
--   - public.instructors
--   - public.class_categories
--   - public.classes
--   - public.scheduled_classes
--   - public.bookings
--   - public.waiting_list
-- types:
--   - public.user_role
--   - public.class_status
-- functions:
--   - public.get_my_role()

/************************************************************************************************
  custom types (enums)
  description: defines custom enum types for user roles and class statuses to ensure data consistency.
************************************************************************************************/

create type public.user_role as enum ('member', 'staff');
comment on type public.user_role is 'defines the roles a user can have within the application.';

create type public.class_status as enum ('scheduled', 'cancelled', 'completed');
comment on type public.class_status is 'defines the possible statuses for a scheduled class.';


/************************************************************************************************
  tables
  description: creates the core tables for the application.
************************************************************************************************/

-- table: profiles
-- description: extends auth.users with app-specific data like full name and role.
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role public.user_role not null default 'member',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.profiles is 'user profiles extending supabase auth.users.';

-- table: instructors
-- description: stores information about class instructors.
create table public.instructors (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    bio text,
    photo_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.instructors is 'fitness instructors who lead classes.';

-- table: class_categories
-- description: a dictionary of categories for classes (e.g., yoga, cycling).
create table public.class_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);
comment on table public.class_categories is 'categories for organizing different types of classes.';

-- table: classes
-- description: defines general class templates, including duration and category.
create table public.classes (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    duration_minutes int not null check (duration_minutes > 0),
    category_id uuid not null references public.class_categories(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.classes is 'general definitions of classes offered.';

-- table: scheduled_classes
-- description: specific instances of classes in the schedule with date, time, and instructor.
create table public.scheduled_classes (
    id uuid primary key default gen_random_uuid(),
    class_id uuid not null references public.classes(id) on delete restrict,
    instructor_id uuid references public.instructors(id) on delete set null,
    start_time timestamptz not null,
    end_time timestamptz not null,
    capacity int check (capacity > 0), -- null means unlimited capacity
    status public.class_status not null default 'scheduled',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint end_time_after_start_time check (end_time > start_time)
);
comment on table public.scheduled_classes is 'specific, scheduled occurrences of classes.';

-- table: bookings
-- description: tracks user reservations for scheduled classes.
create table public.bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    scheduled_class_id uuid not null references public.scheduled_classes(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint unique_booking unique (user_id, scheduled_class_id)
);
comment on table public.bookings is 'user bookings for scheduled classes.';

-- table: waiting_list
-- description: manages users waiting for a spot in a full class.
create table public.waiting_list (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    scheduled_class_id uuid not null references public.scheduled_classes(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint unique_waiting_list_entry unique (user_id, scheduled_class_id)
);
comment on table public.waiting_list is 'waiting list for users when a class is full.';


/************************************************************************************************
  indexes
  description: creates indexes to optimize query performance for common operations.
************************************************************************************************/

-- index: idx_scheduled_classes_time
-- purpose: speeds up queries filtering scheduled classes by time range.
create index idx_scheduled_classes_time on public.scheduled_classes(start_time, end_time);

-- indexes on foreign keys to accelerate join operations.
create index idx_classes_category_id on public.classes(category_id);
create index idx_scheduled_classes_class_id on public.scheduled_classes(class_id);
create index idx_scheduled_classes_instructor_id on public.scheduled_classes(instructor_id);
create index idx_bookings_user_id on public.bookings(user_id);
create index idx_bookings_scheduled_class_id on public.bookings(scheduled_class_id);
create index idx_waiting_list_user_id on public.waiting_list(user_id);
create index idx_waiting_list_scheduled_class_id on public.waiting_list(scheduled_class_id);


/************************************************************************************************
  security
  description: sets up row-level security (rls) policies to control data access.
************************************************************************************************/

-- helper function: get_my_role
-- description: retrieves the role of the currently authenticated user from their profile.
--              this function is used in rls policies to check for 'staff' privileges.
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;


/************************************************************************************************
  rls policies: profiles
************************************************************************************************/
alter table public.profiles enable row level security;

-- anon policies
create policy "profiles_anon_select_policy" on public.profiles for select to anon using (false);
comment on policy "profiles_anon_select_policy" on public.profiles is 'anon users cannot read profiles.';
create policy "profiles_anon_insert_policy" on public.profiles for insert to anon with check (false);
comment on policy "profiles_anon_insert_policy" on public.profiles is 'anon users cannot create profiles.';
create policy "profiles_anon_update_policy" on public.profiles for update to anon using (false);
comment on policy "profiles_anon_update_policy" on public.profiles is 'anon users cannot update profiles.';
create policy "profiles_anon_delete_policy" on public.profiles for delete to anon using (false);
comment on policy "profiles_anon_delete_policy" on public.profiles is 'anon users cannot delete profiles.';

-- authenticated policies
create policy "profiles_authenticated_select_policy" on public.profiles for select to authenticated using (auth.uid() = id or get_my_role() = 'staff');
comment on policy "profiles_authenticated_select_policy" on public.profiles is 'authenticated users can read their own profile, staff can read all.';
create policy "profiles_authenticated_insert_policy" on public.profiles for insert to authenticated with check (get_my_role() = 'staff');
comment on policy "profiles_authenticated_insert_policy" on public.profiles is 'users cannot create their own profile (handled by trigger), but staff can.';
create policy "profiles_authenticated_update_policy" on public.profiles for update to authenticated using (auth.uid() = id or get_my_role() = 'staff');
comment on policy "profiles_authenticated_update_policy" on public.profiles is 'authenticated users can update their own profile, staff can update all.';
create policy "profiles_authenticated_delete_policy" on public.profiles for delete to authenticated using (get_my_role() = 'staff');
comment on policy "profiles_authenticated_delete_policy" on public.profiles is 'only staff can delete profiles.';


/************************************************************************************************
  rls policies: public read tables (instructors, class_categories, classes, scheduled_classes)
  logic: authenticated users can read, only staff can write.
************************************************************************************************/

-- table: instructors
alter table public.instructors enable row level security;
create policy "instructors_anon_select_policy" on public.instructors for select to anon using (false);
comment on policy "instructors_anon_select_policy" on public.instructors is 'anon users cannot read instructors.';
create policy "instructors_anon_insert_policy" on public.instructors for insert to anon with check (false);
comment on policy "instructors_anon_insert_policy" on public.instructors is 'anon users cannot create instructors.';
create policy "instructors_anon_update_policy" on public.instructors for update to anon using (false);
comment on policy "instructors_anon_update_policy" on public.instructors is 'anon users cannot update instructors.';
create policy "instructors_anon_delete_policy" on public.instructors for delete to anon using (false);
comment on policy "instructors_anon_delete_policy" on public.instructors is 'anon users cannot delete instructors.';

create policy "instructors_authenticated_select_policy" on public.instructors for select to authenticated using (true);
comment on policy "instructors_authenticated_select_policy" on public.instructors is 'authenticated users can read all instructors.';
create policy "instructors_authenticated_insert_policy" on public.instructors for insert to authenticated with check (get_my_role() = 'staff');
comment on policy "instructors_authenticated_insert_policy" on public.instructors is 'only staff can create instructors.';
create policy "instructors_authenticated_update_policy" on public.instructors for update to authenticated using (get_my_role() = 'staff');
comment on policy "instructors_authenticated_update_policy" on public.instructors is 'only staff can update instructors.';
create policy "instructors_authenticated_delete_policy" on public.instructors for delete to authenticated using (get_my_role() = 'staff');
comment on policy "instructors_authenticated_delete_policy" on public.instructors is 'only staff can delete instructors.';

-- table: class_categories
alter table public.class_categories enable row level security;
create policy "class_categories_anon_select_policy" on public.class_categories for select to anon using (false);
comment on policy "class_categories_anon_select_policy" on public.class_categories is 'anon users cannot read class categories.';
create policy "class_categories_anon_insert_policy" on public.class_categories for insert to anon with check (false);
comment on policy "class_categories_anon_insert_policy" on public.class_categories is 'anon users cannot create class categories.';
create policy "class_categories_anon_update_policy" on public.class_categories for update to anon using (false);
comment on policy "class_categories_anon_update_policy" on public.class_categories is 'anon users cannot update class categories.';
create policy "class_categories_anon_delete_policy" on public.class_categories for delete to anon using (false);
comment on policy "class_categories_anon_delete_policy" on public.class_categories is 'anon users cannot delete class categories.';

create policy "class_categories_authenticated_select_policy" on public.class_categories for select to authenticated using (true);
comment on policy "class_categories_authenticated_select_policy" on public.class_categories is 'authenticated users can read all class categories.';
create policy "class_categories_authenticated_insert_policy" on public.class_categories for insert to authenticated with check (get_my_role() = 'staff');
comment on policy "class_categories_authenticated_insert_policy" on public.class_categories is 'only staff can create class categories.';
create policy "class_categories_authenticated_update_policy" on public.class_categories for update to authenticated using (get_my_role() = 'staff');
comment on policy "class_categories_authenticated_update_policy" on public.class_categories is 'only staff can update class categories.';
create policy "class_categories_authenticated_delete_policy" on public.class_categories for delete to authenticated using (get_my_role() = 'staff');
comment on policy "class_categories_authenticated_delete_policy" on public.class_categories is 'only staff can delete class categories.';

-- table: classes
alter table public.classes enable row level security;
create policy "classes_anon_select_policy" on public.classes for select to anon using (false);
comment on policy "classes_anon_select_policy" on public.classes is 'anon users cannot read classes.';
create policy "classes_anon_insert_policy" on public.classes for insert to anon with check (false);
comment on policy "classes_anon_insert_policy" on public.classes is 'anon users cannot create classes.';
create policy "classes_anon_update_policy" on public.classes for update to anon using (false);
comment on policy "classes_anon_update_policy" on public.classes is 'anon users cannot update classes.';
create policy "classes_anon_delete_policy" on public.classes for delete to anon using (false);
comment on policy "classes_anon_delete_policy" on public.classes is 'anon users cannot delete classes.';

create policy "classes_authenticated_select_policy" on public.classes for select to authenticated using (true);
comment on policy "classes_authenticated_select_policy" on public.classes is 'authenticated users can read all classes.';
create policy "classes_authenticated_insert_policy" on public.classes for insert to authenticated with check (get_my_role() = 'staff');
comment on policy "classes_authenticated_insert_policy" on public.classes is 'only staff can create classes.';
create policy "classes_authenticated_update_policy" on public.classes for update to authenticated using (get_my_role() = 'staff');
comment on policy "classes_authenticated_update_policy" on public.classes is 'only staff can update classes.';
create policy "classes_authenticated_delete_policy" on public.classes for delete to authenticated using (get_my_role() = 'staff');
comment on policy "classes_authenticated_delete_policy" on public.classes is 'only staff can delete classes.';

-- table: scheduled_classes
alter table public.scheduled_classes enable row level security;
create policy "scheduled_classes_anon_select_policy" on public.scheduled_classes for select to anon using (false);
comment on policy "scheduled_classes_anon_select_policy" on public.scheduled_classes is 'anon users cannot read scheduled classes.';
create policy "scheduled_classes_anon_insert_policy" on public.scheduled_classes for insert to anon with check (false);
comment on policy "scheduled_classes_anon_insert_policy" on public.scheduled_classes is 'anon users cannot create scheduled classes.';
create policy "scheduled_classes_anon_update_policy" on public.scheduled_classes for update to anon using (false);
comment on policy "scheduled_classes_anon_update_policy" on public.scheduled_classes is 'anon users cannot update scheduled classes.';
create policy "scheduled_classes_anon_delete_policy" on public.scheduled_classes for delete to anon using (false);
comment on policy "scheduled_classes_anon_delete_policy" on public.scheduled_classes is 'anon users cannot delete scheduled classes.';

create policy "scheduled_classes_authenticated_select_policy" on public.scheduled_classes for select to authenticated using (true);
comment on policy "scheduled_classes_authenticated_select_policy" on public.scheduled_classes is 'authenticated users can read all scheduled classes.';
create policy "scheduled_classes_authenticated_insert_policy" on public.scheduled_classes for insert to authenticated with check (get_my_role() = 'staff');
comment on policy "scheduled_classes_authenticated_insert_policy" on public.scheduled_classes is 'only staff can create scheduled classes.';
create policy "scheduled_classes_authenticated_update_policy" on public.scheduled_classes for update to authenticated using (get_my_role() = 'staff');
comment on policy "scheduled_classes_authenticated_update_policy" on public.scheduled_classes is 'only staff can update scheduled classes.';
create policy "scheduled_classes_authenticated_delete_policy" on public.scheduled_classes for delete to authenticated using (get_my_role() = 'staff');
comment on policy "scheduled_classes_authenticated_delete_policy" on public.scheduled_classes is 'only staff can delete scheduled classes.';


/************************************************************************************************
  rls policies: user-specific tables (bookings, waiting_list)
  logic: users can manage their own entries, staff can manage all entries.
************************************************************************************************/

-- table: bookings
alter table public.bookings enable row level security;
create policy "bookings_anon_select_policy" on public.bookings for select to anon using (false);
comment on policy "bookings_anon_select_policy" on public.bookings is 'anon users cannot read bookings.';
create policy "bookings_anon_insert_policy" on public.bookings for insert to anon with check (false);
comment on policy "bookings_anon_insert_policy" on public.bookings is 'anon users cannot create bookings.';
create policy "bookings_anon_update_policy" on public.bookings for update to anon using (false);
comment on policy "bookings_anon_update_policy" on public.bookings is 'anon users cannot update bookings.';
create policy "bookings_anon_delete_policy" on public.bookings for delete to anon using (false);
comment on policy "bookings_anon_delete_policy" on public.bookings is 'anon users cannot delete bookings.';

create policy "bookings_authenticated_select_policy" on public.bookings for select to authenticated using (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "bookings_authenticated_select_policy" on public.bookings is 'users can see their own bookings, staff can see all.';
create policy "bookings_authenticated_insert_policy" on public.bookings for insert to authenticated with check (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "bookings_authenticated_insert_policy" on public.bookings is 'users can create their own bookings, staff can create for any user.';
create policy "bookings_authenticated_update_policy" on public.bookings for update to authenticated using (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "bookings_authenticated_update_policy" on public.bookings is 'users can update their own bookings, staff can update any.';
create policy "bookings_authenticated_delete_policy" on public.bookings for delete to authenticated using (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "bookings_authenticated_delete_policy" on public.bookings is 'users can delete their own bookings, staff can delete any.';

-- table: waiting_list
alter table public.waiting_list enable row level security;
create policy "waiting_list_anon_select_policy" on public.waiting_list for select to anon using (false);
comment on policy "waiting_list_anon_select_policy" on public.waiting_list is 'anon users cannot read waiting list entries.';
create policy "waiting_list_anon_insert_policy" on public.waiting_list for insert to anon with check (false);
comment on policy "waiting_list_anon_insert_policy" on public.waiting_list is 'anon users cannot create waiting list entries.';
create policy "waiting_list_anon_update_policy" on public.waiting_list for update to anon using (false);
comment on policy "waiting_list_anon_update_policy" on public.waiting_list is 'anon users cannot update waiting list entries.';
create policy "waiting_list_anon_delete_policy" on public.waiting_list for delete to anon using (false);
comment on policy "waiting_list_anon_delete_policy" on public.waiting_list is 'anon users cannot delete waiting list entries.';

create policy "waiting_list_authenticated_select_policy" on public.waiting_list for select to authenticated using (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "waiting_list_authenticated_select_policy" on public.waiting_list is 'users can see their own waiting list entries, staff can see all.';
create policy "waiting_list_authenticated_insert_policy" on public.waiting_list for insert to authenticated with check (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "waiting_list_authenticated_insert_policy" on public.waiting_list is 'users can create their own waiting list entries, staff can create for any user.';
create policy "waiting_list_authenticated_update_policy" on public.waiting_list for update to authenticated using (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "waiting_list_authenticated_update_policy" on public.waiting_list is 'users can update their own waiting list entries, staff can update any.';
create policy "waiting_list_authenticated_delete_policy" on public.waiting_list for delete to authenticated using (auth.uid() = user_id or get_my_role() = 'staff');
comment on policy "waiting_list_authenticated_delete_policy" on public.waiting_list is 'users can delete their own waiting list entries, staff can delete any.';
