# API Endpoint Implementation Plan: POST /api/waiting-list-entries

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi dodanie siebie do listy oczekujących na określone zaplanowane zajęcia. Operacja powiedzie się tylko wtedy, gdy zajęcia istnieją, są w pełni zarezerwowane, a użytkownik nie jest już na nie zapisany ani nie znajduje się na liście oczekujących.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/waiting-list-entries`
- **Request Body**:
  ```json
  {
    "scheduled_class_id": "string (uuid)"
  }
  ```
- **Nagłówki**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <SUPABASE_JWT>` (obsługiwane przez cookie sesyjne)

## 3. Wykorzystywane typy
- **Command Model**: `CreateWaitingListEntryCommand` (`src/types.ts`) - do typowania danych wejściowych.
- **DTO**: `WaitingListEntryDto` (`src/types.ts`) - jako model danych w odpowiedzi.
- **Schema**: `CreateWaitingListEntrySchema` (`src/lib/schemas/waiting-list.schema.ts`) - schemat Zod do walidacji ciała żądania.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (201 Created)**:
  ```json
  {
    "id": "string (uuid)",
    "created_at": "string (timestamp)",
    "scheduled_class_id": "string (uuid)"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy dane wejściowe są nieprawidłowe lub logika biznesowa nie pozwala na wykonanie operacji.
  - `401 Unauthorized`: Gdy użytkownik nie jest zalogowany.
  - `404 Not Found`: Gdy zaplanowane zajęcia o podanym ID nie istnieją.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na adres `/api/waiting-list-entries` z `scheduled_class_id` w ciele.
2.  Middleware Astro weryfikuje sesję użytkownika. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`.
3.  Handler API (`/src/pages/api/waiting-list-entries.ts`) odbiera żądanie.
4.  Ciało żądania jest walidowane przy użyciu schematu Zod `CreateWaitingListEntrySchema`. W przypadku błędu walidacji zwracany jest `400 Bad Request`.
5.  Handler wywołuje funkcję `createWaitingListEntry` z nowego serwisu `WaitingListService` (`src/lib/services/waiting-list.service.ts`).
6.  `WaitingListService` wykonuje logikę biznesową:
    a. Sprawdza, czy zajęcia o podanym `scheduled_class_id` istnieją. Jeśli nie, rzuca błąd `NotFound`.
    b. Weryfikuje, czy zajęcia są w pełni zarezerwowane. Jeśli nie, rzuca błąd `BadRequest`.
    c. Sprawdza, czy użytkownik (ID z sesji) nie jest już zapisany na te zajęcia lub na liście oczekujących. Jeśli jest, rzuca błąd `BadRequest`.
    d. Wstawia nowy rekord do tabeli `waiting_list` w bazie danych Supabase.
7.  W przypadku błędu w serwisie, handler API łapie go i zwraca odpowiedni kod statusu HTTP (400, 404, 500) wraz z komunikatem błędu.
8.  Jeśli operacja w serwisie zakończy się sukcesem, handler API zwraca `201 Created` wraz z danymi nowego wpisu w formacie `WaitingListEntryDto`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony do uwierzytelnionych użytkowników poprzez middleware Astro, który weryfikuje token sesji Supabase.
- **Autoryzacja**: Identyfikator użytkownika jest pobierany bezpośrednio z sesji po stronie serwera (`context.locals.user.id`), co zapobiega możliwości dodania innego użytkownika do listy oczekujących.
- **Walidacja danych**: Ciało żądania jest ściśle walidowane za pomocą Zod, co chroni przed nieprawidłowymi danymi i potencjalnymi atakami (np. NoSQL/SQL injection).
- **Zasada najmniejszych uprawnień**: Punkt końcowy ma dostęp tylko do niezbędnych operacji na tabeli `waiting_list` i odczytu powiązanych danych.

## 7. Obsługa błędów
- Błędy walidacji Zod będą skutkować odpowiedzią `400 Bad Request` z listą błędów.
- Błędy logiki biznesowej (np. próba zapisu na niepełne zajęcia, duplikacja zapisu) będą obsługiwane w warstwie serwisu i zwracane jako `400 Bad Request`.
- Brak zasobu (nieistniejące zajęcia) zwróci `404 Not Found`.
- Niepowodzenie operacji na bazie danych z nieznanych przyczyn zwróci `500 Internal Server Error`, a szczegóły błędu zostaną zalogowane po stronie serwera.

## 8. Rozważania dotyczące wydajności
- Operacje na bazie danych są kluczowe dla wydajności. Zapytania sprawdzające stan rezerwacji, istnienie użytkownika na listach oraz operacja wstawiania powinny być zoptymalizowane.
- Użycie indeksów na kolumnach `user_id` i `scheduled_class_id` w tabeli `waiting_list` (zapewnione przez `UNIQUE` constraint) oraz na kluczach obcych jest kluczowe dla szybkiego wyszukiwania.
- Ilość zapytań do bazy danych w ramach jednej operacji powinna być zminimalizowana. Logikę weryfikacji można potencjalnie połączyć w jedną funkcję bazodanową (RPC), aby zmniejszyć liczbę zapytań sieciowych do bazy.

## 9. Etapy wdrożenia
1.  **Schemat walidacji**: Utworzyć plik `src/lib/schemas/waiting-list.schema.ts` i zdefiniować w nim schemat Zod `CreateWaitingListEntrySchema` dla `scheduled_class_id`.
2.  **Serwis**: Utworzyć plik `src/lib/services/waiting-list.service.ts`.
3.  **Implementacja logiki serwisu**: W `waiting-list.service.ts` zaimplementować funkcję `createWaitingListEntry`, która będzie zawierać całą logikę biznesową (weryfikacja, wstawianie danych).
4.  **Punkt końcowy API**: Utworzyć plik `src/pages/api/waiting-list-entries.ts`.
5.  **Implementacja handlera API**: W `waiting-list-entries.ts` zaimplementować handler `POST`, który:
    a. Użyje middleware do ochrony endpointu.
    b. Zwaliduje ciało żądania za pomocą schematu Zod.
    c. Wywoła metodę z `WaitingListService`.
    d. Obsłuży błędy i zwróci odpowiednie kody statusu oraz dane w przypadku sukcesu.
6.  **Testy**: Dodać testy integracyjne, aby zweryfikować poprawność działania punktu końcowego, w tym scenariusze sukcesu i wszystkie przypadki błędów.
