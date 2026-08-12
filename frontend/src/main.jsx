import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { SettingsProvider } from "./context/SettingsContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { queryClient } from "./lib/queryClient";
import "./index.css";

// AuthProvider is gone: session state lives in the Zustand store, and App
// bootstraps it via useAuthBootstrap(). QueryClientProvider sits above
// SettingsProvider because settings are fetched with React Query.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
