# API Endpoint Implementation Plan: `/api/profiles/me`

## 1. Przegląd punktu końcowego

Ten dokument opisuje plan wdrożenia punktów końcowych API REST do zarządzania profilem bieżącego, uwierzytelnionego użytkownika. Obejmuje on dwie operacje: pobieranie (`GET`) i aktualizację (`PATCH`) profilu użytkownika.

- **`GET /api/profiles/me`**: Zwraca dane profilowe zalogowanego użytkownika.
- **`PATCH /api/profiles/me`**: Aktualizuje dane profilowe zalogowanego użytkownika.

## 2. Szczegóły żądania

### GET /api/profiles/me

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/profiles/me`
- **Parametry**: Brak.
- **Request Body**: Brak.
- **Nagłówki**: Wymagany nagłówek `Authorization` z tokenem JWT Supabase.

### PATCH /api/profiles/me

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/profiles/me`
- **Parametry**: Brak.
- **Request Body**:
  ```json
  {
    "full_name": "Nowa Nazwa Użytkownika"
  }
  ```
- **Nagłówki**: Wymagany nagłówek `Authorization` z tokenem JWT Supabase.

## 3. Wykorzystywane typy

Do implementacji zostaną wykorzystane następujące, predefiniowane typy z `src/types.ts`:

- **DTO**: `ProfileDto` - Używany do kształtowania danych odpowiedzi dla obu punktów końcowych.
- **Command Model**: `UpdateProfileCommand` - Używany do typowania danych wejściowych dla operacji `PATCH`.

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu

- **Kod stanu**: `200 OK`
- **Struktura odpowiedzi**: Obiekt JSON reprezentujący `ProfileDto`.
  ```json
  {
    "id": "c1b2a3d4-e5f6-7890-1234-567890abcdef",
    "full_name": "Jane Doe",
    "role": "MEMBER",
    "created_at": "2025-10-18T10:00:00Z"
  }
  ```

### Odpowiedzi błędów

- **`400 Bad Request`**: Nieprawidłowe dane w ciele żądania `PATCH`.
- **`401 Unauthorized`**: Brak lub nieprawidłowy token uwierzytelniający.
- **`404 Not Found`**: Nie znaleziono profilu dla uwierzytelnionego użytkownika.
- **`500 Internal Server Error`**: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie klienta trafia do serwera Astro.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token JWT Supabase i dołącza sesję użytkownika oraz klienta Supabase do `context.locals`.
3.  Routing Astro kieruje żądanie do handlera w pliku `src/pages/api/profiles/me.ts`.
4.  Handler API pobiera użytkownika i klienta Supabase z `context.locals`. Jeśli użytkownik nie jest zalogowany, zwraca błąd `401 Unauthorized`.
5.  **Dla `PATCH`**: Handler waliduje ciało żądania przy użyciu predefiniowanego schematu Zod. W przypadku błędu walidacji zwraca `400 Bad Request`.
6.  Handler wywołuje odpowiednią metodę z `ProfileService`, przekazując klienta Supabase, ID użytkownika i (dla `PATCH`) zwalidowane dane.
7.  `ProfileService` wykonuje operację na bazie danych (SELECT lub UPDATE w tabeli `profiles`) używając klienta Supabase. Zapytania są filtrowane po `id` użytkownika, aby zapewnić, że użytkownik operuje tylko na własnych danych.
8.  Serwis zwraca wynik (dane profilu) lub zgłasza błąd.
9.  Handler API przechwytuje wynik lub błąd, formatuje odpowiedź HTTP i wysyła ją do klienta z odpowiednim kodem stanu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do obu punktów końcowych jest bezwzględnie chroniony przez mechanizm uwierzytelniania Supabase. Middleware musi skutecznie odrzucać żądania bez ważnego tokenu JWT.
- **Autoryzacja**: Logika biznesowa musi zapewnić, że operacje są wykonywane wyłącznie w kontekście zalogowanego użytkownika. Identyfikator użytkownika musi być pobierany z zaufanego źródła (sesji na serwerze, `context.locals`), a nie z parametrów żądania.
- **Walidacja danych wejściowych**: Ciało żądania `PATCH` będzie walidowane za pomocą Zod, aby upewnić się, że `full_name` jest niepustym ciągiem znaków. Chroni to przed niepoprawnymi danymi w bazie.

## 7. Rozważania dotyczące wydajności

- Operacje na tabeli `profiles` będą wykonywane z użyciem klucza podstawowego (`id`), co zapewnia wysoką wydajność zapytań do bazy danych.
- Na obecnym etapie nie przewiduje się problemów z wydajnością. W przyszłości, w przypadku dużej liczby zapytań, można rozważyć implementację warstwy cache (np. Redis) dla operacji `GET`.

## 8. Etapy wdrożenia

1.  **Stworzenie struktury plików**:
    - Utwórz plik dla endpointu: `src/pages/api/profiles/me.ts`.
    - Utwórz plik dla serwisu: `src/lib/services/profile.service.ts`.
    - Utwórz plik dla schematów walidacji: `src/lib/schemas/profile.schema.ts`.

2.  **Definicja schematu walidacji Zod**:
    - W `src/lib/schemas/profile.schema.ts`, zdefiniuj schemat dla aktualizacji profilu, wymagający `full_name` jako `string().min(1)`.

3.  **Implementacja `ProfileService`**:
    - W `src/lib/services/profile.service.ts`, stwórz klasę `ProfileService` lub wyeksportuj funkcje.
    - Zaimplementuj metodę `getUserProfile(supabase, userId)`, która pobiera i zwraca dane profilu lub `null`, jeśli nie istnieje.
    - Zaimplementuj metodę `updateUserProfile(supabase, userId, data)`, która aktualizuje `full_name` i zwraca zaktualizowany profil.

4.  **Implementacja handlerów API**:
    - W `src/pages/api/profiles/me.ts`, ustaw `export const prerender = false;`.
    - Zaimplementuj handler `GET`:
      - Pobierz użytkownika z `context.locals.user`. W przypadku braku, zwróć `401`.
      - Wywołaj `profileService.getUserProfile`.
      - W przypadku braku profilu, zwróć `404`.
      - Zwróć `ProfileDto` z kodem `200`.
    - Zaimplementuj handler `PATCH`:
      - Pobierz użytkownika. W przypadku braku, zwróć `401`.
      - Zwaliduj ciało żądania za pomocą schematu Zod. W przypadku błędu, zwróć `400`.
      - Wywołaj `profileService.updateUserProfile`.
      - Zwróć zaktualizowany `ProfileDto` z kodem `200`.

5.  **Obsługa błędów**:
    - W handlerach API, opakuj wywołania serwisów w bloki `try...catch`.
    - W bloku `catch` loguj błąd do konsoli i zwracaj odpowiedź z kodem `500 Internal Server Error` i generyczną wiadomością.
