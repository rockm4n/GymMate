import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

interface CustomRenderOptions {
  // Add any custom options here if needed
  [key: string]: any;
}

/**
 * Custom render function that wraps components with common providers
 */
function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  return render(ui, {
    ...options,
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

