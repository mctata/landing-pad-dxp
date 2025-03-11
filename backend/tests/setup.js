// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Different port for tests
process.env.OPENAI_API_KEY = 'mock-api-key';
process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
process.env.DISABLE_RATE_LIMIT = 'true';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set up global timeout for all tests
jest.setTimeout(30000);

// Mock winston logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));
