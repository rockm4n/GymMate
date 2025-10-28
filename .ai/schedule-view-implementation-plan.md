# Plan implementacji widoku Głównego Widoku Kalendarza

## 1. Przegląd

Główny Widok Kalendarza to kluczowy interfejs dla użytkowników aplikacji GymMate. Jego celem jest umożliwienie członkom klubu przeglądania tygodniowego harmonogramu zajęć, rezerwowania miejsc, dołączania do list oczekujących oraz zarządzania istniejącymi rezerwacjami. Widok ten ma być interaktywny, responsywny i dostarczać wszystkich niezbędnych informacji w przejrzystej formie osi czasu.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/app/schedule` dla zalogowanych użytkowników. Będzie to główny ekran, na który użytkownik trafia po zalogowaniu.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React i osadzone na stronie Astro. Główna logika będzie zarządzana po stronie klienta.

```
/app/schedule.astro
└── ScheduleView.tsx (Główny komponent kliencki)
    ├── WeekNavigator.tsx (Nawigacja tygodniowa)
    ├── Scheduler.tsx (Kontener osi czasu)
    │   └── SchedulerItem.tsx (Pojedyncze zajęcia w harmonogramie)
    └── ClassDetailsModal.tsx (Modal ze szczegółami zajęć)
```

## 4. Szczegóły komponentów

### `ScheduleView.tsx`

- **Opis komponentu:** Główny kontener widoku, który zarządza stanem, pobiera dane z API i koordynuje działanie komponentów podrzędnych. Wykorzysta customowy hook `useSchedule` do całej logiki.
- **Główne elementy:** `WeekNavigator`, `Scheduler`, `ClassDetailsModal`. Wyświetla również stany ładowania i błędów.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji, deleguje je do komponentów podrzędnych.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ScheduleViewModel[]`
- **Propsy:** Brak.

### `WeekNavigator.tsx`

- **Opis komponentu:** Wyświetla zakres dat bieżącego tygodnia oraz przyciski do nawigacji "poprzedni" i "następny tydzień".
- **Główne elementy:** `div` zawierający tekst z datami i dwa komponenty `Button` (z biblioteki Shadcn/ui).
- **Obsługiwane interakcje:**
  - `onClick` na przycisku "poprzedni tydzień".
  - `onClick` na przycisku "następny tydzień".
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `currentWeek: Date` - Data startowa bieżącego tygodnia.
  - `onWeekChange: (newWeekStartDate: Date) => void` - Funkcja zwrotna wywoływana przy zmianie tygodnia.

### `Scheduler.tsx`

- **Opis komponentu:** Renderuje harmonogram zajęć w formie osi czasu (siatka dni i godzin na desktopie, lista na mobile). Mapuje dane `ScheduleViewModel` na komponenty `SchedulerItem`.
- **Główne elementy:** Struktura siatki (np. `div` z `grid-cols-7` na desktopie) lub lista (`ul`/`li`) na urządzeniach mobilnych, w której umieszczane są komponenty `SchedulerItem`.
- **Obsługiwane interakcje:**
  - Kliknięcie na `SchedulerItem` propaguje zdarzenie wyboru zajęć.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ScheduleViewModel[]`
- **Propsy:**
  - `classes: ScheduleViewModel[]` - Lista zajęć do wyświetlenia.
  - `onClassSelect: (classItem: ScheduleViewModel) => void` - Funkcja zwrotna wywoływana po kliknięciu na zajęcia.

### `SchedulerItem.tsx`

- **Opis komponentu:** Reprezentuje pojedynczy blok zajęć w harmonogramie. Wyświetla nazwę zajęć, instruktora i wskaźnik zapełnienia. Styl wizualny komponentu (np. kolor tła) zależy od statusu użytkownika względem zajęć (dostępne, zapisany, na liście oczekujących).
- **Główne elementy:** Klikalny `div` lub `button`, zawierający nazwę zajęć (`h3`), imię instruktora (`p`) oraz komponent `ProgressBar` (z Shadcn/ui) do wizualizacji obłożenia.
- **Obsługiwane interakcje:**
  - `onClick` na głównym elemencie.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ScheduleViewModel`
- **Propsy:**
  - `classItem: ScheduleViewModel` - Dane pojedynczych zajęć.

### `ClassDetailsModal.tsx`

- **Opis komponentu:** Modal (okno dialogowe) wyświetlający pełne informacje o wybranych zajęciach. Zawiera dynamicznie renderowane przyciski akcji w zależności od stanu zajęć i statusu użytkownika. Wyświetla również sugerowane alternatywne zajęcia, jeśli wybrane są w pełni zarezerwowane.
- **Główne elementy:** Komponent `Dialog` z Shadcn/ui zawierający tytuł, opis, datę, godzinę, instruktora oraz sekcję z przyciskami akcji (`Button`) i listę sugestii.
- **Obsługiwane interakcje:**
  - `onClick` na przycisku "Zarezerwuj".
  - `onClick` na przycisku "Anuluj rezerwację".
  - `onClick` na przycisku "Zapisz się na listę oczekujących".
  - Zamknięcie modala.
- **Obsługiwana walidacja:**
  - Przycisk "Zarezerwuj" jest nieaktywny, jeśli `isBookable` w `ScheduleViewModel` jest `false`.
  - Przycisk "Anuluj rezerwację" jest nieaktywny, jeśli `isCancellable` w `ScheduleViewModel` jest `false`.
  - Przycisk "Zapisz się na listę oczekujących" jest widoczny tylko, jeśli `isWaitlistable` w `ScheduleViewModel` jest `true`.
- **Typy:** `ScheduleViewModel`
- **Propsy:**
  - `classItem: ScheduleViewModel | null` - Dane wybranych zajęć. Jeśli `null`, modal jest ukryty.
  - `onClose: () => void` - Funkcja zwrotna do zamknięcia modala.
  - `onBook: (classId: string) => Promise<void>` - Asynchroniczna funkcja do rezerwacji.
  - `onCancel: (bookingId: string) => Promise<void>` - Asynchroniczna funkcja do anulowania rezerwacji.
  - `onJoinWaitingList: (classId: string) => Promise<void>` - Asynchroniczna funkcja do zapisu na listę oczekujących.

## 5. Typy

Kluczowe będzie stworzenie `ViewModel`, który rozszerzy istniejące `ScheduledClassDto` o logikę i stan specyficzny dla interfejsu użytkownika.

```typescript
import { ScheduledClassDto } from "../../types";

/**
 * Rozszerza ScheduledClassDto o stan specyficzny dla zalogowanego użytkownika
 * oraz o flagi ułatwiające logikę w komponentach UI.
 */
export type ScheduleViewModel = ScheduledClassDto & {
  // Status zalogowanego użytkownika względem tych zajęć
  userStatus: "BOOKED" | "WAITING_LIST" | "AVAILABLE";

  // ID rezerwacji lub zapisu na listę, potrzebne do anulowania
  bookingId: string | null;
  waitingListEntryId: string | null;

  // Flagi boolowskie do sterowania logiką UI
  isFull: boolean; // Czy zajęcia są pełne? (bookings_count >= capacity)
  hasStarted: boolean; // Czy zajęcia już się rozpoczęły? (start_time < now)
  isBookable: boolean; // Czy użytkownik może zarezerwować? (!isFull && !hasStarted && userStatus === 'AVAILABLE')
  isCancellable: boolean; // Czy użytkownik może anulować rezerwację? (userStatus === 'BOOKED' && start_time > 8 godzin od teraz)
  isWaitlistable: boolean; // Czy użytkownik może zapisać się na listę oczekujących? (isFull && !hasStarted && userStatus === 'AVAILABLE')
};
```

## 6. Zarządzanie stanem

Cała logika stanu zostanie zamknięta w customowym hooku `useSchedule`. Komponent `ScheduleView` będzie go używał do pobierania danych i akcji, co utrzyma komponenty "głupimi" (ang. dumb components) i odseparuje logikę od prezentacji.

**Hook `useSchedule` będzie zarządzał:**

- `currentWeekStartDate: Date`: Data rozpoczęcia aktualnie wyświetlanego tygodnia.
- `scheduledClasses: ScheduleViewModel[]`: Przetworzona lista zajęć na dany tydzień.
- `isLoading: boolean`: Stan ładowania danych.
- `error: Error | null`: Ewentualny błąd z API.
- `selectedClass: ScheduleViewModel | null`: Aktualnie wybrane zajęcia do wyświetlenia w modalu.

**Hook `useSchedule` będzie eksponował:**

- Aktualny stan (klasy, ładowanie, błąd, wybrana klasa).
- Funkcje do interakcji: `goToNextWeek`, `goToPreviousWeek`, `selectClass`, `bookClass`, `cancelBooking`, `joinWaitingList`.

## 7. Integracja API

Integracja z API będzie realizowana wewnątrz hooka `useSchedule` za pomocą `fetch`.

- **Pobieranie danych:**
  - Przy inicjalizacji i zmianie tygodnia, hook wykona równolegle dwa zapytania:
    1. `GET /api/scheduled-classes?start_time={week_start}&end_time={week_end}`
       - **Typ odpowiedzi:** `ScheduledClassDto[]`
    2. `GET /api/bookings/my?status=UPCOMING`
       - **Typ odpowiedzi:** `BookingDto[]`
  - Po otrzymaniu odpowiedzi, dane zostaną połączone w celu stworzenia tablicy `ScheduleViewModel[]`.

- **Wysyłanie danych (Akcje):**
  - **Rezerwacja:** `POST /api/bookings`
    - **Typ żądania:** `{ scheduled_class_id: string }`
  - **Anulowanie:** `DELETE /api/bookings/{id}`
  - **Zapis na listę ocz.:** `POST /api/waiting-list-entries`
    - **Typ żądania:** `{ scheduled_class_id: string }`
  - **Pobieranie sugestii:** `GET /api/scheduled-classes/{id}/suggestions`

Po każdej pomyślnej akcji modyfikującej dane (POST, DELETE) nastąpi ponowne pobranie danych w celu odświeżenia widoku.

## 8. Interakcje użytkownika

- **Nawigacja tygodniowa:** Kliknięcie strzałek w `WeekNavigator` zmienia stan `currentWeekStartDate` w `useSchedule`, co wyzwala ponowne pobranie i renderowanie danych.
- **Wybór zajęć:** Kliknięcie `SchedulerItem` ustawia stan `selectedClass` w `useSchedule`, co powoduje otwarcie `ClassDetailsModal`.
- **Rezerwacja / Anulowanie / Zapis na listę:** Kliknięcie przycisku akcji w modalu wywołuje odpowiednią asynchroniczną funkcję z `useSchedule`. W trakcie operacji przycisk jest nieaktywny (pokazuje spinner). Po zakończeniu operacji, użytkownik otrzymuje powiadomienie (Toast), a dane są odświeżane.

## 9. Warunki i walidacja

Walidacja jest realizowana na poziomie frontendu, aby zapewnić dobry UX, poprzez wyłączanie lub ukrywanie przycisków akcji. Opiera się ona na flagach `isBookable`, `isCancellable`, `isWaitlistable` w `ScheduleViewModel`.

- **Warunek rezerwacji:** Zajęcia nie mogą być pełne, nie mogły się zacząć, a użytkownik nie może być już na nie zapisany.
- **Warunek anulowania:** Użytkownik musi być zapisany na zajęcia, a do ich rozpoczęcia musi być więcej niż 8 godzin.
- **Warunek zapisu na listę oczekujących:** Zajęcia muszą być pełne, nie mogły się zacząć, a użytkownik nie może być już na nie zapisany (ani na listę, ani jako uczestnik).

## 10. Obsługa błędów

- **Błąd pobierania danych:** Jeśli początkowe zapytania do API zawiodą, `ScheduleView` wyświetli komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Błąd akcji (np. rezerwacji):** W przypadku niepowodzenia operacji (np. rezerwacji w ostatniej chwili, gdy ktoś inny zajął miejsce), hook `useSchedule` przechwyci błąd. Użytkownik zobaczy powiadomienie typu Toast (np. "Rezerwacja nie powiodła się. Spróbuj ponownie.") a modal pozostanie otwarty.
- **Stan pusty:** Jeśli dla danego tygodnia nie ma zaplanowanych żadnych zajęć, `Scheduler` wyświetli informację "Brak zajęć w tym tygodniu".

## 11. Kroki implementacji

1.  **Utworzenie plików komponentów:** Stworzenie pustych plików `.tsx` dla `ScheduleView`, `WeekNavigator`, `Scheduler`, `SchedulerItem` i `ClassDetailsModal` w katalogu `src/components/`.
2.  **Zdefiniowanie typu `ScheduleViewModel`:** Dodanie definicji typu w nowym pliku `src/lib/view-models.ts` lub bezpośrednio w pliku hooka.
3.  **Implementacja hooka `useSchedule`:** Stworzenie pliku `src/lib/hooks/useSchedule.ts`. Zaimplementowanie w nim logiki pobierania i łączenia danych (`GET /api/scheduled-classes` i `GET /api/bookings/my`), a także podstawowych stanów (`isLoading`, `error`, `classes`).
4.  **Implementacja `ScheduleView` i `WeekNavigator`:** Połączenie `ScheduleView` z hookiem `useSchedule`. Zbudowanie komponentu `WeekNavigator` i podpięcie jego zdarzeń do funkcji z hooka.
5.  **Implementacja `Scheduler` i `SchedulerItem`:** Zbudowanie komponentów do wyświetlania harmonogramu. Przekazanie danych z hooka i podpięcie zdarzenia `onClassSelect`. Implementacja warunkowego stylowania `SchedulerItem`.
6.  **Implementacja `ClassDetailsModal`:** Zbudowanie modala, wyświetlanie danych z `selectedClass` i implementacja warunkowego renderowania przycisków akcji na podstawie flag z `ScheduleViewModel`.
7.  **Implementacja logiki akcji:** Dodanie w hooku `useSchedule` funkcji do rezerwacji, anulowania i zapisu na listę oczekujących (wywołania `POST`/`DELETE`).
8.  **Integracja akcji z modalem:** Przekazanie funkcji akcji z hooka jako propsy do `ClassDetailsModal` i podpięcie ich do przycisków.
9.  **Obsługa Toastów i responsywności:** Dodanie powiadomień po każdej akcji. Dopracowanie stylów Tailwind CSS w celu zapewnienia responsywności harmonogramu (przełączenie na widok listy na mniejszych ekranach).
10. **Finalne testy i refaktoryzacja:** Przetestowanie wszystkich historyjek użytkownika, obsługa przypadków brzegowych i czyszczenie kodu.
