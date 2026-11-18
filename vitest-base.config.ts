import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    // isolate: false speeds up tests by reusing the module graph between spec files.
    // we should keep this setting so testing remains fast
    // Reusing the module graph between spec files is ~2x faster. Specs must not rely on per-file
    // `vi.mock` of modules that other specs also import, or on leftover global state.
    isolate: false,
    globalSetup: './test-globals.ts',
  },
});
