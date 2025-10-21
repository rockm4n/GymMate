# Przewodnik Konfiguracji Supabase - GymMate Auth

## 🎯 Cel

Ten dokument zawiera kroki konfiguracji Supabase wymagane do działania modułu autentykacji w GymMate.

## ⚙️ Konfiguracja w Supabase Dashboard

### 1. Wyłączenie Email Confirmation

**Ważne:** Zgodnie z PRD US-001, użytkownicy są automatycznie logowani po rejestracji. Wymaga to wyłączenia weryfikacji email.

**Kroki:**
1. Otwórz projekt w [Supabase Dashboard](https://app.supabase.com)
2. Przejdź do **Authentication** → **Settings**
3. Znajdź sekcję **Email Auth**
4. **Wyłącz** opcję `Enable email confirmations`
5. Kliknij **Save**

**Dlaczego to jest potrzebne:**
- Bez tego użytkownicy nie będą mogli się zalogować natychmiast po rejestracji
- Supabase wymaga potwierdzenia email przed umożliwieniem logowania
- W MVP pomijamy proces weryfikacji email dla uproszczenia

---

### 2. Weryfikacja Password Policy

**Kroki:**
1. W Supabase Dashboard: **Authentication** → **Settings**
2. Znajdź sekcję **Password Requirements**
3. Upewnij się, że **Minimum password length** = `8` (domyślne)

**Zgodność:**
- `auth.schema.ts` wymaga minimum 8 znaków
- Supabase domyślnie wymaga 8 znaków
- Jeśli zmieniono w Supabase → zaktualizuj schema

---

### 3. Weryfikacja Profile Trigger

**Co to robi:**
Automatycznie tworzy rekord w tabeli `profiles` dla każdego nowego użytkownika.

**Sprawdzenie:**
```sql
-- Wykonaj w SQL Editor w Supabase
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Oczekiwany wynik:**
- `trigger_name`: `on_auth_user_created`
- `event_object_table`: `users` (w schema `auth`)
- `action_statement`: powinien wywoływać `handle_new_user()`

**Jeśli trigger nie istnieje:**
```sql
-- Funkcja obsługująca nowego użytkownika
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'member', -- domyślna rola
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger wywołujący funkcję
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Uwaga:** Trigger powinien już istnieć w migracji `20251016202411_init_schema.sql`. Sprawdź ten plik.

---

### 4. Pobranie Credentials

**Kroki:**
1. W Supabase Dashboard: **Settings** → **API**
2. Skopiuj:
   - **Project URL** → `SUPABASE_URL` w `.env`
   - **anon/public key** → `SUPABASE_KEY` w `.env`

**Przykład `.env`:**
```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Bezpieczeństwo:**
- Nigdy nie commituj `.env` do git
- `.env` jest już w `.gitignore`
- Używaj tylko `anon/public` key (nie `service_role`)

---

## 🧪 Testowanie Konfiguracji

### Test 1: Rejestracja i Auto-Login

```bash
# W terminalu - test endpoint rejestracji
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "confirmPassword": "testpassword123"
  }'
```

**Oczekiwany wynik:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    ...
  }
}
```

**Sprawdzenie:**
1. Otwórz Supabase Dashboard → **Authentication** → **Users**
2. Powinieneś zobaczyć nowego użytkownika `test@example.com`
3. Status: `confirmed` (nie `unconfirmed`)

### Test 2: Profile został utworzony

```sql
-- W SQL Editor w Supabase
SELECT * FROM profiles 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'test@example.com'
);
```

**Oczekiwany wynik:**
- Rekord istnieje
- `role` = `'member'`
- `created_at` = czas rejestracji

### Test 3: Logowanie

```bash
# Test endpoint logowania
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Oczekiwany wynik:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    ...
  }
}
```

---

## 🔍 Troubleshooting

### Problem: "Email not confirmed"

**Przyczyna:** Email confirmation jest włączone w Supabase

**Rozwiązanie:**
1. Przejdź do **Authentication** → **Settings**
2. Wyłącz `Enable email confirmations`
3. Dla istniejących użytkowników:
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'test@example.com';
   ```

### Problem: "Invalid login credentials"

**Możliwe przyczyny:**
1. Błędne hasło
2. Użytkownik nie istnieje
3. Email nie został potwierdzony (patrz wyżej)

**Debugowanie:**
```sql
-- Sprawdź użytkownika
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'test@example.com';
```

### Problem: "User already registered"

**Przyczyna:** Użytkownik o tym email już istnieje

**Rozwiązanie:**
- Użyj innego adresu email
- Lub usuń istniejącego użytkownika:
  ```sql
  -- UWAGA: To usunie także powiązany profil (CASCADE)
  DELETE FROM auth.users WHERE email = 'test@example.com';
  ```

### Problem: Profile nie został utworzony

**Sprawdzenie:**
```sql
-- Czy trigger istnieje?
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Rozwiązanie:**
1. Utwórz trigger (patrz sekcja 3 wyżej)
2. Dla istniejących użytkowników bez profili:
   ```sql
   INSERT INTO public.profiles (id, full_name, role, created_at)
   SELECT id, '', 'member', NOW()
   FROM auth.users
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profiles WHERE profiles.id = users.id
   );
   ```

### Problem: CORS errors

**Przyczyna:** Frontend nie może komunikować się z Supabase

**Rozwiązanie:**
1. W Supabase Dashboard: **Settings** → **API**
2. W sekcji **CORS** dodaj:
   - `http://localhost:3000` (development)
   - Twoja domena produkcyjna (gdy deploy)

---

## 📋 Checklist przed Deploy

- [ ] Email confirmation **wyłączone**
- [ ] Password policy = **8 znaków minimum**
- [ ] Profile trigger **istnieje i działa**
- [ ] Environment variables **ustawione** (SUPABASE_URL, SUPABASE_KEY)
- [ ] Test rejestracji **przechodzi**
- [ ] Test logowania **przechodzi**
- [ ] Test auto-login **działa**
- [ ] Profile **tworzony automatycznie**
- [ ] CORS **skonfigurowany** (jeśli deploy)

---

## 📚 Dodatkowe Zasoby

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🔐 Row Level Security (RLS) - TODO

**Uwaga:** Dla bezpieczeństwa produkcyjnego, należy skonfigurować RLS policies dla tabeli `profiles`.

**Przykładowe policies:**
```sql
-- Użytkownicy mogą czytać swój własny profil
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Użytkownicy mogą aktualizować swój własny profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Staff może czytać wszystkie profile
CREATE POLICY "Staff can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'staff'
    )
  );
```

**To jest poza zakresem obecnej implementacji**, ale powinno być dodane przed wdrożeniem produkcyjnym.

