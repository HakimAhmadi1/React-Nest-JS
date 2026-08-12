import { useContext } from "react";
import { SettingsContext } from "@/context/settings-context";

/**
 * Lives in its own module so `SettingsContext.jsx` only exports components —
 * mixing the two breaks Vite's react-refresh boundary.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
