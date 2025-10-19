# API Endpoint Implementation Plan: GET /api/admin/dashboard

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /api/admin/dashboard` jest przeznaczony dla personelu administracyjnego (`STAFF`) do pobierania kluczowych wskaźników wydajności (KPI) dotyczących działalności siłowni. Zwraca zagregowane dane, takie jak wskaźnik obłożenia, całkowita liczba osób na listach oczekujących oraz najpopularniejsze zajęcia, co umożliwia szybką ocenę bieżącej sytuacji operacyjnej.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/api/admin/dashboard`
-   **Parametry**:
    -   Wymagane: Brak
    -   Opcjonalne: Brak
-   **Request Body**: Brak

## 3. Wykorzystywane typy

-   **DTO**: `AdminDashboardDto` zdefiniowany w `src/types.ts`.
    ```typescript
    export interface AdminDashboardDto {
      today_occupancy_rate: number;
      total_waiting_list_count: number;
      most_popular_classes: {
        name: Class["name"];
        booking_count: number;
      }[];
    }
    ```

## 4. Szczegóły odpowiedzi

-   **Sukces (Success)**:
    -   **Kod stanu**: `200 OK`
    -   **Ciało odpowiedzi**: Obiekt JSON zgodny z typem `AdminDashboardDto`.
      ```json
      {
        "today_occupancy_rate": 0.75,
        "total_waiting_list_count": 28,
        "most_popular_classes": [
          { "name": "Advanced Yoga", "booking_count": 95 },
          { "name": "CrossFit Challenge", "booking_count": 82 }
        ]
      }
      ```
-   **Błąd (Error)**:
    -   `401 Unauthorized`: Brak sesji użytkownika.
    -   `403 Forbidden`: Użytkownik nie ma roli `STAFF`.
    -   `500 Internal Server Error`: Błąd po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia na adres `/api/admin/dashboard`.
2.  Middleware (`src/middleware/index.ts`) przechwytuje żądanie.
3.  Middleware weryfikuje istnienie aktywnej sesji użytkownika w `Astro.locals.session`. Jeśli sesja nie istnieje, zwraca `401 Unauthorized`.
4.  Middleware pobiera profil zalogowanego użytkownika i sprawdza, czy jego rola to `STAFF`. Jeśli rola jest inna, zwraca `403 Forbidden`.
5.  Po pomyślnej autoryzacji, żądanie jest przekazywane do handlera w `src/pages/api/admin/dashboard.ts`.
6.  Handler wywołuje metodę `getDashboardData()` z serwisu `AdminService` (`src/lib/services/admin.service.ts`).
7.  Metoda `getDashboardData()` wywołuje funkcję RPC `get_dashboard_kpis` w bazie danych Supabase, która wykonuje wszystkie niezbędne obliczenia i agregacje w jednej operacji.
8.  Funkcja bazodanowa zwraca zagregowane dane KPI.
9.  `AdminService` przekazuje otrzymane dane w formacie `AdminDashboardDto` do handlera.
10. Handler serializuje DTO do formatu JSON i zwraca odpowiedź z kodem stanu `200 OK`.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony wyłącznie do zalogowanych użytkowników. Middleware musi weryfikować `Astro.locals.session`.
-   **Autoryzacja**: Dostęp jest dodatkowo ograniczony do użytkowników z rolą `STAFF`. Sprawdzenie roli musi odbywać się w middleware dla wszystkich ścieżek pod `/api/admin/*`.
-   **Ochrona danych**: Dane są chronione na poziomie bazy danych przez polityki RLS, co stanowi drugą linię obrony. Jednak głównym mechanizmem zabezpieczającym dla tego endpointa jest autoryzacja na poziomie aplikacji.

## 7. Obsługa błędów

-   **Brak sesji (401)**: Middleware zwraca standardową odpowiedź błędu, jeśli `Astro.locals.session` jest `null`.
-   **Brak uprawnień (403)**: Middleware zwraca standardową odpowiedź błędu, jeśli rola użytkownika nie jest `STAFF`.
-   **Błędy serwera (500)**: W przypadku niepowodzenia wywołania funkcji RPC w Supabase lub innego nieoczekiwanego błędu, handler API powinien przechwycić wyjątek, zalogować go do konsoli (`console.error`) i zwrócić odpowiedź z kodem `500` oraz ogólną wiadomością o błędzie.

## 8. Rozważania dotyczące wydajności

-   **Agregacja danych w bazie danych**: Aby zminimalizować liczbę zapytań i obciążenie serwera aplikacji, cała logika obliczeniowa KPI zostanie zaimplementowana w dedykowanej funkcji PostgreSQL `get_dashboard_kpis()`. Takie podejście jest zgodne z zaleceniami z `db-plan.md` dotyczącymi zmaterializowanych widoków lub funkcji dla panelu administracyjnego i zapewnia maksymalną wydajność.
-   **RPC**: Wywołanie jednej funkcji RPC z serwisu jest znacznie bardziej wydajne niż wykonywanie wielu oddzielnych zapytań do bazy danych.

## 9. Etapy wdrożenia

1.  **Migracja bazy danych**:
    -   Utwórz nowy plik migracji w `supabase/migrations/`.
    -   W pliku migracji zdefiniuj funkcję PostgreSQL `get_dashboard_kpis()`, która zwraca obiekt JSON z polami: `today_occupancy_rate`, `total_waiting_list_count` i `most_popular_classes`. Funkcja ta powinna hermetyzować całą logikę SQL do obliczania tych wskaźników.

2.  **Utworzenie serwisu**:
    -   Utwórz nowy plik `src/lib/services/admin.service.ts`.
    -   Zaimplementuj klasę `AdminService` z metodą `getDashboardData(supabase: SupabaseClient)`.
    -   Wewnątrz `getDashboardData`, wywołaj funkcję RPC `get_dashboard_kpis` za pomocą dostarczonego klienta Supabase (`supabase.rpc('get_dashboard_kpis')`).
    -   Obsłuż ewentualne błędy i zwróć dane zgodne z typem `AdminDashboardDto`.

3.  **Aktualizacja Middleware**:
    -   W pliku `src/middleware/index.ts`, dodaj logikę sprawdzającą, czy ścieżka żądania pasuje do wzorca `/api/admin/*`.
    -   Dla tych ścieżek, sprawdź, czy `Astro.locals.profile.role` jest równy `STAFF`. Jeśli nie, zwróć odpowiedź `403 Forbidden`.

4.  **Implementacja punktu końcowego API**:
    -   Utwórz nowy plik `src/pages/api/admin/dashboard.ts`.
    -   Dodaj `export const prerender = false;` zgodnie z wymaganiami dla dynamicznych endpointów w Astro.
    -   Zaimplementuj handler `GET`, który:
        -   Pobiera klienta Supabase z `Astro.locals.supabase`.
        -   Tworzy instancję `AdminService`.
        -   Wywołuje `adminService.getDashboardData()` i przekazuje klienta Supabase.
        -   W bloku `try...catch` obsługuje ewentualne błędy z serwisu.
        -   Zwraca pomyślną odpowiedź (`200 OK`) z danymi DTO lub odpowiedź błędu (`500 Internal Server Error`).

5.  **Testowanie**:
    -   Napisz testy (jeśli dotyczy) lub przeprowadź ręczne testy weryfikujące:
        -   Poprawne działanie dla użytkownika z rolą `STAFF`.
        -   Odrzucenie żądania dla użytkownika bez roli `STAFF` (oczekiwany kod `403`).
        -   Odrzucenie żądania dla niezalogowanego użytkownika (oczekiwany kod `401`).
        -   Poprawność zwracanych danych KPI.
