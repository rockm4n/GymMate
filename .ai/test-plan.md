<analiza_projektu>

### 1. Kluczowe komponenty projektu

Na podstawie analizy struktury plików i kodu, zidentyfikowano następujące kluczowe komponenty aplikacji GymMate:

*   **Moduł Uwierzytelniania:**
    *   Rejestracja (`/register`), logowanie (`/login`), odzyskiwanie hasła (`/forgot-password`, `/update-password`).
    *   Komponenty React: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `UpdatePasswordForm`.
    *   Endpointy API: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/user`, `/api/auth/update-password`.
    *   Middleware (`src/middleware/index.ts`) do ochrony tras.

*   **Panel Użytkownika:**
    *   **Harmonogram zajęć (`/app/schedule`):** Główna funkcjonalność dla użytkowników. Wyświetla tygodniowy harmonogram, pozwala na nawigację między tygodniami.
        *   Komponenty React: `ScheduleView`, `Scheduler`, `WeeklyScheduleGrid`, `WeekNavigator`.
        *   Hooki: `useSchedule` do pobierania danych.
    *   **Zarządzanie rezerwacjami (`/app/profile`):** Użytkownik może przeglądać i anulować swoje rezerwacje.
        *   Komponenty React: `ProfileView`, `BookingList`, `CancelBookingDialog`.
        *   Hooki: `useMyBookings`.
    *   **Proces rezerwacji:** Logika rezerwacji i anulowania zajęć.
        *   Endpointy API: `/api/bookings` (POST, DELETE).
        *   Funkcje bazodanowe: `create_booking`.

*   **Panel Administratora (`/admin/dashboard`):**
    *   Dedykowany widok dla administratorów, prezentujący kluczowe wskaźniki (KPI) i statystyki.
    *   Komponenty React: `AdminDashboardView`, `KpiCard`, `PopularClassesChart`.
    *   Hooki: `useAdminDashboardData`.
    *   Endpointy API: `/api/admin/dashboard-kpis`, `/api/admin/popular-classes`.

*   **Baza Danych (Supabase):**
    *   Schemat bazy danych zdefiniowany w migracjach (`supabase/migrations`).
    *   Kluczowe tabele: `users`, `classes`, `scheduled_classes`, `bookings`.
    *   Funkcje PostgreSQL (`get_scheduled_classes`, `create_booking`, `get_dashboard_kpis`) zawierające logikę biznesową.

*   **Infrastruktura i UI:**
    *   Layouty Astro (`src/layouts`) definiujące strukturę stron.
    *   Komponenty UI (`src/components/ui`) z biblioteki Shadcn/ui.
    *   Konfiguracja projektu (`astro.config.mjs`, `tsconfig.json`, `package.json`).

### 2. Specyfika stosu technologicznego i wpływ na strategię testowania

*   **Astro 5:** Testowanie będzie koncentrować się na renderowaniu po stronie serwera (SSR), poprawności generowania statycznych części strony oraz integracji z komponentami React (Astro Islands). Należy zweryfikować, czy strony renderują się poprawnie i czy interaktywne "wyspy" są poprawnie hydrowane po stronie klienta.
*   **React 19:** Interaktywne komponenty (formularze, harmonogram, modale) wymagają testów jednostkowych i integracyjnych. Należy użyć `Vitest` i `React Testing Library` do testowania logiki komponentów, zarządzania stanem, interakcji użytkownika i walidacji formularzy (z `zod`).
*   **TypeScript 5:** Wykorzystanie statycznego typowania zmniejsza ryzyko błędów typów w czasie działania. Testy powinny jednak weryfikować logikę biznesową i przypadki brzegowe, których typy nie są w stanie wychwycić.
*   **Supabase (BaaS):**
    *   **Testowanie API:** Kluczowe jest testowanie integracyjne endpointów API w `src/pages/api`, które komunikują się z Supabase. Należy stworzyć osobne środowisko testowe w Supabase (np. osobny projekt), aby uniknąć modyfikacji danych produkcyjnych.
    *   **Testowanie funkcji bazodanowych:** Funkcje PostgreSQL zawierają istotną logikę biznesową (np. sprawdzanie dostępności miejsc na zajęciach). Powinny być one testowane na poziomie bazy danych przy użyciu narzędzi takich jak `pgTAP`.
    *   **Mockowanie SDK:** W testach jednostkowych (np. hooków React) klient Supabase powinien być mockowany, aby izolować testowane jednostki od zewnętrznej usługi.
*   **Github Actions:** Należy skonfigurować pipeline CI/CD, który automatycznie uruchamia wszystkie rodzaje testów (linting, testy jednostkowe, integracyjne) po każdym pushu do repozytorium, aby zapewnić ciągłą jakość kodu.

### 3. Priorytety testowe

1.  **Krytyczne (Highest Priority):**
    *   Pełny cykl uwierzytelniania (rejestracja, logowanie, wylogowanie, ochrona tras).
    *   Główny przepływ użytkownika: rezerwacja i anulowanie rezerwacji zajęć.
    *   Poprawność działania endpointów API (szczególnie tych modyfikujących dane).
    *   Poprawność działania funkcji bazodanowych (zwłaszcza `create_booking`).

2.  **Wysokie (High Priority):**
    *   Wyświetlanie harmonogramu i danych w panelu użytkownika i administratora.
    *   Walidacja formularzy po stronie klienta i serwera.
    *   Kontrola dostępu (zwykły użytkownik vs. administrator).

3.  **Średnie (Medium Priority):**
    *   Testy jednostkowe poszczególnych komponentów React.
    *   Responsywność interfejsu użytkownika (RWD).
    *   Obsługa błędów i wyświetlanie komunikatów dla użytkownika.

4.  **Niskie (Low Priority):**
    *   Testowanie statycznych stron i komponentów (np. strona główna).
    *   Testy wizualnej regresji dla komponentów UI.

### 4. Potencjalne obszary ryzyka

*   **Bezpieczeństwo i autoryzacja:** Ryzyko nieautoryzowanego dostępu do danych lub funkcji administracyjnych. Konieczne są dokładne testy middleware i logiki kontroli dostępu w endpointach API.
*   **Integralność danych:** Ryzyko związane z race conditions, np. gdy dwóch użytkowników próbuje zarezerwować ostatnie miejsce w tym samym czasie. Funkcje bazodanowe muszą być transakcyjne i odporne na takie sytuacje.
*   **Zależność od usługi zewnętrznej (Supabase):** Aplikacja jest silnie zależna od dostępności i wydajności Supabase. Należy zaimplementować mechanizmy obsługi błędów API (np. ponawianie prób, odpowiednie komunikaty dla użytkownika) i monitorować status usługi.
*   **Zarządzanie stanem po stronie klienta:** Skomplikowane komponenty, takie jak harmonogram, mogą prowadzić do błędów w zarządzaniu stanem, niespójności danych i nieoczekiwanego zachowania UI.

</analiza_projektu>

# Plan Testów Aplikacji GymMate

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje strategię, zakres, zasoby i harmonogram testów dla aplikacji GymMate. Celem jest zapewnienie wysokiej jakości, niezawodności, bezpieczeństwa i użyteczności aplikacji przed jej wdrożeniem na środowisko produkcyjne.

### 1.2. Cele testowania

*   **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie funkcje aplikacji działają zgodnie z wymaganiami.
*   **Zapewnienie jakości:** Wykrycie i eliminacja błędów we wczesnych fazach rozwoju.
*   **Walidacja bezpieczeństwa:** Sprawdzenie, czy dane użytkowników są bezpieczne i czy system jest odporny na podstawowe ataki.
*   **Ocena użyteczności:** Upewnienie się, że aplikacja jest intuicyjna i łatwa w obsłudze dla użytkownika końcowego.
*   **Zapewnienie wydajności:** Weryfikacja, czy aplikacja działa płynnie pod oczekiwanym obciążeniem.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

*   Moduł uwierzytelniania (rejestracja, logowanie, wylogowanie, reset hasła).
*   Panel użytkownika (przeglądanie harmonogramu, rezerwowanie zajęć).
*   Zarządzanie rezerwacjami (przeglądanie i anulowanie własnych rezerwacji).
*   Panel administratora (przeglądanie statystyk i KPI).
*   Ochrona tras i kontrola dostępu (role użytkownika i administratora).

### 2.2. Funkcjonalności wyłączone z testów

*   Testy obciążeniowe i wydajnościowe infrastruktury Supabase (zakładamy, że jest to odpowiedzialność dostawcy usługi).
*   Szczegółowe testy przeglądarek, które mają marginalny udział w rynku (np. Internet Explorer).

## 3. Typy testów

*   **Testy jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania pojedynczych komponentów, funkcji i hooków w izolacji.
    *   **Technologia:** Vitest, React Testing Library, TypeScript.
    *   **Zakres:** Komponenty React, funkcje pomocnicze (`/lib/utils`), logika hooków, walidacja schematów Zod.
*   **Testy integracyjne (Integration Tests):**
    *   **Cel:** Weryfikacja współpracy między różnymi częściami systemu.
    *   **Technologia:** Vitest, React Testing Library, Supertest (dla API), testowa baza danych Supabase.
    *   **Zakres:**
        *   Integracja komponentów front-endowych (np. formularz -> wywołanie hooka -> wysłanie zapytania).
        *   Testowanie endpointów API (zapytanie -> logika serwera -> odpowiedź).
        *   Testowanie funkcji bazodanowych PostgreSQL (np. przy użyciu `pgTAP`).
*   **Testy End-to-End (E2E):**
    *   **Cel:** Symulacja rzeczywistych scenariuszy użycia z perspektywy użytkownika końcowego.
    *   **Technologia:** Playwright lub Cypress.
    *   **Zakres:** Pełne ścieżki użytkownika, np. "rejestracja -> logowanie -> rezerwacja zajęć -> wylogowanie".
*   **Testy manualne (Manual Testing):**
    *   **Cel:** Eksploracyjne testowanie w celu znalezienia błędów, które trudno zautomatyzować, oraz weryfikacja użyteczności (UX).
    *   **Zakres:** Cała aplikacja, ze szczególnym uwzględnieniem interfejsu użytkownika i responsywności.
*   **Testy bezpieczeństwa (Security Testing):**
    *   **Cel:** Identyfikacja podstawowych podatności.
    *   **Zakres:**
        *   Weryfikacja ochrony endpointów API (brak dostępu bez autoryzacji).
        *   Sprawdzenie poprawności implementacji ról (admin vs. user).
        *   Podstawowe testy penetracyjne (np. próby wstrzyknięcia SQL, XSS).

## 4. Scenariusze testowe (przykłady)

### 4.1. Uwierzytelnianie

*   **Scenariusz 1:** Poprawna rejestracja nowego użytkownika.
*   **Scenariusz 2:** Próba rejestracji z zajętym adresem e-mail.
*   **Scenariusz 3:** Poprawne logowanie i przekierowanie do panelu.
*   **Scenariusz 4:** Próba logowania z błędnym hasłem.
*   **Scenariusz 5:** Próba dostępu do chronionej trasy (`/app/schedule`) bez zalogowania.
*   **Scenariusz 6:** Poprawne wylogowanie i unieważnienie sesji.

### 4.2. Rezerwacja zajęć

*   **Scenariusz 1:** Zalogowany użytkownik pomyślnie rezerwuje miejsce na zajęciach z wolnymi miejscami.
*   **Scenariusz 2:** Użytkownik próbuje zarezerwować miejsce na zajęciach, gdzie nie ma wolnych miejsc.
*   **Scenariusz 3:** Użytkownik próbuje zarezerwować te same zajęcia po raz drugi.
*   **Scenariusz 4:** Użytkownik pomyślnie anuluje swoją rezerwację.

### 4.3. Panel Administratora

*   **Scenariusz 1:** Użytkownik z rolą `user` próbuje uzyskać dostęp do `/admin/dashboard` i zostaje przekierowany.
*   **Scenariusz 2:** Użytkownik z rolą `admin` pomyślnie uzyskuje dostęp do `/admin/dashboard` i widzi poprawne dane.

## 5. Środowisko testowe

*   **Środowisko lokalne:** Programiści uruchamiają testy jednostkowe i integracyjne na swoich maszynach.
*   **Środowisko CI (Continuous Integration):** Github Actions, które uruchamia pełen zestaw zautomatyzowanych testów po każdym pushu do gałęzi `master` lub `develop`.
*   **Środowisko Staging:** Dedykowana instancja aplikacji połączona z testowym projektem Supabase. Na tym środowisku przeprowadzane są testy E2E i manualne testy akceptacyjne.
*   **Baza danych:** Oddzielny projekt w Supabase na potrzeby testów, zasilany danymi testowymi (`seed.sql`).

## 6. Narzędzia do testowania

*   **Test runner:** Vitest
*   **Biblioteka do testowania komponentów:** React Testing Library
*   **Testy E2E:** Playwright
*   **Testowanie API:** Supertest (w ramach testów integracyjnych), Postman (manualnie)
*   **Testowanie bazy danych:** pgTAP
*   **CI/CD:** Github Actions
*   **Zarządzanie projektem i błędami:** GitHub Issues

## 7. Harmonogram testów

Testowanie jest procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania.

*   **Testy jednostkowe i integracyjne:** Pisane na bieżąco przez deweloperów wraz z nowymi funkcjonalnościami.
*   **Testy E2E:** Rozwijane równolegle z głównymi funkcjonalnościami.
*   **Testy manualne / akceptacyjne:** Przeprowadzane na środowisku Staging przed każdym wdrożeniem na produkcję.
*   **Testy regresji:** Uruchamiane automatycznie (jednostkowe, integracyjne, E2E) przed każdym wdrożeniem.

## 8. Kryteria akceptacji testów

*   **Kryterium wejścia:** Nowa funkcjonalność jest gotowa do testów, gdy kod został zintegrowany z główną gałęzią deweloperską i wdrożony na środowisko Staging.
*   **Kryterium wyjścia (Definition of Done):**
    *   Wszystkie testy jednostkowe i integracyjne dla danej funkcjonalności przechodzą pomyślnie (pokrycie kodu na poziomie > 80%).
    *   Kluczowe scenariusze E2E przechodzą pomyślnie.
    *   Nie istnieją żadne otwarte błędy krytyczne lub blokujące.
    *   Wszystkie znalezione błędy o wysokim priorytecie zostały naprawione.
    *   Plan testów został zrealizowany.

## 9. Role i odpowiedzialności

*   **Deweloperzy:**
    *   Pisanie testów jednostkowych i integracyjnych dla tworzonego kodu.
    *   Naprawianie błędów zgłoszonych przez QA.
    *   Utrzymywanie i konfiguracja środowiska CI/CD.
*   **Inżynier QA / Tester:**
    *   Tworzenie i utrzymanie planu testów.
    *   Projektowanie i implementacja testów E2E.
    *   Przeprowadzanie testów manualnych i eksploracyjnych.
    *   Raportowanie i weryfikacja błędów.
*   **Product Owner / Manager:**
    *   Definiowanie wymagań i kryteriów akceptacji.
    *   Uczestnictwo w testach akceptacyjnych.

## 10. Procedury raportowania błędów

Wszystkie znalezione błędy będą raportowane w systemie **GitHub Issues**. Każde zgłoszenie powinno zawierać:

*   **Tytuł:** Zwięzły opis błędu.
*   **Opis:**
    *   Kroki do reprodukcji błędu.
    *   Oczekiwany rezultat.
    *   Aktualny (błędny) rezultat.
*   **Środowisko:** (np. przeglądarka, system operacyjny, środowisko testowe).
*   **Priorytet:** (Krytyczny, Wysoki, Średni, Niski).
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.

Każdy błąd będzie przechodził przez cykl życia: `New` -> `In Progress` -> `Ready for QA` -> `Closed` / `Reopened`.
