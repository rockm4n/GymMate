# Środowisko Testowe - Konfiguracja

Dokument opisuje pełną konfigurację środowiska testowego dla projektu GymMate, obejmującą testy jednostkowe (Vitest) oraz testy E2E (Playwright).

## 📦 Zainstalowane Zależności

### Vitest & React Testing Library
```json
{
  "devDependencies": {
    "vitest": "^4.0.4",
    "@vitest/ui": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/user-event": "latest",
    "@vitejs/plugin-react": "latest",
    "jsdom": "latest",
    "happy-dom": "latest"
  }
}
```

### Playwright
```json
{
  "devDependencies": {
    "@playwright/test": "latest"
  }
}
```

## 🗂️ Struktura Plików

```
GymMate/
├── vitest.config.ts              # Konfiguracja Vitest
├── playwright.config.ts          # Konfiguracja Playwright
├── src/
│   ├── test/
│   │   ├── setup.ts             # Setup dla Vitest (mocks, globals)
│   │   └── test-utils.tsx       # Custom render i utilities
│   ├── components/
│   │   └── __tests__/           # Testy komponentów
│   │       └── EmptyState.test.tsx
│   └── lib/
│       └── services/
│           └── __tests__/       # Testy serwisów
│               └── booking.service.test.ts
├── e2e/
│   ├── auth.spec.ts             # Testy E2E autentykacji
│   └── homepage.spec.ts         # Testy E2E strony głównej
└── README.testing.md            # Szczegółowy przewodnik testowania
```

## ⚙️ Konfiguracja

### Vitest (`vitest.config.ts`)

Kluczowe ustawienia:
- **Environment**: `jsdom` dla testów komponentów React
- **Globals**: włączone (describe, it, expect dostępne globalnie)
- **Setup Files**: `src/test/setup.ts` - inicjalizacja przed testami
- **Coverage**: Provider `v8`, threshold 70%
- **Aliases**: `@/*` mapowane na `./src/*`
- **Exclude**: wykluczenie katalogów `e2e/`, `node_modules/`, `dist/`

### Playwright (`playwright.config.ts`)

Kluczowe ustawienia:
- **Test Dir**: `./e2e`
- **Base URL**: `http://localhost:4321`
- **Browsers**: domyślnie Chromium (Firefox i WebKit zakomentowane)
- **Retries**: 2 na CI, 0 lokalnie
- **Web Server**: automatyczne uruchomienie `npm run dev`
- **Artifacts**: screenshots i video przy błędach

## 🧪 Dostępne Skrypty

### Testy Jednostkowe (Vitest)

```bash
# Uruchomienie testów jednostkowych
npm run test

# Testy w trybie watch (dla developmentu)
npm run test:watch

# Testy z interfejsem UI
npm run test:ui

# Generowanie raportu pokrycia kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchomienie testów E2E
npm run test:e2e

# Testy E2E z interfejsem UI
npm run test:e2e:ui

# Debug testów E2E
npm run test:e2e:debug

# Wyświetlenie raportu z testów
npm run test:e2e:report
```

## 📝 Przykładowe Testy

### Test Jednostkowy - Komponent React

```typescript
// src/components/__tests__/EmptyState.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('should render with message', () => {
    const message = 'Brak danych do wyświetlenia';
    
    render(<EmptyState message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
```

### Test Jednostkowy - Service z Mockami

```typescript
// src/lib/services/__tests__/booking.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBooking, BookingError } from '../booking.service';

describe('booking.service', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = {
      rpc: vi.fn(),
      from: vi.fn(),
    };
  });

  it('should create a booking successfully', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: mockBookingData,
      error: null,
    });

    const result = await createBooking(
      mockSupabaseClient,
      'user-123',
      { scheduled_class_id: '100' }
    );

    expect(result).toEqual(mockBookingData);
  });
});
```

### Test E2E - Autentykacja

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|hasło/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|zaloguj/i })).toBeVisible();
  });
});
```

## 🎯 Wskazówki Best Practices

### Testy Jednostkowe

1. **Wzorzec AAA**: Arrange, Act, Assert
2. **Testuj zachowanie, nie implementację**
3. **Używaj opisowych nazw testów**
4. **Mockuj zewnętrzne zależności** za pomocą `vi.mock()`
5. **Jeden test = jedno zachowanie**

### Testy E2E

1. **Testuj krytyczne ścieżki użytkownika**
2. **Używaj selektorów opartych na rolach** (`getByRole`, `getByLabel`)
3. **Czekaj na elementy** zamiast używać timeoutów
4. **Testy powinny być niezależne** od siebie
5. **Focus na dostępności** - użyj aria-labels

## 🔧 Rozwiązywanie Problemów

### Vitest

**Problem**: Błędy rozwiązywania modułów  
**Rozwiązanie**: Sprawdź czy aliasy w `vitest.config.ts` pasują do `tsconfig.json`

**Problem**: Nie można znaleźć elementów DOM  
**Rozwiązanie**: Upewnij się że `environment: 'jsdom'` jest ustawione

### Playwright

**Problem**: Nie zainstalowane przeglądarki  
**Rozwiązanie**: Uruchom `npx playwright install chromium`

**Problem**: Timeout testów  
**Rozwiązanie**: Zwiększ timeout w konfiguracji lub konkretnym teście

**Problem**: Serwer się nie uruchamia  
**Rozwiązanie**: Sprawdź czy port 4321 jest wolny i `npm run dev` działa

## 📊 Coverage

Skonfigurowane progi pokrycia kodu:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Raport coverage jest generowany w:
- `coverage/` - HTML i JSON reports
- Przeglądaj: `open coverage/index.html`

## 🚀 Następne Kroki

1. **Rozszerz testy jednostkowe** dla pozostałych komponentów i serwisów
2. **Dodaj testy E2E** dla kluczowych flow (rejestracja, booking, dashboard)
3. **Zintegruj testy z CI/CD** pipeline (GitHub Actions)
4. **Rozważ dodanie testów wizualnych** (Visual Regression Tests)
5. **Dodaj testy accessibility** za pomocą `@axe-core/playwright`

## 📚 Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Status Konfiguracji

- ✅ Vitest zainstalowany i skonfigurowany
- ✅ React Testing Library skonfigurowana
- ✅ Playwright zainstalowany i skonfigurowany (Chromium)
- ✅ Przykładowe testy utworzone i działające
- ✅ Skrypty npm dodane do `package.json`
- ✅ Setup files i test utilities utworzone
- ✅ `.gitignore` zaktualizowany
- ✅ Dokumentacja testowania utworzona

**Wszystkie testy przechodzą pomyślnie!** ✨

