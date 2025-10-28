# Plan implementacji widoku Panel Administracyjny (Dashboard)

## 1. Przegląd

Celem tego widoku jest dostarczenie personelowi klubu (użytkownikom z rolą `STAFF`) szybkiego i czytelnego wglądu w kluczowe wskaźniki efektywności (KPI). Dashboard będzie wyświetlał dane w czasie niemal rzeczywistym dzięki mechanizmowi automatycznego odświeżania (polling), co pozwoli na bieżąco monitorować działalność klubu.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/admin/dashboard`

Dostęp do tej ścieżki będzie chroniony przez Astro middleware, które zapewni, że tylko zalogowani użytkownicy z rolą `STAFF` będą mogli go wyświetlić.

## 3. Struktura komponentów

Hierarchia komponentów dla widoku panelu administracyjnego będzie następująca:

```
- AdminDashboardPage (`/src/pages/admin/dashboard.astro`)
  - AdminLayout (`/src/layouts/AdminLayout.astro`)
    - AdminDashboardView (`/src/components/views/AdminDashboardView.tsx`) [client:load]
      - SkeletonLoader (warunkowo, podczas ładowania)
      - ErrorMessage (warunkowo, przy błędzie)
      - KpiCard (`/src/components/admin/KpiCard.tsx`)
      - KpiCard (`/src/components/admin/KpiCard.tsx`)
      - PopularClassesChart (`/src/components/admin/PopularClassesChart.tsx`)
```

## 4. Szczegóły komponentów

### `AdminDashboardView.tsx`

- **Opis komponentu**: Główny komponent React, który zarządza stanem całego widoku. Odpowiada za pobieranie danych z API, obsługę stanu ładowania i błędów, implementację mechanizmu pollingu oraz renderowanie komponentów podrzędnych z odpowiednimi danymi.
- **Główne elementy**: Wykorzystuje niestandardowy hook `useAdminDashboardData` do logiki pobierania danych. Warunkowo renderuje: komponenty szkieletowe (`Skeleton` z shadcn/ui) w stanie ładowania, komunikat o błędzie, lub kontenery z komponentami `KpiCard` i `PopularClassesChart`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji użytkownika. Komponent automatycznie odświeża dane w tle.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: `AdminDashboardDto`.
- **Propsy**: Brak.

### `KpiCard.tsx`

- **Opis komponentu**: Komponent prezentacyjny służący do wyświetlania pojedynczego wskaźnika KPI. Składa się z tytułu, wartości i opisu. Zostanie zbudowany na bazie komponentu `Card` z biblioteki shadcn/ui.
- **Główne elementy**: `Card`, `CardHeader`, `CardTitle`, `CardContent` z shadcn/ui.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: `KpiCardProps`.
- **Propsy**:
  ```typescript
  interface KpiCardProps {
    title: string;
    value: string;
    description: string;
    icon?: React.ReactNode;
  }
  ```

### `PopularClassesChart.tsx`

- **Opis komponentu**: Komponent służący do wizualizacji najpopularniejszych zajęć w formie wykresu słupkowego. Wykorzysta bibliotekę `recharts` zintegrowaną z shadcn/ui.
- **Główne elementy**: `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip` z `recharts`. Całość opakowana w komponent `Card` z shadcn/ui.
- **Obsługiwane interakcje**: Wyświetlanie szczegółów (tooltip) po najechaniu na słupek wykresu.
- **Obsługiwana walidacja**: Komponent powinien wyświetlić komunikat "Brak danych", gdy tablica z danymi jest pusta.
- **Typy**: `PopularClassesChartProps`.
- **Propsy**:
  ```typescript
  interface PopularClassesChartProps {
    data: {
      name: string;
      booking_count: number;
    }[];
  }
  ```

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy. Nie ma potrzeby tworzenia nowych.

- **`AdminDashboardDto`**: Główny DTO reprezentujący dane z endpointu.
  ```typescript
  // z src/types.ts
  export interface AdminDashboardDto {
    today_occupancy_rate: number;
    total_waiting_list_count: number;
    most_popular_classes: {
      name: string;
      booking_count: number;
    }[];
  }
  ```
  Przed przekazaniem do komponentów, dane z tego typu zostaną sformatowane (np. `today_occupancy_rate` z `0.85` na `"85%"`).

## 6. Zarządzanie stanem

Logika zarządzania stanem zostanie wyizolowana w niestandardowym hooku `useAdminDashboardData`.

- **`useAdminDashboardData.ts`**:
  - **Cel**: Enkapsulacja logiki pobierania danych, zarządzania stanami (ładowanie, błąd, sukces) oraz implementacji pollingu.
  - **Stany wewnętrzne**:
    - `data: AdminDashboardDto | null`
    - `isLoading: boolean`
    - `error: Error | null`
  - **Logika**:
    1. Używa `useEffect` do pobrania danych przy pierwszym montowaniu komponentu.
    2. Ustawia `isLoading` na `true` przed rozpoczęciem zapytania i na `false` po jego zakończeniu.
    3. W przypadku błędu, przechowuje go w stanie `error`.
    4. Używa `useEffect` do ustawienia `setInterval`, który cyklicznie (np. co 30 sekund) wywołuje funkcję pobierającą dane.
    5. Zwraca funkcję czyszczącą (`clearInterval`) w `useEffect`, aby zapobiec wyciekom pamięci.
    6. Zwraca obiekt `{ data, isLoading, error }`.

## 7. Integracja API

Integracja z API będzie realizowana poprzez wywołanie endpointu `GET /api/admin/dashboard`.

- **Żądanie**:
  - **Metoda**: `GET`
  - **URL**: `/api/admin/dashboard`
  - **Nagłówki**: `Accept: application/json`
  - **Ciało**: Brak

- **Odpowiedź (Sukces - 200 OK)**:
  - **Ciało**: Obiekt JSON zgodny z typem `AdminDashboardDto`.
  - **Obsługa**: Dane są zapisywane w stanie komponentu `AdminDashboardView` i przekazywane do komponentów podrzędnych.

- **Odpowiedź (Błąd)**:
  - **Kody**: `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.
  - **Obsługa**: Hook `useAdminDashboardData` przechwytuje błąd. Komponent `AdminDashboardView` wyświetla odpowiedni komunikat błędu na podstawie statusu odpowiedzi.

## 8. Interakcje użytkownika

- **Nawigacja do `/admin/dashboard`**:
  - **Wynik**: Użytkownik widzi stan ładowania (szkielet interfejsu), a następnie, po pomyślnym załadowaniu danych, pełny dashboard. Dane odświeżają się automatycznie.
- **Najechanie na wykres**:
  - **Wynik**: Wyświetlony zostaje tooltip ze szczegółową liczbą rezerwacji dla danych zajęć.

## 9. Warunki i walidacja

- **Warunek dostępu**: Użytkownik musi posiadać rolę `STAFF`.
  - **Weryfikacja**: Po stronie serwera (middleware).
  - **Wpływ na UI**: W przypadku braku uprawnień (`403 Forbidden`), interfejs wyświetli komunikat o braku dostępu zamiast dashboardu.
- **Puste dane**: Jeśli API zwróci pustą listę `most_popular_classes`.
  - **Weryfikacja**: W komponencie `PopularClassesChart`.
  - **Wpływ na UI**: Wykres wyświetli informację "Brak danych do wyświetlenia".

## 10. Obsługa błędów

- **Brak uprawnień (401, 403)**: Wyświetlany jest dedykowany komunikat, np. "Nie masz uprawnień do przeglądania tej strony. Skontaktuj się z administratorem."
- **Błąd serwera (500)**: Wyświetlany jest ogólny komunikat o błędzie, np. "Wystąpił błąd serwera. Spróbuj odświeżyć stronę później."
- **Błąd sieci**: Wyświetlany jest komunikat o problemie z połączeniem, np. "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."
- **Stan ładowania**: Aby uniknąć pustego ekranu i skoków layoutu (CLS), podczas ładowania danych wyświetlane będą komponenty szkieletowe (`Skeleton`) imitujące finalny wygląd dashboardu.

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - `src/pages/admin/dashboard.astro`
   - `src/components/views/AdminDashboardView.tsx`
   - `src/components/admin/KpiCard.tsx`
   - `src/components/admin/PopularClassesChart.tsx`
   - `src/lib/hooks/useAdminDashboardData.ts`
2. **Implementacja `KpiCard.tsx`**: Stworzenie komponentu w oparciu o `Card` z shadcn/ui, przyjmującego propsy `title`, `value`, `description`.
3. **Implementacja `PopularClassesChart.tsx`**:
   - Instalacja i konfiguracja `recharts`.
   - Stworzenie komponentu wykresu słupkowego, który przyjmuje props `data`.
   - Dodanie obsługi pustego stanu danych.
4. **Implementacja hooka `useAdminDashboardData.ts`**:
   - Zaimplementowanie logiki `fetch` do endpointu `/api/admin/dashboard`.
   - Dodanie zarządzania stanami `isLoading` i `error`.
   - Dodanie mechanizmu pollingu z użyciem `setInterval` i `useEffect` wraz z funkcją czyszczącą.
5. **Implementacja `AdminDashboardView.tsx`**:
   - Użycie hooka `useAdminDashboardData` do pobrania danych.
   - Implementacja logiki warunkowego renderowania dla stanów ładowania, błędu i sukcesu.
   - Stworzenie layoutu dla dashboardu (np. przy użyciu grid) i umieszczenie w nim komponentów `KpiCard` i `PopularClassesChart`.
   - Przekazanie sformatowanych danych jako propsy do komponentów podrzędnych.
6. **Implementacja strony `dashboard.astro`**:
   - Stworzenie strony Astro.
   - Import i renderowanie komponentu `AdminDashboardView.tsx` z dyrektywą `client:load`, aby zapewnić jego wykonanie po stronie klienta.
   - Dodanie odpowiedniego tytułu strony i osadzenie w głównym layout'ie administracyjnym.
7. **Testowanie i weryfikacja**:
   - Sprawdzenie poprawnego wyświetlania danych dla użytkownika z rolą `STAFF`.
   - Weryfikacja działania w przypadku braku uprawnień (przekierowanie lub komunikat o błędzie).
   - Sprawdzenie obsługi stanów ładowania i błędów.
   - Weryfikacja, czy polling działa i dane są odświeżane.
