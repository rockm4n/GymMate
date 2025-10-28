# Dokument wymagań produktu (PRD) - GymMate

## 1. Przegląd produktu

GymMate to aplikacja internetowa w wersji MVP (Minimum Viable Product), której celem jest usprawnienie zarządzania harmonogramem zajęć i rezerwacjami w klubach fitness. Aplikacja ma na celu rozwiązanie problemu manualnego zarządzania rezerwacjami, które prowadzi do błędów i frustracji zarówno wśród członków klubu, jak i personelu.

Produkt skierowany jest do dwóch głównych grup użytkowników:

- Członkowie klubu fitness, którzy potrzebują prostego i dostępnego 24/7 narzędzia do przeglądania grafiku, rezerwowania miejsc na zajęciach i zarządzania swoimi rezerwacjami.
- Personel klubu fitness (administratorzy, recepcjoniści), którzy potrzebują efektywnego narzędzia do zarządzania harmonogramem zajęć i monitorowania kluczowych wskaźników operacyjnych.

Główną wartością aplikacji jest automatyzacja i cyfryzacja procesu rezerwacji, co przekłada się na oszczędność czasu, redukcję błędów administracyjnych, zwiększenie frekwencji na zajęciach oraz poprawę ogólnego zadowolenia członków klubu.

## 2. Problem użytkownika

Manualne zarządzanie harmonogramem zajęć w klubach fitness prowadzi do podwójnych rezerwacji, pomyłek w zapisach oraz frustracji członków, którzy nie mogą łatwo sprawdzić dostępności zajęć i dokonać rezerwacji poza godzinami pracy recepcji. To skutkuje niską frekwencją na zajęciach, wysokimi wskaźnikami rezygnacji z członkostwa oraz nadmiernym obciążeniem pracowników administracyjnych. System GymMate ma na celu bezpośrednie rozwiązanie tych problemów poprzez dostarczenie zautomatyzowanej, niezawodnej i łatwo dostępnej platformy do zarządzania rezerwacjami.

## 3. Wymagania funkcjonalne

### 3.1. Funkcjonalności dla Członka Klubu (Użytkownik)

- Autentykacja: Możliwość rejestracji nowego konta (e-mail, hasło) i logowania.
- Profil Użytkownika: Dostęp do panelu z podglądem nadchodzących i historycznych rezerwacji.
- Kalendarz Zajęć: Przejrzysty, tygodniowy widok harmonogramu zajęć w formie osi czasu (timeline/scheduler).
- Widok Szczegółów Zajęć: Każda pozycja w kalendarzu musi wyświetlać nazwę zajęć, imię instruktora oraz graficzny wskaźnik dostępności miejsc (progress bar).
- System Rezerwacji: Dostępny 24/7, pozwalający na rezerwację miejsc na zajęciach z limitem miejsc oraz informujący o zajęciach otwartych (bez rezerwacji).
- Lista Oczekujących: Możliwość zapisu na listę oczekujących jednym kliknięciem, gdy na zajęciach brakuje wolnych miejsc.
- Sugestie Alternatywnych Zajęć: W przypadku pełnej rezerwacji, system powinien proponować alternatywne terminy tych samych zajęć lub zajęcia z tej samej kategorii.
- Anulowanie Rezerwacji: Użytkownik może samodzielnie anulować swoją rezerwację do 8 godzin przed rozpoczęciem zajęć.
- System Powiadomień: Automatyczne przypomnienia e-mail wysyłane 24 godziny przed zarezerwowanymi zajęciami. Automatyczne powiadomienia e-mail dla wszystkich osób na liście oczekujących o zwolnieniu się miejsca.
- Onboarding Użytkownika: Interaktywny przewodnik (np. product tour) uruchamiany podczas pierwszej wizyty w aplikacji, wyjaśniający kluczowe funkcjonalności.

### 3.2. Funkcjonalności dla Personelu Klubu (Panel Administracyjny)

- Dashboard: Główny panel administracyjny wyświetlający 3-4 kluczowe wskaźniki efektywności (KPIs), np. obłożenie na dzisiejszych zajęciach, liczba osób na listach oczekujących, popularność poszczególnych zajęć.
- Zarządzanie Harmonogramem: Pełna kontrola nad kalendarzem zajęć, w tym dodawanie, edytowanie i usuwanie zajęć.
- Priorytetowe Akcje Administracyjne: Interfejs zoptymalizowany pod kątem szybkiej zmiany instruktora prowadzącego zajęcia oraz odwoływania zajęć z automatycznym powiadomieniem zapisanych uczestników.

## 4. Granice produktu

### 4.1. W zakresie MVP

- Tygodniowy kalendarz zajęć w stylu scheduler/timeline.
- System rezerwacji online dostępny 24/7.
- Rozróżnienie na zajęcia ogólnodostępne i wymagające rezerwacji z limitem miejsc.
- Podstawowy system kont użytkowników do zarządzania rezerwacjami.
- Automatyczne przypomnienia o zajęciach wysyłane e-mailem.
- Listy oczekujących z automatycznymi powiadomieniami o wolnych miejscach.
- Możliwość anulowania rezerwacji do 8 godzin przed rozpoczęciem zajęć.
- Podstawowy panel administracyjny dla personelu.
- Obsługa jednego, uniwersalnego typu członkostwa/karnetu.

### 4.2. Poza zakresem MVP

- Zaawansowany system płatności online.
- Dedykowana aplikacja mobilna (wersja webowa będzie responsywna).
- Integracje z urządzeniami wearables i zewnętrznymi aplikacjami fitness.
- System lojalnościowy, gamifikacja i programy poleceń.
- Zaawansowane analityki i raporty dla administratorów.
- Moduł treningu personalnego i konsultacji dietetycznych.
- Wewnętrzny komunikator (chat).
- System oceniania instruktorów i zajęć.
- Obsługa wielu lokalizacji klubu.
- Personalizacja kanałów i czasu wysyłki powiadomień.

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do systemu rezerwacji.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola: adres e-mail, hasło, powtórz hasło.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System wymaga, aby hasło miało co najmniej 8 znaków.
  4. System sprawdza, czy oba wprowadzone hasła są identyczne.
  5. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do widoku kalendarza.
  6. W przypadku, gdy e-mail jest już zarejestrowany, wyświetlany jest odpowiedni komunikat błędu.

- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto przy użyciu adresu e-mail i hasła, aby zarządzać moimi rezerwacjami.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola: adres e-mail, hasło.
  2. Po poprawnym zalogowaniu użytkownik jest przekierowywany do widoku kalendarza.
  3. W przypadku podania błędnych danych logowania, wyświetlany jest odpowiedni komunikat.

### 5.2. Członek Klubu - Interakcja z Systemem

- ID: US-003
- Tytuł: Przeglądanie harmonogramu zajęć
- Opis: Jako członek klubu, chcę zobaczyć cały harmonogram na dany tydzień w przejrzystym widoku, aby zaplanować swoje treningi.
- Kryteria akceptacji:
  1. Domyślnym widokiem po zalogowaniu jest kalendarz bieżącego tygodnia.
  2. Kalendarz jest przedstawiony w formie osi czasu (timeline) z dniami tygodnia i godzinami.
  3. Każde zajęcia w kalendarzu wyświetlają: nazwę, imię instruktora, godzinę rozpoczęcia i zakończenia.
  4. Dla zajęć z limitem miejsc widoczny jest graficzny wskaźnik dostępności (np. progress bar).
  5. Użytkownik może nawigować pomiędzy kolejnymi i poprzednimi tygodniami.

- ID: US-004
- Tytuł: Rezerwacja miejsca na zajęciach
- Opis: Jako członek klubu, chcę móc zarezerwować miejsce na wybranych zajęciach online o dowolnej porze, bez konieczności kontaktu z recepcją.
- Kryteria akceptacji:
  1. Po kliknięciu na zajęcia z wolnymi miejscami, użytkownik widzi przycisk "Zarezerwuj".
  2. Po kliknięciu przycisku "Zarezerwuj" system potwierdza rezerwację, a interfejs zostaje zaktualizowany.
  3. Użytkownik nie może zarezerwować miejsca na zajęciach, które już się rozpoczęły.
  4. Użytkownik nie może zarezerwować miejsca na zajęciach, na które jest już zapisany.

- ID: US-005
- Tytuł: Zapis na listę oczekujących
- Opis: Jako członek klubu, chcę zapisać się na listę oczekujących, jeśli wybrane zajęcia są pełne, i otrzymać powiadomienie, gdy zwolni się miejsce.
- Kryteria akceptacji:
  1. Gdy wszystkie miejsca na zajęciach są zajęte, przycisk "Zarezerwuj" jest zastąpiony przez "Zapisz się na listę oczekujących".
  2. Po kliknięciu przycisku, użytkownik otrzymuje potwierdzenie zapisu na listę.
  3. Gdy miejsce się zwolni, e-mail jest wysyłany do wszystkich osób na liście oczekujących z informacją, że można dokonać rezerwacji na zasadzie "kto pierwszy, ten lepszy".

- ID: US-006
- Tytuł: Otrzymywanie sugestii alternatywnych zajęć
- Opis: Jako członek klubu, gdy zajęcia, na które chcę się zapisać są pełne, chcę zobaczyć sugestie innych dostępnych zajęć, aby łatwo znaleźć alternatywę.
- Kryteria akceptacji:
  1. Po kliknięciu na zajęcia z pełną rezerwacją, obok opcji zapisu na listę oczekujących, wyświetlana jest sekcja "Sugerowane zajęcia".
  2. System sugeruje do 3 alternatywnych zajęć (inny termin tych samych zajęć lub zajęcia z tej samej kategorii) z wolnymi miejscami.

- ID: US-007
- Tytuł: Anulowanie rezerwacji
- Opis: Jako członek klubu, chcę łatwo odwołać rezerwację przez aplikację, jeśli moje plany ulegną zmianie, zgodnie z polityką anulowania.
- Kryteria akceptacji:
  1. W widoku moich rezerwacji oraz po kliknięciu na zarezerwowane zajęcia w kalendarzu widoczny jest przycisk "Anuluj rezerwację".
  2. Przycisk jest aktywny tylko do 8 godzin przed rozpoczęciem zajęć.
  3. Po kliknięciu przycisku system prosi o potwierdzenie anulowania.
  4. Po potwierdzeniu rezerwacja jest usuwana z konta użytkownika, a miejsce jest zwalniane w systemie.

- ID: US-008
- Tytuł: Przeglądanie własnych rezerwacji
- Opis: Jako członek klubu, chcę mieć dostęp do listy moich nadchodzących i przeszłych rezerwacji, aby śledzić swoją aktywność.
- Kryteria akceptacji:
  1. W profilu użytkownika dostępne są dwie zakładki: "Nadchodzące" i "Historyczne".
  2. Zakładka "Nadchodzące" wyświetla listę wszystkich zajęć, na które użytkownik jest aktualnie zapisany.
  3. Zakładka "Historyczne" wyświetla listę zajęć, w których użytkownik brał udział w przeszłości.

- ID: US-009
- Tytuł: Otrzymywanie przypomnień o zajęciach
- Opis: Jako członek klubu, chcę otrzymać przypomnienie o nadchodzących zajęciach, żebym o nich nie zapomniał.
- Kryteria akceptacji:
  1. System automatycznie wysyła powiadomienie e-mail do użytkownika na 24 godziny przed rozpoczęciem każdych zarezerwowanych zajęć.
  2. E-mail zawiera nazwę zajęć, datę, godzinę oraz imię instruktora.

### 5.3. Personel Klubu - Panel Administracyjny

- ID: US-010
- Tytuł: Przeglądanie dashboardu
- Opis: Jako pracownik klubu, chcę mieć szybki wgląd w kluczowe dane operacyjne zaraz po zalogowaniu do panelu administracyjnego.
- Kryteria akceptacji:
  1. Dashboard wyświetla 3-4 kluczowe wskaźniki, w tym: procent obłożenia na zajęciach w dniu dzisiejszym.
  2. Dashboard wyświetla łączną liczbę osób zapisanych na listy oczekujące.
  3. Dane na dashboardzie są aktualizowane w czasie rzeczywistym.

- ID: US-011
- Tytuł: Zarządzanie instruktorem
- Opis: Jako pracownik klubu, chcę w prosty sposób zmienić w systemie instruktora prowadzącego zajęcia w razie jego nagłej niedyspozycji.
- Kryteria akceptacji:
  1. W panelu zarządzania harmonogramem, przy każdych zajęciach jest opcja "Edytuj".
  2. W formularzu edycji można zmienić instruktora, wybierając go z predefiniowanej listy.
  3. Po zapisaniu zmian, zaktualizowane imię instruktora jest widoczne w kalendarzu dla członków klubu.

- ID: US-012
- Tytuł: Odwoływanie zajęć
- Opis: Jako pracownik klubu, chcę sprawnie odwołać zajęcia, wiedząc, że system automatycznie poinformuje zapisane osoby.
- Kryteria akceptacji:
  1. W panelu zarządzania harmonogramem jest opcja "Odwołaj" przy każdych zajęciach.
  2. Po kliknięciu system prosi o potwierdzenie operacji.
  3. Po potwierdzeniu, zajęcia są usuwane z harmonogramu.
  4. System automatycznie wysyła powiadomienia e-mail o odwołaniu zajęć do wszystkich zapisanych uczestników oraz osób z listy oczekujących.

## 6. Metryki sukcesu

Kryteria sukcesu dla MVP będą mierzone za pomocą następujących wskaźników:

- Adopcja Systemu: 75% aktywnych członków klubu regularnie korzysta z systemu rezerwacji w ciągu 3 miesięcy od wdrożenia.
  - Sposób pomiaru: Analiza logów systemowych w celu identyfikacji unikalnych logujących się użytkowników i dokonywanych przez nich rezerwacji.

- Redukcja Nieobecności ("No-Show"): Zmniejszenie liczby nieobecności na zarezerwowanych zajęciach o minimum 30%.
  - Sposób pomiaru: Porównanie danych frekwencji (zbieranych manualnie lub w systemie) przed i po wdrożeniu aplikacji.

- Wzrost Frekwencji: Wzrost średniej frekwencji na zajęciach wymagających rezerwacji do poziomu 75-80%.
  - Sposób pomiaru: Raporty frekwencji generowane w panelu administracyjnym.

- Satysfakcja Użytkowników: Osiągnięcie 80% pozytywnych opinii na temat systemu rezerwacji.
  - Sposób pomiaru: Przeprowadzenie ankiet satysfakcji wśród członków klubu po 3 miesiącach od wdrożenia.

- Efektywność Operacyjna: Zmniejszenie czasu pracy recepcji poświęcanego na zarządzanie rezerwacjami o minimum 50%.
  - Sposób pomiaru: Jest to cel projektowy; jego pomiar (np. poprzez ankiety wśród personelu lub obserwację) zostanie przeprowadzony w fazie po-MVP.
