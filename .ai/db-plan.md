# Plan schematu bazy danych dla aplikacji GymMate

## 1. Definicje tabel i typów

### Typy niestandardowe (ENUM)

Najpierw definiujemy niestandardowe typy wyliczeniowe (ENUM), aby zapewnić spójność danych dla ról użytkowników i statusów zajęć.

```sql
CREATE TYPE user_role AS ENUM ('MEMBER', 'STAFF');
CREATE TYPE class_status AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
```

### Tabele

#### `profiles`

Tabela rozszerzająca `auth.users` z Supabase, przechowująca dodatkowe informacje o użytkownikach, w tym ich rolę w systemie.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `instructors`

Tabela przechowująca informacje o instruktorach prowadzących zajęcia.

```sql
CREATE TABLE public.instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `class_categories`

Słownik kategorii, do których mogą należeć zajęcia.

```sql
CREATE TABLE public.class_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `classes`

Definicje ogólne zajęć, które mogą być następnie umieszczane w harmonogramie.

```sql
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    category_id UUID NOT NULL REFERENCES public.class_categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `scheduled_classes`

Konkretne wystąpienia zajęć w harmonogramie, z przypisanym terminem, instruktorem i limitem miejsc.

```sql
CREATE TABLE public.scheduled_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INT CHECK (capacity > 0), -- NULL oznacza brak limitu miejsc
    status class_status NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT end_time_after_start_time CHECK (end_time > start_time)
);
```

#### `bookings`

Tabela przechowująca rezerwacje dokonane przez użytkowników na konkretne zajęcia w harmonogramie.

```sql
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_class_id UUID NOT NULL REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_booking UNIQUE (user_id, scheduled_class_id)
);
```

#### `waiting_list`

Tabela przechowująca zapisy na listę oczekujących, gdy na zajęciach zabraknie wolnych miejsc.

```sql
CREATE TABLE public.waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_class_id UUID NOT NULL REFERENCES public.scheduled_classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_waiting_list_entry UNIQUE (user_id, scheduled_class_id)
);
```

## 2. Relacje między tabelami

- **`auth.users` 1-do-1 `profiles`**: Każdy użytkownik Supabase ma dokładnie jeden profil.
- **`class_categories` 1-do-wielu `classes`**: Każda kategoria może zawierać wiele definicji zajęć.
- **`classes` 1-do-wielu `scheduled_classes`**: Jedna definicja zajęć może mieć wiele zaplanowanych wystąpień w harmonogramie.
- **`instructors` 1-do-wielu `scheduled_classes`**: Instruktor może prowadzić wiele zajęć.
- **`auth.users` wiele-do-wielu `scheduled_classes` (poprzez `bookings`)**: Użytkownik może zarezerwować wiele zajęć, a na jedne zajęcia może zapisać się wielu użytkowników.
- **`auth.users` wiele-do-wielu `scheduled_classes` (poprzez `waiting_list`)**: Analogicznie dla listy oczekujących.

## 3. Indeksy

Indeksy zostaną utworzone w celu optymalizacji wydajności najczęstszych zapytań, takich jak pobieranie harmonogramu, sprawdzanie rezerwacji czy wyszukiwanie zajęć.

```sql
-- Indeks do szybkiego wyszukiwania zajęć w danym przedziale czasowym
CREATE INDEX idx_scheduled_classes_time ON public.scheduled_classes(start_time, end_time);

-- Indeksy na kluczach obcych dla przyspieszenia operacji JOIN
CREATE INDEX idx_classes_category_id ON public.classes(category_id);
CREATE INDEX idx_scheduled_classes_class_id ON public.scheduled_classes(class_id);
CREATE INDEX idx_scheduled_classes_instructor_id ON public.scheduled_classes(instructor_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_scheduled_class_id ON public.bookings(scheduled_class_id);
CREATE INDEX idx_waiting_list_user_id ON public.waiting_list(user_id);
CREATE INDEX idx_waiting_list_scheduled_class_id ON public.waiting_list(scheduled_class_id);
```

## 4. Zasady bezpieczeństwa (PostgreSQL RLS)

Zasady Row-Level Security zapewnią, że użytkownicy mają dostęp wyłącznie do swoich danych, a personel klubu ma szersze uprawnienia.

### Funkcja pomocnicza

Ta funkcja pobiera rolę aktualnie zalogowanego użytkownika.

```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT "role"::text FROM public.profiles WHERE id = auth.uid()
$$;
```

### Polityki RLS

```sql
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can manage all profiles" ON public.profiles FOR ALL USING (get_my_role() = 'STAFF');

-- BOOKINGS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own bookings" ON public.bookings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff can manage all bookings" ON public.bookings FOR ALL USING (get_my_role() = 'STAFF');

-- WAITING_LIST
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own waiting list entries" ON public.waiting_list FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff can manage all waiting list entries" ON public.waiting_list FOR ALL USING (get_my_role() = 'STAFF');

-- Tabele publicznie dostępne do odczytu dla zalogowanych użytkowników
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read instructors" ON public.instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage instructors" ON public.instructors FOR ALL USING (get_my_role() = 'STAFF');

ALTER TABLE public.class_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read class categories" ON public.class_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage class categories" ON public.class_categories FOR ALL USING (get_my_role() = 'STAFF');

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage classes" ON public.classes FOR ALL USING (get_my_role() = 'STAFF');

ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read scheduled classes" ON public.scheduled_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage scheduled classes" ON public.scheduled_classes FOR ALL USING (get_my_role() = 'STAFF');
```

## 5. Dodatkowe uwagi

1.  **Typ danych `TIMESTAMPTZ`**: Użycie typu `TIMESTAMP WITH TIME ZONE` jest kluczowe dla poprawnego zarządzania datami i godzinami w różnych strefach czasowych.
2.  **Integralność danych**: Ograniczenia `ON DELETE` (`RESTRICT`, `SET NULL`, `CASCADE`) zostały dobrane tak, aby chronić integralność referencyjną danych. `RESTRICT` zapobiega usunięciu definicji zajęć, jeśli istnieją jej instancje w harmonogramie, natomiast `SET NULL` pozwala na usunięcie instruktora bez usuwania historycznych zajęć, które prowadził.
3.  **Logika biznesowa**: Złożone reguły, takie jak limit czasowy na anulowanie rezerwacji (8 godzin), będą implementowane w warstwie aplikacji, a nie bezpośrednio w bazie danych.
4.  **Powiadomienia**: Mechanizm powiadomień (np. dla osób z listy oczekujących) będzie realizowany za pomocą Supabase Edge Functions, wyzwalanych przez zdarzenia w bazie danych, co odciąży bazę i zapobiegnie blokowaniu transakcji.
5.  **Panel administracyjny (KPI)**: W celu zapewnienia wysokiej wydajności panelu administracyjnego, zostanie utworzony **zmaterializowany widok** (materialized view), który będzie agregował kluczowe wskaźniki (np. frekwencja, popularność zajęć). Widok ten będzie odświeżany okresowo, np. raz na godzinę.
