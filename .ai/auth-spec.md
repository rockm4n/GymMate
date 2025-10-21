# Specyfikacja Techniczna: Moduł Autentykacji Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu autentykacji dla aplikacji GymMate. Specyfikacja bazuje na wymaganiach produktu (PRD) oraz zdefiniowanym stosie technologicznym (Astro, React, Supabase). Celem jest wdrożenie bezpiecznego i wydajnego systemu rejestracji, logowania, wylogowywania i odzyskiwania hasła.

## 2. Architektura Interfejsu Użytkownika

### 2.1. Nowe Strony (Astro)

W celu obsługi procesów autentykacji, zostaną utworzone następujące, publicznie dostępne strony:

-   `src/pages/login.astro`: Strona logowania, dostępna dla niezalogowanych użytkowników. Będzie renderować komponent `LoginForm`.
-   `src/pages/register.astro`: Strona rejestracji, dostępna dla niezalogowanych użytkowników. Będzie renderować komponent `RegisterForm`.
-   `src/pages/forgot-password.astro`: Strona umożliwiająca zainicjowanie procesu odzyskiwania hasła.
-   `src/pages/update-password.astro`: Strona, na którą użytkownik jest przekierowywany z linku w mailu w celu ustawienia nowego hasła.

### 2.2. Nowe Komponenty (React)

Interaktywne elementy formularzy zostaną zaimplementowane jako komponenty React, z wykorzystaniem biblioteki `shadcn/ui` w celu spójności z istniejącym UI.

-   `src/components/auth/LoginForm.tsx`: Formularz logowania z polami na e-mail i hasło. Będzie odpowiedzialny za walidację po stronie klienta oraz komunikację z Supabase Auth.
-   `src/components/auth/RegisterForm.tsx`: Formularz rejestracji z polami na e-mail, hasło i powtórzenie hasła. Podobnie jak `LoginForm`, będzie zarządzał walidacją i procesem rejestracji.
-   `src/components/auth/ForgotPasswordForm.tsx`: Prosty formularz z polem na e-mail do wysłania linku resetującego.
-   `src/components/auth/UpdatePasswordForm.tsx`: Formularz do wprowadzenia i potwierdzenia nowego hasła.
-   `src/components/auth/UserNav.tsx`: Komponent nawigacyjny, który będzie renderowany w głównym layout'cie. Dla użytkowników niezalogowanych wyświetli linki "Zaloguj się" i "Zarejestruj się". Dla zalogowanych, wyświetli menu użytkownika z opcjami "Profil" i "Wyloguj się".

### 2.3. Modyfikacja Layoutów i Komponentów

-   `src/layouts/Layout.astro`: Główny layout aplikacji zostanie zmodyfikowany, aby pobierać informacje o sesji użytkownika z `Astro.locals` (dostarczone przez middleware). Na podstawie statusu zalogowania, będzie warunkowo renderować komponent `UserNav.tsx`.
-   Strony wymagające autentykacji (np. `src/pages/app/profile.astro`, `src/pages/app/schedule.astro`) zostaną zabezpieczone na poziomie serwera. Na początku każdego pliku strony zostanie dodana weryfikacja sesji - w przypadku jej braku, użytkownik zostanie przekierowany na stronę logowania (`/login`).

### 2.4. Walidacja Formularzy i Obsługa Błędów

-   **Walidacja**: Do walidacji danych formularzy po stronie klienta i serwera zostanie użyta biblioteka `zod`. Zapewni to spójne reguły walidacji (np. format e-maila, minimalna długość hasła) w całej aplikacji.
-   **Komunikaty**: Błędy walidacji (np. "Hasła nie są zgodne") będą wyświetlane bezpośrednio pod odpowiednimi polami formularza. Błędy z API (np. "Użytkownik o podanym adresie e-mail już istnieje") będą wyświetlane jako ogólny komunikat dla formularza.
-   **Powiadomienia**: Do informowania użytkownika o pomyślnych akcjach (np. "Rejestracja zakończona pomyślnie", "Wysłano link do resetowania hasła") zostanie wykorzystany istniejący komponent `Sonner` (`src/components/ui/sonner.tsx`).

## 3. Logika Backendowa

Logika backendowa będzie w dużej mierze opierać się na integracji z Supabase, minimalizując potrzebę tworzenia własnych endpointów API dla samej autentykacji. Kluczowym elementem będzie obsługa sesji po stronie serwera w Astro.

### 3.1. Middleware (Astro)

Zostanie utworzony plik `src/middleware/index.ts`, który będzie pełnił kluczową rolę w integracji z Supabase Auth po stronie serwera.

-   **Zadania Middleware**:
    1.  Na każde przychodzące żądanie, utworzy instancję klienta Supabase dla serwera.
    2.  Odczyta i zweryfikuje sesję użytkownika na podstawie ciasteczek (`cookies`) przesłanych w żądaniu.
    3.  Udostępni instancję klienta Supabase oraz dane sesji (lub `null`) w obiekcie `Astro.locals`, dzięki czemu będą one dostępne na każdej stronie i w każdym endpoincie API renderowanym po stronie serwera.
    4.  Będzie zarządzać odświeżaniem tokenów JWT w ciasteczkach odpowiedzi.

### 3.2. Endpointy API

Nie ma potrzeby tworzenia dedykowanych endpointów API (`/api/login`, `/api/register`). Operacje te będą wykonywane bezpośrednio z komponentów klienckich (React) za pomocą biblioteki `supabase-js`, która komunikuje się z API Supabase.

### 3.3. Modele Danych

-   System będzie korzystał z wbudowanej w Supabase tabeli `auth.users` do przechowywania danych uwierzytelniających.
-   Zakłada się istnienie tabeli `public.profiles`, która przechowuje publiczne dane użytkowników i jest powiązana z `auth.users` za pomocą `user_id`. Zostanie wykorzystany mechanizm triggerów w PostgreSQL (w ramach Supabase), aby automatycznie tworzyć nowy profil po pomyślnej rejestracji użytkownika.

## 4. System Autentykacji (Integracja Astro + Supabase)

### 4.1. Konfiguracja Klienta Supabase

-   **Klient Kliencki**: Istniejący plik `src/db/supabase.client.ts` konfiguruje i eksportuje instancję klienta Supabase (`createBrowserClient`) do użytku w komponentach renderowanych w przeglądarce (React).
-   **Klient Serwerowy**: W middleware zostanie utworzona instancja klienta serwerowego (`createServerClient`) na potrzeby obsługi żądań po stronie serwera. Obie instancje będą korzystać z tych samych kluczy API z zmiennych środowiskowych.

### 4.2. Procesy Autentykacji

-   **Rejestracja**: W komponencie `RegisterForm.tsx` zostanie wywołana funkcja `supabase.auth.signUp()`. Zgodnie z wymaganiem PRD (US-001), proces zakłada automatyczne zalogowanie użytkownika. W tym celu w panelu Supabase zostanie wyłączona opcja "Confirm email". Po pomyślnej rejestracji, użytkownik zostanie przekierowany do widoku kalendarza (`/app/schedule`).
-   **Logowanie**: W `LoginForm.tsx` zostanie użyta funkcja `supabase.auth.signInWithPassword()`. Po pomyślnym zalogowaniu, biblioteka `supabase-js` automatycznie zapisze sesję w `localStorage` oraz ustawi odpowiednie ciasteczka `httpOnly` do obsługi sesji po stronie serwera. Następnie, użytkownik zostanie przekierowany do widoku kalendarza (`/app/schedule`).
-   **Wylogowanie**: W `UserNav.tsx` zostanie wywołana funkcja `supabase.auth.signOut()`, która usunie sesję z `localStorage` i wyczyści ciasteczka.
-   **Odzyskiwanie Hasła**:
    1.  Na stronie `/forgot-password`, komponent `ForgotPasswordForm.tsx` wywoła `supabase.auth.resetPasswordForEmail()`, podając adres URL do strony `/update-password` jako `redirectTo`.
    2.  Po przejściu użytkownika na stronę `/update-password` z linku w e-mailu, komponent `UpdatePasswordForm.tsx` użyje `supabase.auth.onAuthStateChange` do przechwycenia sesji odzyskiwania hasła.
    3.  Następnie, po wprowadzeniu nowego hasła, zostanie wywołana funkcja `supabase.auth.updateUser()`, aby je zaktualizować.

### 4.3. Ochrona Stron i Komponentów (Routing)

-   **Server-Side Guard**: Jak wspomniano, wszystkie strony w katalogu `src/pages/app/` będą miały na początku kodu blok weryfikujący `Astro.locals.session`. W przypadku braku sesji, nastąpi przekierowanie serwerowe (`Astro.redirect('/login')`).
-   **Client-Side Guard**: Chociaż główna ochrona będzie po stronie serwera, komponenty klienckie mogą dodatkowo nasłuchiwać na zdarzenia `onAuthStateChange` z `supabase-js`, aby dynamicznie reagować na zmiany stanu autentykacji (np. wylogowanie w innej karcie przeglądarki) i w razie potrzeby przekierować użytkownika za pomocą `window.location.href`.
