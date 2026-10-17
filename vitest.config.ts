import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], setupFiles: ['./tests/unit-setup.ts'] },
});
