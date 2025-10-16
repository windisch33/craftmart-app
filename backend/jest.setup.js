// Global Jest setup to prevent open-handle warnings from long-lived timers
// in browserPool/pdfCache during tests.

jest.mock('./dist/services/browserPool.js', () => {
  const fakePage = {
    setViewport: async () => {},
    setContent: async () => {},
    pdf: async () => Buffer.from('PDF'),
    close: async () => {},
  };
  const fakeBrowser = { newPage: async () => fakePage };
  const api = { getBrowser: async () => fakeBrowser, releaseBrowser: () => {} };
  return { __esModule: true, browserPool: api, default: api };
});

jest.mock('./dist/services/pdfCache.js', () => {
  const api = {
    get: async () => null,
    set: async () => {},
    clearAll: async () => {},
    invalidateJob: async () => {},
    getStats: () => ({ memoryEntries: 0, totalMemorySize: 0 })
  };
  return { __esModule: true, pdfCache: api, default: api };
});

