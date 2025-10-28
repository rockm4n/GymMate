# Przewodnik testowania endpointu POST /api/bookings

## Status implementacji ✅

Endpoint **POST /api/bookings** został w pełni zaimplementowany i jest gotowy do testowania.

### Zaimplementowane komponenty:

1. ✅ **Validation Schema** (`src/lib/schemas/booking.schema.ts`)
2. ✅ **Service Layer** (`src/lib/services/booking.service.ts`)
3. ✅ **API Endpoint** (`src/pages/api/bookings.ts`)
4. ✅ **Database RPC Function** (`supabase/migrations/20251019175309_add_create_booking_function.sql`)
5. ✅ **TypeScript Types** (`src/db/database.types.ts`)
6. ✅ **Seed Data** (`supabase/seed.sql`)

## Przygotowanie do testów

### 1. Uruchom lokalny Supabase (jeśli nie jest uruchomiony)

```bash
supabase start
```

### 2. Zastosuj migracje i załaduj dane testowe

```bash
supabase db reset
```

To załaduje:

- 3 instruktorów testowych
- 3 kategorie zajęć
- 3 typy zajęć
- 5 zaplanowanych zajęć (z różnymi scenariuszami testowymi)

### 3. Uruchom serwer deweloperski Astro

```bash
npm run dev
```

Serwer powinien być dostępny pod adresem: `http://localhost:4321`

### 4. Utwórz użytkownika testowego

Otwórz Supabase Studio: `http://127.0.0.1:54323`

1. Przejdź do **Authentication** > **Users**
2. Kliknij **Add user** > **Create new user**
3. Wprowadź email i hasło (np. `test@example.com` / `password123`)
4. Kliknij **Create user**
5. Skopiuj **User UID** (będzie potrzebny do testów)

### 5. Utwórz profil dla użytkownika testowego

W Supabase Studio:

1. Przejdź do **Table Editor** > **profiles**
2. Kliknij **Insert** > **Insert row**
3. Wprowadź:
   - `id`: wklej User UID z kroku 4
   - `full_name`: np. "Test User"
   - `role`: "member"
4. Kliknij **Save**

### 6. Pobierz JWT token

Możesz użyć jednej z metod:

#### Metoda A: Przez Supabase Studio

1. W **Authentication** > **Users** kliknij na użytkownika
2. Skopiuj **Access Token** (JWT)

#### Metoda B: Przez API (login)

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Skopiuj wartość `access_token` z odpowiedzi.

## Scenariusze testowe

### Dane testowe w bazie:

| ID zajęć                               | Nazwa          | Pojemność | Status    | Opis                             |
| -------------------------------------- | -------------- | --------- | --------- | -------------------------------- |
| `99999999-9999-9999-9999-999999999991` | Morning Yoga   | 10        | scheduled | Normalny case                    |
| `99999999-9999-9999-9999-999999999992` | Power Lifting  | 5         | scheduled | Mała pojemność                   |
| `99999999-9999-9999-9999-999999999993` | Spinning Class | 2         | scheduled | Do testowania pełnej klasy       |
| `99999999-9999-9999-9999-999999999994` | Morning Yoga   | 10        | cancelled | Do testowania niedostępnej klasy |
| `99999999-9999-9999-9999-999999999995` | Spinning Class | null      | scheduled | Nieograniczona pojemność         |

### Test 1: Brak uwierzytelnienia (401)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{"scheduled_class_id": "99999999-9999-9999-9999-999999999991"}'
```

**Oczekiwany wynik:** Status 401, komunikat o braku uwierzytelnienia

### Test 2: Nieprawidłowy JSON (400)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{invalid json}'
```

**Oczekiwany wynik:** Status 400, komunikat o nieprawidłowym JSON

### Test 3: Nieprawidłowy UUID (400)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"scheduled_class_id": "not-a-uuid"}'
```

**Oczekiwany wynik:** Status 400, szczegóły walidacji Zod

### Test 4: Nieistniejąca klasa (404)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"scheduled_class_id": "00000000-0000-0000-0000-000000000000"}'
```

**Oczekiwany wynik:** Status 404, komunikat "Scheduled class not found"

### Test 5: Pomyślna rezerwacja (201)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"scheduled_class_id": "99999999-9999-9999-9999-999999999991"}'
```

**Oczekiwany wynik:** Status 201, obiekt BookingDto:

```json
{
  "id": "uuid",
  "created_at": "timestamp",
  "scheduled_class": {
    "id": "99999999-9999-9999-9999-999999999991",
    "start_time": "timestamp",
    "end_time": "timestamp",
    "class": {
      "name": "Morning Yoga"
    },
    "instructor": {
      "full_name": "Anna Kowalska"
    }
  }
}
```

### Test 6: Duplikat rezerwacji (400)

Wykonaj ponownie Test 5 z tym samym tokenem i scheduled_class_id.

**Oczekiwany wynik:** Status 400, komunikat "You have already booked this class"

### Test 7: Rezerwacja anulowanej klasy (400)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"scheduled_class_id": "99999999-9999-9999-9999-999999999994"}'
```

**Oczekiwany wynik:** Status 400, komunikat "Class is not available for booking"

### Test 8: Pełna klasa (400)

1. Utwórz 2 użytkowników testowych
2. Zarezerwuj klasę spinning (ID: `99999999-9999-9999-9999-999999999993`) dla obu
3. Spróbuj zarezerwować jako trzeci użytkownik

**Oczekiwany wynik:** Status 400, komunikat "This class is fully booked"

### Test 9: Klasa z nieograniczoną pojemnością (201)

```bash
curl -X POST "http://localhost:4321/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"scheduled_class_id": "99999999-9999-9999-9999-999999999995"}'
```

**Oczekiwany wynik:** Status 201, pomyślna rezerwacja

## Automatyczny skrypt testowy

Możesz użyć przygotowanego skryptu:

```bash
# Edytuj skrypt i wstaw swój JWT token
nano test-booking-endpoint.sh

# Uruchom testy
./test-booking-endpoint.sh
```

## Weryfikacja w bazie danych

Sprawdź utworzone rezerwacje w Supabase Studio:

1. Przejdź do **Table Editor** > **bookings**
2. Powinieneś zobaczyć utworzone rezerwacje z odpowiednimi `user_id` i `scheduled_class_id`

## Testowanie race conditions

Aby przetestować zabezpieczenie przed race conditions:

1. Użyj narzędzia do testów obciążeniowych (np. `ab`, `wrk`, `hey`)
2. Wyślij wiele równoczesnych żądań dla tej samej klasy z różnymi użytkownikami
3. Sprawdź, czy liczba rezerwacji nie przekracza capacity

Przykład z `ab` (Apache Bench):

```bash
# Zainstaluj ab jeśli nie masz
sudo apt-get install apache2-utils

# Wyślij 10 równoczesnych żądań
ab -n 10 -c 10 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
   -H "Content-Type: application/json" \
   -p booking.json \
   http://localhost:4321/api/bookings
```

Gdzie `booking.json` zawiera:

```json
{ "scheduled_class_id": "99999999-9999-9999-9999-999999999992" }
```

## Troubleshooting

### Problem: 401 Unauthorized mimo poprawnego tokena

- Sprawdź czy token nie wygasł (domyślnie 1h)
- Upewnij się, że używasz tokena z lokalnego Supabase (nie z produkcji)
- Sprawdź czy middleware poprawnie weryfikuje token

### Problem: 500 Internal Server Error

- Sprawdź logi serwera Astro
- Sprawdź logi Supabase: `supabase logs`
- Upewnij się, że migracje zostały zastosowane: `supabase db reset`

### Problem: Funkcja RPC nie istnieje

- Zresetuj bazę danych: `supabase db reset`
- Sprawdź czy migracja została zastosowana: `supabase db diff`

## Kolejne kroki

Po pomyślnym przetestowaniu endpointu:

1. ✅ Endpoint działa poprawnie
2. 📝 Dodaj testy jednostkowe dla serwisu
3. 📝 Dodaj testy integracyjne dla endpointu
4. 📝 Dodaj testy E2E
5. 🚀 Deploy do środowiska produkcyjnego
