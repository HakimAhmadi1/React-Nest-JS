import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// `services/api` throws at import time when this is missing.
vi.stubEnv("VITE_API_URL", "http://localhost:3003/api");

afterEach(() => {
  cleanup();
  localStorage.clear();
});
