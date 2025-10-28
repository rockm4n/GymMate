# API Endpoint Implementation Plan: GET /api/scheduled-classes

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie listy zaplanowanych zajęć. Umożliwia publiczny dostęp do harmonogramu i wspiera filtrowanie wyników na podstawie podanego zakresu czasowego. Zwraca szczegółowe informacje o każdych zajęciach, w tym dane o instruktorze i aktualną liczbę zapisanych osób.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/scheduled-classes`
- **Parametry**:
  - **Opcjonalne**:
    - `start_time` (string): Data i czas w formacie ISO 8601 (np. `2025-10-20T00:00:00Z`) określająca początek okresu filtrowania.
    - `end_time` (string): Data i czas w formacie ISO 8601 (np. `2025-10-27T00:00:00Z`) określająca koniec okresu filtrowania.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **`ScheduledClassDto`**: Typ DTO używany do strukturyzowania danych w odpowiedzi. Zdefiniowany w `src/types.ts`, zawiera wszystkie niezbędne pola do wyświetlenia informacji o zaplanowanych zajęciach w interfejsie użytkownika.

## 4. Szczegóły odpowiedzi

- **Kod sukcesu**: `200 OK`
- **Struktura odpowiedzi**:
  ```json
  [
    {
      "id": "scl-1",
      "start_time": "2025-10-20T09:00:00Z",
      "end_time": "2025-10-20T10:00:00Z",
      "capacity": 20,
      "status": "SCHEDULED",
      "class": {
        "id": "cls-1",
        "name": "Yoga Flow"
      },
      "instructor": {
        "id": "ins-1",
        "full_name": "John Instructor"
      },
      "bookings_count": 15
    }
  ]
  ```
- **Treść odpowiedzi**: Tablica obiektów zgodnych z typem `ScheduledClassDto`. Tablica może być pusta, jeśli żadne zajęcia nie spełniają kryteriów wyszukiwania.

## 5. Przepływ danych

1. Klient wysyła żądanie `GET` na adres `/api/scheduled-classes`, opcjonalnie dołączając parametry `start_time` i `end_time`.
2. Handler endpointu w Astro (`src/pages/api/scheduled-classes.ts`) odbiera żądanie.
3. Parametry zapytania są walidowane za pomocą predefiniowanego schematu Zod (`src/lib/schemas/scheduled-class.schema.ts`).
4. Handler wywołuje metodę z serwisu `ScheduledClassService` (`src/lib/services/scheduled-class.service.ts`), przekazując zwalidowane parametry.
5. Serwis wykorzystuje klienta Supabase (`Astro.locals.supabase`) do wywołania funkcji RPC w bazie danych PostgreSQL (`get_scheduled_classes`). Funkcja ta jest zoptymalizowana do pobierania danych z tabel `scheduled_classes`, `classes`, `instructors` i agregowania liczby rezerwacji z `bookings`.
6. Funkcja RPC w bazie danych zwraca dane w formacie zgodnym z `ScheduledClassDto`.
7. Serwis przekazuje otrzymane dane z powrotem do handlera.
8. Handler serializuje dane do formatu JSON i wysyła odpowiedź HTTP ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Punkt końcowy jest publiczny i nie wymaga uwierzytelniania.
- **Autoryzacja**: Brak zdefiniowanych ról, dostęp otwarty dla wszystkich.
- **Walidacja danych**: Parametry zapytania są rygorystycznie walidowane przy użyciu Zod, co zapobiega przetwarzaniu nieprawidłowych lub złośliwych danych wejściowych.
- **Ochrona przed SQL Injection**: Wykorzystanie klienta Supabase i funkcji RPC z parametrami zapewnia pełną ochronę przed atakami typu SQL Injection.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy walidacja parametrów zapytania (np. format daty) zakończy się niepowodzeniem. Odpowiedź będzie zawierać obiekt JSON z opisem błędu.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu po stronie serwera, np. problemu z połączeniem z bazą danych lub błędu wewnątrz funkcji RPC. Szczegóły błędu zostaną zarejestrowane po stronie serwera, a klient otrzyma ogólną wiadomość o błędzie.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Kolumny `start_time` i `end_time` w tabeli `scheduled_classes` powinny być zaindeksowane, aby zapewnić szybkie filtrowanie po zakresie dat.
- **Optymalizacja zapytań**: Złożoność zapytania (łączenie wielu tabel i agregacja danych) jest przeniesiona do dedykowanej funkcji RPC w PostgreSQL. To podejście jest znacznie wydajniejsze niż wykonywanie wielu zapytań lub złożonego zapytania po stronie aplikacji, ponieważ minimalizuje liczbę rund do bazy danych i wykorzystuje silnik zapytań PostgreSQL do optymalizacji.
- **Paginacja**: W obecnej wersji paginacja nie jest wymagana, ale należy ją rozważyć w przyszłości, jeśli liczba zaplanowanych zajęć znacznie wzrośnie, aby uniknąć przesyłania dużych ilości danych.

## 9. Etapy wdrożenia

1. **Baza danych**:
   - Utworzyć nowy plik migracji w `supabase/migrations/`.
   - W migracji zdefiniować funkcję RPC `get_scheduled_classes(start_filter TIMESTAMPTZ, end_filter TIMESTAMPTZ)`, która będzie pobierać i agregować wszystkie wymagane dane, a następnie zwracać je w formacie zgodnym z `ScheduledClassDto`.
2. **Schema walidacji**:
   - Utworzyć plik `src/lib/schemas/scheduled-class.schema.ts`.
   - Zdefiniować w nim schemat Zod do walidacji opcjonalnych parametrów `start_time` i `end_time`.
3. **Serwis**:
   - Utworzyć plik `src/lib/services/scheduled-class.service.ts`.
   - Zaimplementować w nim funkcję `getScheduledClasses`, która przyjmuje obiekt SupabaseClient oraz opcjonalne daty, wywołuje funkcję RPC `get_scheduled_classes` i zwraca wynik.
4. **Endpoint API**:
   - Utworzyć plik `src/pages/api/scheduled-classes.ts`.
   - Zaimplementować handler `GET`, który parsuje i waliduje parametry zapytania przy użyciu schematu Zod.
   - W bloku `try...catch`, wywołać funkcję z `ScheduledClassService`, przekazując `Astro.locals.supabase`.
   - Zwrócić pomyślną odpowiedź (`200 OK`) z danymi lub odpowiedni kod błędu (`400`, `500`) w przypadku wystąpienia problemów.
