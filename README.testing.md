# Testing Guide for GymMate

This document provides guidelines for writing and running tests in the GymMate application.

## Table of Contents

- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)

## Unit Testing with Vitest

### Overview

We use [Vitest](https://vitest.dev/) for unit testing along with [React Testing Library](https://testing-library.com/react) for component tests.

### Configuration

- **Config File**: `vitest.config.ts`
- **Setup File**: `src/test/setup.ts`
- **Test Utils**: `src/test/test-utils.tsx`

### Writing Unit Tests

#### Test File Naming

Place test files next to the code they test or in a `__tests__` directory:
- `component.test.tsx` - for component tests
- `service.test.ts` - for service tests
- `utils.test.ts` - for utility function tests

#### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should render correctly', () => {
    // Arrange
    render(<ComponentName />);
    
    // Act
    const element = screen.getByText('Expected Text');
    
    // Assert
    expect(element).toBeInTheDocument();
  });
});
```

#### Mocking

```typescript
// Mock a module
vi.mock('@/lib/services/api', () => ({
  fetchData: vi.fn(),
}));

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Spy on existing function
const spy = vi.spyOn(object, 'method');
```

### Available Test Commands

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## E2E Testing with Playwright

### Overview

We use [Playwright](https://playwright.dev/) for end-to-end testing to simulate real user interactions.

### Configuration

- **Config File**: `playwright.config.ts`
- **Test Directory**: `e2e/`

### Writing E2E Tests

#### Test File Naming

Place E2E tests in the `e2e/` directory:
- `feature.spec.ts` - feature-specific tests
- `auth.spec.ts` - authentication flow tests

#### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform user action', async ({ page }) => {
    // Navigate to page
    await page.goto('/path');

    // Interact with elements
    await page.getByRole('button', { name: 'Click Me' }).click();

    // Assert expected behavior
    await expect(page).toHaveURL('/expected-url');
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

#### Best Practices for E2E Tests

1. **Use User-Facing Selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for Elements**: Use `await expect(element).toBeVisible()` instead of arbitrary timeouts
3. **Test User Flows**: Focus on complete user journeys, not individual components
4. **Keep Tests Independent**: Each test should be able to run in isolation

### Available E2E Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (visual test runner)
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Browser Configuration

By default, tests run on Chromium. To enable additional browsers, edit `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

## Running Tests

### Local Development

```bash
# Run unit tests in watch mode while developing
npm run test:watch

# Run E2E tests (ensure dev server is running)
npm run test:e2e
```

### CI/CD Pipeline

Both test suites are configured to run in CI environments:

```bash
# Run all tests for CI
npm run test -- --run
npm run test:e2e
```

## Best Practices

### Unit Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
3. **Use Descriptive Test Names**: Test names should describe the expected behavior
4. **Keep Tests Focused**: Each test should verify one specific behavior
5. **Mock External Dependencies**: Use `vi.mock()` to isolate the code under test
6. **Avoid Testing Implementation Details**: Don't test internal state or private methods

### E2E Tests

1. **Test Critical User Paths**: Focus on the most important user journeys
2. **Use Page Object Model**: For complex pages, consider using page objects
3. **Handle Async Operations**: Always wait for elements and actions to complete
4. **Test Accessibility**: Use role-based selectors to ensure accessibility
5. **Keep Tests Maintainable**: Avoid brittle selectors that change frequently

### Coverage Goals

- **Lines**: 70% minimum
- **Functions**: 70% minimum
- **Branches**: 70% minimum
- **Statements**: 70% minimum

Focus on meaningful coverage rather than arbitrary percentages. Critical business logic should have higher coverage.

## Troubleshooting

### Common Issues

#### Vitest

**Issue**: Tests fail with module resolution errors
**Solution**: Check the path aliases in `vitest.config.ts` match `tsconfig.json`

**Issue**: Tests can't find DOM elements
**Solution**: Ensure `environment: 'jsdom'` is set in `vitest.config.ts`

#### Playwright

**Issue**: Browsers not installed
**Solution**: Run `npx playwright install chromium`

**Issue**: Tests timeout
**Solution**: Increase timeout in `playwright.config.ts` or specific tests

**Issue**: Server not starting
**Solution**: Ensure `npm run dev` works correctly and port 4321 is available

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

