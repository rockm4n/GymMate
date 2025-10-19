# Architektura UI dla GymMate

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji GymMate została zaprojektowana w celu obsługi dwóch głównych ról użytkowników: **Członka Klubu (MEMBER)** i **Personelu (STAFF)**. Aplikacja jest zorganizowana wokół centralnego widoku kalendarza, który stanowi rdzeń interakcji dla obu grup. Architektura kładzie nacisk na responsywność, dostępność i intuicyjność, wykorzystując dynamiczne komponenty i nawigację w celu dostosowania interfejsu do roli i kontekstu użytkownika.

Kluczowe założenia architektury:
- **Podejście komponentowe:** UI jest zbudowane z reużywalnych komponentów (np. modal, karta KPI, element listy rezerwacji), co zapewnia spójność wizualną i ułatwia rozwój.
- **Zarządzanie stanem serwera:** Stan jest zarządzany przez bibliotekę TanStack Query, co gwarantuje efektywne pobieranie danych, buforowanie i automatyczne odświeżanie interfejsu po akcjach użytkownika (mutacjach).
- **Dynamiczna nawigacja:** Struktura nawigacji dostosowuje się do roli zalogowanego użytkownika, ukrywając lub pokazując odpowiednie linki (np. do panelu administracyjnego).
- **Interakcje w modalach:** Kluczowe przepływy użytkownika, takie jak rezerwacja, anulowanie czy edycja zajęć, odbywają się w oknach modalnych, aby nie zaburzać kontekstu głównego widoku kalendarza.
- **Optymistyczne UI:** Akcje takie jak rezerwacja czy anulowanie natychmiast odzwierciedlają zmianę w interfejsie, co poprawia odczuwalną szybkość aplikacji.

## 2. Lista widoków

### Widoki Publiczne (Dostępne bez logowania)

- **Nazwa widoku:** Strona Logowania
- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania (e-mail, hasło), link do strony rejestracji.
- **Kluczowe komponenty widoku:** `LoginForm`, `TextInput` z walidacją inline, `Button`, `Toast` (do wyświetlania błędów).
- **UX, dostępność i względy bezpieczeństwa:** Jasne komunikaty o błędach. Pełna obsługa formularza za pomocą klawiatury. Transmisja danych przez HTTPS.

- **Nazwa widoku:** Strona Rejestracji
- **Ścieżka widoku:** `/register`
- **Główny cel:** Utworzenie nowego konta użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz rejestracji (e-mail, hasło, powtórz hasło), link do strony logowania.
- **Kluczowe komponenty widoku:** `RegistrationForm`, `TextInput` z walidacją inline i wskaźnikiem siły hasła, `Button`.
- **UX, dostępność i względy bezpieczeństwa:** Identyczne jak w Stronie Logowania.

### Widoki Uwierzytelnione (Dostępne po zalogowaniu)

- **Nazwa widoku:** Główny Widok Kalendarza
- **Ścieżka widoku:** `/app/schedule`
- **Główny cel:** Przeglądanie harmonogramu zajęć, rezerwacja miejsc i zarządzanie nimi. Jest to widok współdzielony przez role `MEMBER` i `STAFF`, z dodatkowymi opcjami dla `STAFF`.
- **Kluczowe informacje do wyświetlenia:** Tygodniowy harmonogram, nazwa zajęć, instruktor, wskaźnik zapełnienia, status rezerwacji użytkownika.
- **Kluczowe komponenty widoku:** `Scheduler` (responsywny komponent osi czasu/listy), `WeekNavigator`, `ClassDetailsModal` (z dynamicznie renderowanymi akcjami w zależności od roli i statusu zajęć), `Toast`.
- **UX, dostępność i względy bezpieczeństwa:** Interaktywny onboarding dla nowych użytkowników. Obsługa stanów ładowania i "pustych stanów" (brak zajęć). Pełna dostępność kalendarza z klawiatury, poprawne zarządzanie focusem w modalach. Opcje administracyjne widoczne tylko dla roli `STAFF`.

- **Nazwa widoku:** Mój Profil
- **Ścieżka widoku:** `/app/profile`
- **Główny cel:** Przeglądanie i zarządzanie swoimi rezerwacjami.
- **Kluczowe informacje do wyświetlenia:** Lista nadchodzących rezerwacji z opcją anulowania, lista historycznych rezerwacji.
- **Kluczowe komponenty widoku:** `Tabs` ("Nadchodzące", "Historyczne"), `BookingList`, `EmptyState` (gdy brak rezerwacji).
- **UX, dostępność i względy bezpieczeństwa:** Czytelne rozdzielenie rezerwacji. Przycisk anulowania jest nieaktywny, jeśli minął dopuszczalny czas (zgodnie z logiką biznesową). Dostęp tylko do własnych danych.

- **Nazwa widoku:** Panel Administracyjny (Dashboard)
- **Ścieżka widoku:** `/admin/dashboard`
- **Główny cel:** Szybki wgląd w kluczowe wskaźniki efektywności (KPI) dla personelu.
- **Kluczowe informacje do wyświetlenia:** Procent obłożenia na dzisiejszych zajęciach, łączna liczba osób na listach oczekujących, najpopularniejsze zajęcia.
- **Kluczowe komponenty widoku:** `KpiCard`, `BarChart`.
- **UX, dostępność i względy bezpieczeństwa:** Dane odświeżane automatycznie (polling). Dostęp do widoku ograniczony tylko dla użytkowników z rolą `STAFF`.

## 3. Mapa podróży użytkownika

**Główny przepływ: Rezerwacja zajęć przez Członka Klubu (MEMBER)**
1.  **Logowanie:** Użytkownik trafia na `/login`, wprowadza dane i zostaje przekierowany do `/app/schedule`.
2.  **Przeglądanie:** Użytkownik widzi kalendarz na bieżący tydzień. Używa nawigacji tygodniowej do przeglądania harmonogramu.
3.  **Interakcja:** Klika na interesujące go zajęcia, co otwiera `ClassDetailsModal`.
4.  **Decyzja i akcja:**
    - Jeśli są wolne miejsca, klika "Zarezerwuj".
    - Jeśli miejsca są zajęte, klika "Zapisz się na listę oczekujących" i widzi sugestie alternatywnych zajęć.
    - Jeśli jest już zapisany, może kliknąć "Anuluj rezerwację".
5.  **Potwierdzenie:** Interfejs jest natychmiast aktualizowany (optymistyczna aktualizacja), a użytkownik otrzymuje powiadomienie `Toast`.
6.  **Weryfikacja:** Użytkownik może nawigować do `/app/profile`, aby zobaczyć swoją rezerwację na liście "Nadchodzące".

**Główny przepływ: Odwołanie zajęć przez Personel (STAFF)**
1.  **Logowanie i nawigacja:** Użytkownik `STAFF` loguje się, może przejrzeć `/admin/dashboard`, a następnie przechodzi do `/app/schedule`.
2.  **Interakcja:** Klika na zajęcia, które chce odwołać. Otwiera się `ClassDetailsModal`.
3.  **Akcja administracyjna:** W modalu, oprócz standardowych informacji, widzi przyciski administracyjne, w tym "Odwołaj zajęcia". Klika go.
4.  **Potwierdzenie:** Po potwierdzeniu w dodatkowym oknie dialogowym, zajęcia znikają z kalendarza, a użytkownik otrzymuje powiadomienie `Toast`.

## 4. Układ i struktura nawigacji

- **Układ ogólny:**
  - **Header:** Zawiera logo aplikacji, główną nawigację i menu użytkownika. Jest stałym elementem interfejsu po zalogowaniu.
  - **Content Area:** Główny obszar, w którym renderowane są poszczególne widoki.
- **Nawigacja główna (w Header):**
  - **Dla roli `MEMBER`:**
    - `Harmonogram` -> `/app/schedule`
  - **Dla roli `STAFF`:**
    - `Dashboard` -> `/admin/dashboard`
    - `Harmonogram` -> `/app/schedule`
  - **Menu Użytkownika (rozwijane):**
    - `Mój Profil` -> `/app/profile`
    - `Wyloguj` (kończy sesję i przekierowuje do `/login`)
- **Nawigacja wewnątrz widoków:**
  - **Widok Kalendarza:** `WeekNavigator` do przełączania tygodni.
  - **Widok Profilu:** `Tabs` do przełączania między nadchodzącymi a historycznymi rezerwacjami.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić fundament interfejsu użytkownika:

- **`Scheduler`:** Centralny, responsywny komponent aplikacji. Na desktopie renderuje zajęcia na osi czasu, na mobile przełącza się w widok listy pogrupowanej dniami. Musi być w pełni dostępny z klawiatury.
- **`ClassDetailsModal`:** Okno modalne wyświetlające szczegóły zajęć. Jego zawartość i dostępne akcje (przyciski) dynamicznie dostosowują się do statusu zajęć (wolne, pełne, otwarte), statusu rezerwacji użytkownika oraz jego roli (`MEMBER` vs `STAFF`).
- **`Toast`:** Komponent do wyświetlania krótkich, globalnych powiadomień (np. po pomyślnej rezerwacji, wystąpieniu błędu).
- **`KpiCard`:** Karta używana w dashboardzie do prezentacji pojedynczego wskaźnika KPI, zawierająca tytuł, wartość i ewentualnie mały wykres trendu.
- **`BookingList`:** Lista rezerwacji używana w profilu użytkownika. Renderuje komponenty `BookingListItem` dla każdej rezerwacji.
- **`EmptyState`:** Komponent wyświetlany w miejscach, gdzie normalnie znajdowałaby się lista danych (np. lista rezerwacji, harmonogram), ale obecnie brak jest elementów do pokazania. Zawiera grafikę i krótki komunikat.
- **`FormControls` (`TextInput`, `Button`, `Select`):** Zestaw podstawowych, stylizowanych i dostępnych komponentów formularzy z wbudowaną obsługą walidacji i stanów błędów.
