# Rozbudowa Layout.astro i UserNav - Weryfikacja Stanu Użytkownika

## 📋 Przegląd

Rozbudowano `Layout.astro` oraz `UserNav.tsx` o zaawansowaną weryfikację stanu użytkownika, pełne informacje o użytkowniku (imię, rola) oraz ulepszoną funkcjonalność wylogowania zgodnie z best practices Astro i React.

## ✅ Zmiany w Layout.astro

### 1. Rozszerzona Weryfikacja Stanu Użytkownika

**Poprzednio:**
```astro
const { user } = Astro.locals;
const isAuthenticated = !!user;
const userEmail = user?.email || "";
```

**Teraz:**
```astro
const { user, profile } = Astro.locals;
const isAuthenticated = !!user;

// Extract user information
const userEmail = user?.email || "";
const userName = profile?.full_name || userEmail.split("@")[0] || "";
const userRole = profile?.role || "member";
```

### 2. Dodano Debug Logging (DEV only)

```astro
if (import.meta.env.DEV && user) {
  console.log("[Layout] User authenticated:", {
    id: user.id,
    email: user.email,
    role: userRole,
    hasProfile: !!profile,
  });
}
```

**Zalety:**
- Pomaga w debugowaniu problemów z autentykacją
- Tylko w trybie development (nie w production)
- Wyświetla kluczowe informacje o sesji użytkownika

### 3. Ulepszony Default Title

**Poprzednio:** `"10x Astro Starter"`  
**Teraz:** `"GymMate - Twój osobisty trener w kieszeni"`

### 4. Rozszerzone Props dla UserNav

**Poprzednio:**
```astro
<UserNav client:load isAuthenticated={isAuthenticated} userEmail={userEmail} />
```

**Teraz:**
```astro
<UserNav 
  client:load 
  isAuthenticated={isAuthenticated} 
  userEmail={userEmail}
  userName={userName}
  userRole={userRole}
/>
```

---

## ✅ Zmiany w UserNav.tsx

### 1. Rozszerzone Props Interface

```typescript
interface UserNavProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  userName?: string;           // NOWE
  userRole?: "member" | "staff"; // NOWE
}
```

### 2. Inteligentne Wyświetlanie Nazwy Użytkownika

```typescript
const displayName = userName || userEmail?.split("@")[0] || userEmail || "User";
const avatarLetter = (userName || userEmail)?.[0]?.toUpperCase() || "U";
const isStaff = userRole === "staff";
```

**Logika priorytetów:**
1. `userName` (z profilu) - najwyższy priorytet
2. Część przed @ w email (np. "jan.kowalski" z "jan.kowalski@gmail.com")
3. Pełny email
4. "User" jako fallback

### 3. Ulepszone UI - Button z Dodatkowymi Informacjami

**Poprzednio:** Tylko avatar i email

**Teraz:**
```tsx
<div className="hidden sm:flex sm:flex-col sm:items-start">
  <span className="text-sm font-medium">{displayName}</span>
  {userEmail && userName && (
    <span className="text-xs text-muted-foreground">{userEmail}</span>
  )}
</div>
```

**Zachowanie:**
- Mobile: Tylko avatar
- Desktop: Avatar + displayName + (opcjonalnie) email

### 4. Sekcja User Info w Dropdown Menu

**NOWA SEKCJA:**
```tsx
<div className="px-3 py-2 border-b mb-1">
  <p className="text-sm font-medium">{displayName}</p>
  {userEmail && (
    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
  )}
  {isStaff && (
    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
      Personel
    </span>
  )}
</div>
```

**Zalety:**
- Wyraźne potwierdzenie tożsamości użytkownika
- Badge "Personel" dla staff (wizualna indykacja uprawnień)
- Estetyczny separator przed linkami nawigacyjnymi

### 5. Warunkowy Link do Panelu Administracyjnego

**NOWE:**
```tsx
{isStaff && (
  <a
    href="/admin/dashboard"
    className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors"
    role="menuitem"
  >
    <svg>...</svg>
    Panel Administracyjny
  </a>
)}
```

**Zachowanie:**
- Widoczny TYLKO dla użytkowników z rolą `staff`
- Regular members (role: `member`) nie widzą tego linku
- Zgodne z middleware protection dla `/admin/*`

### 6. Ulepszona Accessibility (ARIA)

**Dodano:**
- `aria-label="Menu użytkownika"` na button
- `role="menu"` na dropdown
- `role="menuitem"` na każdym linku i przycisku
- `aria-hidden="true"` na dekoracyjnych SVG
- `aria-label="Wyloguj się"` na logout button

**Zgodność:**
- WCAG 2.1 Level AA
- Screen reader friendly
- Keyboard navigation support

### 7. Ulepszony Przycisk Wylogowania

**Dodano:**
```tsx
<button
  onClick={handleLogout}
  disabled={isLoggingOut}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
  role="menuitem"
  aria-label="Wyloguj się"
>
  {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
</button>
```

**Funkcjonalność:**
- Loading state z komunikatem "Wylogowywanie..."
- Disabled state podczas procesu wylogowania
- Wizualna indykacja (opacity 50%, no cursor)
- Zapobiega wielokrotnemu kliknięciu

---

## 🎨 Zmiany Wizualne

### Przed:
```
┌─────────────────────────────────┐
│ [J] jan@example.com ▼           │
└─────────────────────────────────┘
  ├─ Profil
  ├─ Harmonogram
  └─ Wyloguj się
```

### Po:
```
┌──────────────────────────────────┐
│ [J] Jan Kowalski               ▼ │
│     jan@example.com              │
└──────────────────────────────────┘
  ├─ Jan Kowalski
  │  jan@example.com
  │  [Personel] (jeśli staff)
  ├─────────────────────
  ├─ Mój Profil
  ├─ Harmonogram
  ├─ Panel Administracyjny (tylko staff)
  ├─────────────────────
  └─ Wyloguj się
```

---

## 🔒 Security & Best Practices

### 1. Server-Side Data Only
```astro
// Layout.astro - dane TYLKO z server-side
const { user, profile } = Astro.locals;
```
- Brak fetch z client-side
- Brak localStorage/sessionStorage
- Wszystkie dane z middleware (zaufane źródło)

### 2. Conditional Rendering Based on Role
```tsx
{isStaff && <a href="/admin/dashboard">...</a>}
```
- UI ukrywa link dla non-staff
- Middleware blokuje dostęp do `/admin/*` dla non-staff
- Defense in depth (UI + server-side)

### 3. Safe Fallbacks
```typescript
const userName = profile?.full_name || userEmail.split("@")[0] || "";
const userRole = profile?.role || "member";
```
- Graceful degradation
- Zawsze ma sensowną wartość
- Brak undefined/null w UI

### 4. Development-Only Logging
```astro
if (import.meta.env.DEV && user) {
  console.log(...);
}
```
- Nie wyciekają dane w production
- Pomocne w debugowaniu
- Tree-shaken w production build

---

## 📊 Zgodność z Cursor Rules

### ✅ Astro Best Practices
- [x] Server-side data access (`Astro.locals`)
- [x] Conditional rendering with Astro syntax
- [x] `client:load` directive dla interaktywnych komponentów
- [x] Environment variables (`import.meta.env.DEV`)

### ✅ React Best Practices
- [x] Functional components z hooks
- [x] Brak "use client" directives (Astro integration)
- [x] useState dla local state (menu, loading)
- [x] Computed values (displayName, avatarLetter)
- [x] Conditional rendering (`{isStaff && ...}`)

### ✅ Accessibility Best Practices
- [x] ARIA landmarks i roles
- [x] aria-label dla elementów bez visible text
- [x] aria-expanded dla expandable content
- [x] aria-hidden dla dekoracyjnych elementów
- [x] Semantic HTML (nav, button, a)

### ✅ Coding Practices
- [x] Early returns dla edge cases
- [x] Guard clauses (if isLoggingOut return)
- [x] Error handling (try/catch w logout)
- [x] Proper TypeScript types
- [x] Descriptive variable names

---

## 🧪 Testowanie

### Testy Manualne - Checklist

#### Member (role: "member")
- [ ] Zaloguj się jako regular user
- [ ] Sprawdź czy wyświetla się: `displayName` w header
- [ ] Sprawdź czy dropdown pokazuje: email + bez badge "Personel"
- [ ] Sprawdź czy dropdown zawiera:
  - [ ] Mój Profil
  - [ ] Harmonogram
  - [ ] BRAK "Panel Administracyjny"
  - [ ] Wyloguj się
- [ ] Kliknij "Wyloguj się"
- [ ] Sprawdź czy przekierowuje do `/`
- [ ] Sprawdź czy navbar pokazuje "Zaloguj się" + "Zarejestruj się"

#### Staff (role: "staff")
- [ ] Zaloguj się jako staff user
- [ ] Sprawdź czy wyświetla się: `displayName` + badge "Personel"
- [ ] Sprawdź czy dropdown zawiera:
  - [ ] Mój Profil
  - [ ] Harmonogram
  - [ ] Panel Administracyjny ✅
  - [ ] Wyloguj się
- [ ] Kliknij "Panel Administracyjny"
- [ ] Sprawdź czy otwiera się `/admin/dashboard`

#### User bez full_name w profilu
- [ ] Użytkownik z email: `jan.kowalski@example.com`
- [ ] Sprawdź czy `displayName` = `"jan.kowalski"`
- [ ] Avatar letter = `"J"`

#### User z full_name w profilu
- [ ] Użytkownik z `full_name: "Jan Kowalski"`
- [ ] Sprawdź czy `displayName` = `"Jan Kowalski"`
- [ ] Avatar letter = `"J"`
- [ ] Email wyświetla się jako secondary info (desktop)

#### Mobile View
- [ ] Otwórz na mobile (<640px)
- [ ] Sprawdź czy wyświetla się tylko: `[Avatar] ▼`
- [ ] Email i displayName są ukryte
- [ ] Dropdown działa normalnie

#### Desktop View
- [ ] Otwórz na desktop (>640px)
- [ ] Sprawdź czy wyświetla się: `[Avatar] DisplayName (email) ▼`
- [ ] Wszystkie informacje widoczne

#### Logout Loading State
- [ ] Kliknij "Wyloguj się"
- [ ] Sprawdź czy przycisk zmienia się na: "Wylogowywanie..."
- [ ] Sprawdź czy przycisk jest disabled (opacity 50%)
- [ ] Sprawdź czy nie można kliknąć ponownie

---

## 🐛 Troubleshooting

### Problem: displayName pokazuje email zamiast imienia

**Przyczyna:** `profile.full_name` jest null/empty

**Rozwiązanie:**
```sql
-- Sprawdź profil użytkownika
SELECT id, full_name, role FROM profiles WHERE id = 'user_id';

-- Zaktualizuj full_name
UPDATE profiles 
SET full_name = 'Jan Kowalski' 
WHERE id = 'user_id';
```

### Problem: Badge "Personel" nie pojawia się dla staff

**Przyczyna:** `profile.role` nie jest ustawione na `"staff"`

**Rozwiązanie:**
```sql
-- Sprawdź rolę
SELECT id, email, role FROM profiles WHERE email = 'admin@example.com';

-- Zaktualizuj rolę
UPDATE profiles 
SET role = 'staff' 
WHERE email = 'admin@example.com';
```

### Problem: Link "Panel Administracyjny" nie działa

**Przyczyna:** Route `/admin/dashboard` nie istnieje lub middleware blokuje

**Sprawdź:**
1. Czy plik `/admin/dashboard.astro` istnieje?
2. Czy middleware pozwala na dostęp dla staff?
3. Czy `profile.role === "staff"`?

### Problem: Console log nie pojawia się

**Przyczyna:** Aplikacja działa w production mode

**Rozwiązanie:**
- Logging działa TYLKO w development (`import.meta.env.DEV`)
- Uruchom: `npm run dev` zamiast `npm run build && npm run preview`

---

## 📝 Pliki Zmienione

```
src/
├── layouts/
│   └── Layout.astro (modified)
│       - Dodano pobieranie profile z Astro.locals
│       - Dodano ekstrakcję userName i userRole
│       - Dodano development logging
│       - Rozszerzono props dla UserNav
│
└── components/auth/
    └── UserNav.tsx (modified)
        - Rozszerzono UserNavProps (userName, userRole)
        - Dodano computed values (displayName, avatarLetter, isStaff)
        - Ulepszone UI button (2-liniowe na desktop)
        - Dodano User Info Section w dropdown
        - Warunkowy link do admin panel
        - Ulepszona accessibility (ARIA)
        - Ulepszony logout button (loading state)
```

---

## 🎯 Podsumowanie

### Co zostało osiągnięte:
✅ Pełna weryfikacja stanu użytkownika w Layout  
✅ Wyświetlanie imienia i nazwiska (full_name)  
✅ Badge "Personel" dla staff users  
✅ Warunkowy dostęp do panelu administracyjnego  
✅ Ulepszona accessibility (ARIA)  
✅ Development logging dla debugowania  
✅ Graceful fallbacks dla brakujących danych  
✅ Zgodność z Astro & React best practices  

### Korzyści dla użytkownika:
🎨 Lepsze UX - widoczne imię i nazwisko zamiast email  
🔒 Bezpieczeństwo - role-based access control  
♿ Accessibility - screen reader friendly  
📱 Responsive - optymalizacja dla mobile i desktop  
⚡ Performance - server-side rendering danych  

---

**Status:** ✅ **COMPLETED - READY FOR TESTING**

