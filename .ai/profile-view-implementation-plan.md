# Plan implementacji widoku Mój Profil

## 1. Przegląd
Widok "Mój Profil" jest dedykowaną sekcją dla zalogowanych użytkowników, umożliwiającą im zarządzanie swoimi rezerwacjami na zajęcia. Głównym celem tego widoku jest zapewnienie użytkownikom przejrzystego dostępu do listy ich nadchodzących oraz historycznych rezerwacji, a także umożliwienie anulowania nadchodzących rezerwacji zgodnie z obowiązującymi zasadami biznesowymi.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką dla uwierzytelnionych użytkowników:
- **Ścieżka:** `/app/profile`

Strona zostanie zaimplementowana jako plik Astro (`src/pages/app/profile.astro`), który będzie renderował główny komponent Reactowy z dyrektywą `client:load`.

## 3. Struktura komponentów
Hierarchia komponentów dla widoku "Mój Profil" została zaprojektowana w celu zapewnienia reużywalności i separacji odpowiedzialności.

```
/app/profile.astro
└── ProfileView (React)
    ├── Tabs (Shadcn/ui)
    │   ├── TabsList
    │   │   ├── TabsTrigger ("Nadchodzące")
    │   │   └── TabsTrigger ("Historyczne")
    │   ├── TabsContent ("Nadchodzące")
    │   │   └── BookingTabContent (status="UPCOMING")
    │   │       ├── BookingList
    │   │       │   └── BookingListItem[]
    │   │       │       └── Button ("Anuluj") -> CancelBookingDialog
    │   │       └── EmptyState
    │   └── TabsContent ("Historyczne")
    │       └── BookingTabContent (status="HISTORICAL")
    │           ├── BookingList
    │           │   └── BookingListItem[]
    │           └── EmptyState
    └── CancelBookingDialog (Shadcn/ui AlertDialog)
```

## 4. Szczegóły komponentów

### ProfileView
- **Opis komponentu**: Główny kontener widoku, który zarządza stanem aktywnych zakładek oraz logiką anulowania rezerwacji.
- **Główne elementy**: Wykorzystuje komponent `Tabs` z biblioteki Shadcn/ui do nawigacji między listą rezerwacji nadchodzących i historycznych. Renderuje komponent `BookingTabContent` dla aktywnej zakładki.
- **Obsługiwane interakcje**: Zmiana aktywnej zakładki.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `BookingViewModel`.
- **Propsy**: Brak.

### BookingTabContent
- **Opis komponentu**: Komponent odpowiedzialny za pobieranie i wyświetlanie listy rezerwacji dla danego statusu (`UPCOMING` lub `HISTORICAL`).
- **Główne elementy**: Warunkowo renderuje `BookingList` (gdy są dane), `EmptyState` (gdy brak danych) lub wskaźnik ładowania.
- **Obsługiwane interakcje**: Przekazuje zdarzenie anulowania rezerwacji do komponentu nadrzędnego.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `BookingViewModel`.
- **Propsy**: `status: 'UPCOMING' | 'HISTORICAL'`, `onCancelBooking: (bookingId: string) => void`.

### BookingList
- **Opis komponentu**: Renderuje listę rezerwacji, iterując po dostarczonej tablicy i wyświetlając dla każdego elementu komponent `BookingListItem`.
- **Główne elementy**: Lista (`ul` lub `div`) zawierająca zmapowane komponenty `BookingListItem`.
- **Obsługiwane interakcje**: Przekazuje zdarzenie anulowania rezerwacji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `BookingViewModel[]`.
- **Propsy**: `bookings: BookingViewModel[]`, `onCancelClick: (bookingId: string) => void`.

### BookingListItem
- **Opis komponentu**: Wyświetla szczegóły pojedynczej rezerwacji, takie jak nazwa zajęć, instruktor, data i godzina. Zawiera przycisk do anulowania rezerwacji.
- **Główne elementy**: Elementy tekstowe (`p`, `span`), `Button` z Shadcn/ui.
- **Obsługiwane interakcje**: Kliknięcie przycisku "Anuluj rezerwację".
- **Obsługiwana walidacja**: Przycisk "Anuluj rezerwację" jest wyłączony (`disabled`), jeśli rezerwacji nie można anulować (flaga `isCancellable` jest `false`).
- **Typy**: `BookingViewModel`.
- **Propsy**: `booking: BookingViewModel`, `onCancelClick: (bookingId: string) => void`.

### CancelBookingDialog
- **Opis komponentu**: Dialogowe okno potwierdzenia (modal) oparte na `AlertDialog` z Shadcn/ui, które zabezpiecza przed przypadkowym anulowaniem rezerwacji.
- **Główne elementy**: Tytuł, opis, przycisk potwierdzający i przycisk anulujący.
- **Obsługiwane interakcje**: Potwierdzenie lub anulowanie operacji usunięcia rezerwacji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => void`.

## 5. Typy
Do prawidłowej implementacji widoku, oprócz istniejącego `BookingDto`, konieczne jest zdefiniowanie nowego typu `BookingViewModel`, który dostosuje dane z API do potrzeb interfejsu użytkownika.

- **`BookingDto` (istniejący typ z `src/types.ts`)**: Reprezentuje surowe dane rezerwacji otrzymane z API.

- **`BookingViewModel` (nowy typ)**: Rozszerza `BookingDto` o dodatkowe, obliczone po stronie klienta pola, ułatwiające renderowanie i logikę w komponentach.
  ```typescript
  export interface BookingViewModel {
    id: string;                      // ID rezerwacji
    className: string;               // Nazwa zajęć
    instructorName: string | null;   // Imię i nazwisko instruktora
    startTime: Date;                 // Czas rozpoczęcia jako obiekt Date
    endTime: Date;                   // Czas zakończenia jako obiekt Date
    formattedDate: string;           // Sformatowana data, np. "20 października 2025"
    formattedTime: string;           // Sformatowany czas, np. "09:00 - 10:00"
    isCancellable: boolean;          // Flaga, czy rezerwację można anulować
    isHistorical: boolean;           // Flaga, czy rezerwacja jest historyczna
  }
  ```

## 6. Zarządzanie stanem
Zarządzanie stanem komponentu `ProfileView` i jego komponentów podrzędnych zostanie zrealizowane przy użyciu customowego hooka `useMyBookings`.

- **Custom Hook: `useMyBookings`**
  - **Cel**: Enkapsulacja całej logiki związanej z pobieraniem danych, zarządzaniem stanem ładowania i błędów oraz anulowaniem rezerwacji.
  - **Zarządzany stan**:
    - `upcomingBookings: BookingViewModel[]`
    - `historicalBookings: BookingViewModel[]`
    - `isLoading: boolean`
    - `error: Error | null`
    - `bookingToCancelId: string | null` (do zarządzania dialogiem potwierdzającym)
  - **Udostępniane funkcje**:
    - `fetchBookings(status: 'UPCOMING' | 'HISTORICAL')`
    - `cancelBooking()`
    - `openCancelDialog(bookingId: string)`
    - `closeCancelDialog()`

## 7. Integracja API
Integracja z backendem będzie opierać się na dwóch endpointach API.

- **Pobieranie rezerwacji**:
  - **Endpoint**: `GET /api/bookings/my`
  - **Parametry**: `status` (`UPCOMING` lub `HISTORICAL`)
  - **Typ odpowiedzi**: `BookingDto[]`
  - **Użycie**: Wywoływany przy montowaniu komponentu `BookingTabContent` oraz przy każdej zmianie zakładki w celu pobrania odpowiedniej listy rezerwacji.

- **Anulowanie rezerwacji**:
  - **Endpoint**: `DELETE /api/bookings/{id}`
  - **Typ odpowiedzi**: `204 No Content`
  - **Użycie**: Wywoływany po potwierdzeniu przez użytkownika chęci anulowania rezerwacji w `CancelBookingDialog`.

## 8. Interakcje użytkownika
- **Przełączanie zakładek**: Użytkownik klika na zakładkę "Nadchodzące" lub "Historyczne". Powoduje to wywołanie funkcji `fetchBookings` z odpowiednim statusem i zaktualizowanie wyświetlanej listy.
- **Anulowanie rezerwacji**:
  1. Użytkownik klika przycisk "Anuluj rezerwację" przy konkretnej pozycji na liście nadchodzących rezerwacji.
  2. Otwiera się `CancelBookingDialog` z prośbą o potwierdzenie.
  3. Użytkownik klika "Potwierdź".
  4. Wywoływana jest funkcja `cancelBooking`, która wysyła żądanie `DELETE` do API.
  5. Interfejs jest optymistycznie aktualizowany (rezerwacja jest natychmiast usuwana z listy).
  6. Wyświetlane jest powiadomienie toast o sukcesie.

## 9. Warunki i walidacja
- **Dostępność anulowania rezerwacji**:
  - **Warunek**: Anulowanie jest możliwe tylko na więcej niż 8 godzin przed rozpoczęciem zajęć (`new Date() < new Date(booking.startTime.getTime() - 8 * 60 * 60 * 1000)`).
  - **Komponent**: `BookingListItem`.
  - **Wpływ na interfejs**: Przycisk "Anuluj rezerwację" ma atrybut `disabled`, jeśli warunek nie jest spełniony. Dodatkowo, `Tooltip` może informować użytkownika o przyczynie blokady.

## 10. Obsługa błędów
- **Błąd pobierania danych**: Jeśli żądanie `GET /api/bookings/my` zakończy się niepowodzeniem, w miejscu listy rezerwacji zostanie wyświetlony komunikat o błędzie.
- **Błąd anulowania rezerwacji**:
  - Jeśli żądanie `DELETE /api/bookings/{id}` zwróci błąd, optymistyczna aktualizacja UI zostanie cofnięta (usunięty element wróci na listę).
  - Użytkownik zobaczy powiadomienie toast z informacją o błędzie (np. "Nie udało się anulować rezerwacji. Spróbuj ponownie.").
- **Brak rezerwacji**: Jeśli API zwróci pustą tablicę, komponent `EmptyState` wyświetli stosowną informację (np. "Brak nadchodzących rezerwacji").

## 11. Kroki implementacji
1.  **Stworzenie struktury plików**:
    -   Utworzenie pliku strony Astro: `src/pages/app/profile.astro`.
    -   Utworzenie plików dla komponentów React: `src/components/ProfileView.tsx`, `src/components/BookingTabContent.tsx`, `src/components/BookingList.tsx`, `src/components/BookingListItem.tsx` oraz `src/components/EmptyState.tsx`.
2.  **Zdefiniowanie typów**: Wprowadzenie typu `BookingViewModel` do pliku `src/types.ts` lub lokalnie w `ProfileView`.
3.  **Implementacja `useMyBookings`**: Stworzenie customowego hooka z całą logiką zarządzania stanem, pobierania i anulowania rezerwacji.
4.  **Implementacja komponentów (Bottom-up)**:
    -   Zaimplementowanie `BookingListItem`, w tym logiki warunkowego wyłączania przycisku anulowania.
    -   Zaimplementowanie `BookingList` do renderowania listy `BookingListItem`.
    -   Zaimplementowanie `BookingTabContent` do obsługi stanów ładowania, błędu i braku danych.
    -   Złożenie całości w `ProfileView`, implementując obsługę zakładek `Tabs`.
5.  **Integracja z API**: Podłączenie wywołań `fetch` w `useMyBookings` do odpowiednich endpointów API.
6.  **Obsługa anulowania**: Zaimplementowanie logiki `CancelBookingDialog` i połączenie jej ze stanem zarządzanym przez `useMyBookings`.
7.  **Stylowanie i UX**: Dopracowanie wyglądu komponentów przy użyciu Tailwind CSS i dodanie powiadomień toast (np. z `sonner`) dla lepszego doświadczenia użytkownika.
8.  **Renderowanie na stronie**: Umieszczenie komponentu `ProfileView` w pliku `profile.astro` z odpowiednią dyrektywą `client:`.
