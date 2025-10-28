# CI/CD Pipeline Documentation

## Przegląd

Pipeline CI/CD `master.yml` został zaprojektowany dla projektu GymMate wykorzystującego Astro 5, React 19, TypeScript 5, Tailwind 4 i Supabase.

## Struktura Pipeline'u

### 1. Lint & Format Check
- **Cel**: Sprawdzenie jakości kodu i formatowania
- **Narzędzia**: ESLint, Prettier
- **Czas wykonania**: ~2-3 minuty
- **Warunki sukcesu**: Brak błędów lintingu i formatowania

### 2. Unit Tests & Coverage
- **Cel**: Wykonanie testów jednostkowych z pomiarem pokrycia kodu
- **Narzędzia**: Vitest, React Testing Library
- **Threshold**: 70% pokrycia kodu
- **Czas wykonania**: ~5-8 minut
- **Raportowanie**: Codecov (opcjonalne)

### 3. E2E Tests
- **Cel**: Testy end-to-end aplikacji
- **Narzędzia**: Playwright
- **Przeglądarki**: Chromium (domyślnie)
- **Czas wykonania**: ~10-15 minut
- **Artefakty**: Screenshots, video przy błędach

### 4. Production Build
- **Cel**: Budowa aplikacji w trybie produkcyjnym
- **Narzędzia**: Astro build
- **Zależności**: Wymaga sukcesu wszystkich poprzednich jobów
- **Czas wykonania**: ~3-5 minut

### 5. Test Production Build
- **Cel**: Weryfikacja działania buildu produkcyjnego
- **Narzędzia**: Astro preview, curl
- **Czas wykonania**: ~2-3 minuty

### 6. Security Audit
- **Cel**: Sprawdzenie bezpieczeństwa zależności
- **Narzędzia**: npm audit, audit-ci
- **Poziom**: Moderate i wyżej
- **Czas wykonania**: ~2-3 minuty

## Konfiguracja

### Wymagane zmienne środowiskowe

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Aplikacja
NODE_ENV=production
BASE_URL=http://localhost:4321
```

### Opcjonalne zmienne

```bash
# Raportowanie coverage
CODECOV_TOKEN=your_codecov_token

# GitHub
GITHUB_TOKEN=your_github_token
```

## Uruchamianie

### Automatyczne
Pipeline uruchamia się automatycznie przy:
- Push do brancha `master`
- Merge request do `master`

### Ręczne
Pipeline można uruchomić ręcznie przez:
- GitHub Actions UI → Workflows → Master CI/CD Pipeline → Run workflow
- Lub przez API GitHub Actions

## Monitoring i Debugging

### Logi
- Wszystkie logi dostępne w GitHub Actions
- Artefakty (build, raporty testów) przechowywane przez 7-30 dni

### Najczęstsze problemy

1. **Testy E2E failują**
   - Sprawdź czy aplikacja uruchamia się poprawnie na localhost:4321
   - Sprawdź logi Playwright dla szczegółów błędów

2. **Build failuje**
   - Sprawdź czy wszystkie zależności są zainstalowane
   - Sprawdź czy nie ma błędów TypeScript

3. **Coverage poniżej threshold**
   - Dodaj więcej testów jednostkowych
   - Sprawdź czy testy faktycznie wykonują się

## Rozszerzenia

### Dodanie nowych przeglądarek do E2E
Edytuj `playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

### Dodanie deploymentu
Można rozszerzyć pipeline o:
- Deploy do DigitalOcean
- Deploy do Vercel/Netlify
- Docker build i push

### Dodanie cache'owania
Pipeline już używa cache'owania npm, można dodać:
- Cache dla Playwright browsers
- Cache dla build artifacts

## Wydajność

### Optymalizacje
- Równoległe wykonywanie jobów gdzie to możliwe
- Cache'owanie zależności npm
- Minimalizacja artefaktów

### Czas wykonania
- Całkowity czas: ~25-35 minut
- Najdłuższy job: E2E Tests (~10-15 min)
- Najszybszy job: Lint (~2-3 min)
