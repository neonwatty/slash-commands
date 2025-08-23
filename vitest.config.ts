import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // Enables describe, it, expect globally
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/cli/index.ts', // CLI entry point
        '**/*.d.ts',
        'tests/setup.ts',
        'tests/e2e/fixtures/**' // Exclude E2E fixtures from coverage
      ]
    },
    setupFiles: ['tests/setup.ts'],
    testTimeout: 150000, // 2.5 minutes for E2E tests
    include: [
      'tests/**/*.test.ts'
    ]
  }
})