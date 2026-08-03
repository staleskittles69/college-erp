import { defineConfig } from "vitest/config";

// Dummy values so lib modules that throw on missing env vars (db.ts, auth.ts)
// can be imported in tests without needing real secrets or a live database.
export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_SECRET: "test-secret-not-used-in-production",
      MONGODB_URI: "mongodb://localhost:27017/college-erp-test",
    },
  },
});
