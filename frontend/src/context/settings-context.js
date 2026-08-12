import { createContext } from "react";

/**
 * Lives apart from the provider component so `SettingsContext.jsx` exports
 * only components, which is what Vite's fast-refresh boundary requires.
 */
export const SettingsContext = createContext(null);
