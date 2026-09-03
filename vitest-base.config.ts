import { defineConfig } from 'vitest/config';

// Loaded by the Angular `unit-test` builder (see angular.json -> architect.test.options.runnerConfig)
// for every project. The builder defaults `test.isolate` to `false` to mimic the old Karma runner,
// where all spec files shared a single browser context. That default means spec files also share a
// single module registry within a worker, so a `vi.mock(...)` call in one file can leak into (or be
// clobbered by) another file's mocks depending on run order - unlike Jest, which always isolates
// each spec file's module registry.
//
// Set isolate back to `true` so each spec file gets its own module registry again, matching the
// guarantees the Jest-based test suite relied on before the Vitest migration.
export default defineConfig({
  test: {
    isolate: true,
  },
});
