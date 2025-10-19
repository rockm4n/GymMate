# API Endpoint Implementation Plan: POST /api/bookings

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowej rezerwacji na określone zajęcia w harmonogramie. Po pomyślnym utworzeniu rezerwacji, zwraca pełne dane rezerwacji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/bookings`
- **Nagłówki**:
  - `Content-Type: application/json`
- **Ciało żądania**: Obiekt JSON zawierający identyfikator zaplanowanych zajęć.
  ```json
  {
    "scheduled_class_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
  ```

## 3. Wykorzystywane typy
- **Command Model (wejście)**: `CreateBookingCommand` z `src/types.ts`.
  ```typescript
  export type CreateBookingCommand = Pick<TablesInsert<"bookings">, "scheduled_class_id">;
  ```
- **DTO (wyjście)**: `BookingDto` z `src/types.ts`.
  ```typescript
  export type BookingDto = Pick<Booking, "id" | "created_at"> & {
    scheduled_class: Pick<ScheduledClass, "id" | "start_time" | "end_time"> & {
      class: Pick<Class, "name">;
      instructor: Pick<Instructor, "full_name"> | null;
    };
  };
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod statusu**: `201 Created`
  - **Ciało odpowiedzi**: Obiekt `BookingDto` nowo utworzonej rezerwacji.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe lub naruszenie logiki biznesowej.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Podane `scheduled_class_id` nie istnieje.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST /api/bookings` z `scheduled_class_id` w ciele.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT użytkownika i dołącza sesję do `context.locals`.
3.  Handler API `POST` w `src/pages/api/bookings.ts` otrzymuje żądanie.
4.  Handler waliduje ciało żądania za pomocą schemy Zod (`createBookingSchema`). W przypadku błędu zwraca `400 Bad Request`.
5.  Handler sprawdza, czy `context.locals.user` istnieje. W przypadku braku, zwraca `401 Unauthorized`.
6.  Handler wywołuje funkcję `createBooking` z serwisu `booking.service.ts`, przekazując `supabaseClient`, `userId` oraz zwalidowane dane.
7.  `booking.service.ts` wykonuje logikę biznesową:
    a. Sprawdza, czy zajęcia o podanym ID istnieją i czy ich status pozwala na zapisy. Jeśli nie, zwraca błąd, który handler mapuje na `404 Not Found` lub `400 Bad Request`.
    b. Sprawdza, czy są wolne miejsca, porównując aktualną liczbę rezerwacji z `capacity`. Jeśli nie, zwraca błąd (`400 Bad Request`).
    c. Próbuje wstawić nowy rekord do tabeli `bookings`. Dzięki constraintowi `unique_booking`, próba zapisu przez tego samego użytkownika na te same zajęcia zakończy się błędem bazy danych, który zostanie obsłużony i zwrócony jako `400 Bad Request`.
    d. Po pomyślnym wstawieniu rekordu, pobiera dane rezerwacji wraz z powiązanymi danymi (zajęcia, instruktor), aby zbudować obiekt `BookingDto`.
8.  Serwis zwraca `BookingDto` do handlera.
9.  Handler wysyła odpowiedź `201 Created` z `BookingDto` w ciele.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wszystkie żądania muszą być uwierzytelnione za pomocą ważnego tokenu JWT Supabase. Dostęp do punktu końcowego bez uwierzytelnienia zostanie zablokowany.
- **Autoryzacja**: Identyfikator użytkownika (`user_id`) używany do tworzenia rezerwacji jest pobierany wyłącznie z sesji serwerowej (`context.locals.user.id`), co zapobiega podszywaniu się pod innych użytkowników.
- **Walidacja danych**: Użycie Zod do walidacji `scheduled_class_id` chroni przed atakami typu SQL Injection oraz błędami wynikającymi z niepoprawnego formatu danych.

## 7. Rozważania dotyczące wydajności
- **Atomowość operacji**: Sprawdzenie pojemności zajęć i utworzenie rezerwacji powinno być operacją atomową, aby uniknąć race conditions. Zaleca się stworzenie funkcji `RPC` w PostgreSQL (Supabase), która zamknie tę logikę w jednej transakcji.
- **Indeksowanie**: Tabela `bookings` powinna mieć indeksy na kolumnach `user_id` i `scheduled_class_id`, aby przyspieszyć wyszukiwanie. Constraint `UNIQUE` automatycznie tworzy taki indeks.
- **Zapytania**: Zapytanie budujące `BookingDto` będzie wymagało kilku złączeń (JOIN). Należy zadbać o jego optymalizację, aby zminimalizować czas odpowiedzi.

## 8. Etapy wdrożenia
1.  **Schema Walidacji**: Utworzyć plik `src/lib/schemas/booking.schema.ts` i zdefiniować w nim `createBookingSchema` używając Zod do walidacji `scheduled_class_id` (musi być stringiem w formacie `uuid`).
2.  **Serwis**: Stworzyć plik `src/lib/services/booking.service.ts`.
3.  **Logika Serwisu**: Zaimplementować funkcję `createBooking` w `booking.service.ts`. Funkcja ta powinna zawierać całą logikę biznesową opisaną w sekcji "Przepływ danych". Rozważyć implementację części logiki jako funkcji RPC w Supabase w celu zapewnienia atomowości.
4.  **Endpoint API**: Utworzyć plik `src/pages/api/bookings.ts`.
5.  **Handler POST**: W `src/pages/api/bookings.ts` zaimplementować handler `POST`, który:
    - Używa `export const prerender = false`.
    - Pobiera `supabaseClient` i `user` z `context.locals`.
    - Waliduje ciało żądania za pomocą `createBookingSchema`.
    - Wywołuje `booking.service.ts` z odpowiednimi parametrami.
    - Obsługuje błędy zwrócone przez serwis i mapuje je na odpowiednie kody statusu HTTP.
    - Zwraca `201 Created` z `BookingDto` w przypadku sukcesu.
6.  **Testy**: Dodać testy integracyjne dla serwisu oraz testy end-to-end dla endpointu API, aby zweryfikować poprawność działania, obsługę błędów i przypadki brzegowe.
