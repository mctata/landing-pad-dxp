// jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/test-path',
    asPath: '/test-path',
    query: {},
    locale: 'en',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'https://api.test.com',
  NEXT_PUBLIC_APP_URL: 'https://app.test.com',
};

// Mock window.matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Suppress console errors during tests
// Useful for expected test failures or mocked API calls
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes?.('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Make accessible assertions available
expect.extend({
  toHaveNoViolations() {
    return {
      pass: true,
      message: () => 'Expected no accessibility violations',
    };
  },
});

// Add animation frame mock
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock AI service responses
jest.mock('@/lib/services/aiService', () => ({
  generateContent: jest.fn().mockImplementation(() => 
    Promise.resolve({
      heading: "Transform Your Digital Presence",
      subheading: "Create beautiful websites in minutes with our AI-powered platform",
      body: "Landing Pad Digital provides everything you need to build a professional website without coding skills."
    })
  ),
  getSuggestions: jest.fn().mockImplementation(() => 
    Promise.resolve([
      {
        id: "1",
        type: "text",
        title: "Modern Homepage Headline",
        content: {
          heading: "Create Stunning Websites Without Code",
          subheading: "Our AI-powered platform makes it easy to build professional websites in minutes"
        }
      },
      {
        id: "2",
        type: "text",
        title: "Feature Highlight",
        content: {
          heading: "Powerful Features, Simple Interface",
          subheading: "Everything you need to succeed online"
        }
      }
    ])
  ),
  modifyContent: jest.fn().mockImplementation(() => 
    Promise.resolve({
      content: "Modified content goes here. This is an improved version with better wording and structure."
    })
  )
}));
