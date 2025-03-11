// a11y-setup.ts
import { configureAxe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with the toHaveNoViolations
expect.extend(toHaveNoViolations);

// Configure axe for our needs
export const axe = configureAxe({
  rules: {
    // You can adjust rules based on your project needs
    'color-contrast': { enabled: true },
    'image-alt': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'button-name': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'page-has-heading-one': { enabled: false }, // Disable this if components don't need h1
  }
});

// Helper to make a11y tests easier to write
export const runA11yTest = async (container: HTMLElement) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};
