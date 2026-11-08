import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.GOLEM_E2E_PORT ?? 4621);
export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  fullyParallel: true,
  // The dev machine is shared with other agents' test suites; keep parallelism and patience modest.
  workers: Number(process.env.GOLEM_E2E_WORKERS ?? 2),
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    command: `bun demo/server.ts`,
    env: { PORT: String(PORT), NODE_ENV: "production" },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
