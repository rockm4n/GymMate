import { render } from "@testing-library/react";
import type { ReactElement } from "react";

type CustomRenderOptions = Record<string, unknown>;

/**
 * Custom render function that wraps components with common providers
 */
function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  return render(ui, {
    ...options,
  });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";

// Override render method
export { customRender as render };
