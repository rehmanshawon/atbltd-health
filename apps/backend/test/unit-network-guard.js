const originalFetch = global.fetch;

if (typeof originalFetch === 'function') {
  global.fetch = async function blockedUnitTestFetch() {
    throw new Error(
      'Network access is blocked in backend unit tests. Mock fetch or the gateway service.',
    );
  };
}
