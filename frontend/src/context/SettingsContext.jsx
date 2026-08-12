import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "@/services/api";
import { SettingsContext } from "./settings-context";

const DEFAULTS = {
  appName: "Generic App",
  appEmail: "",
  supportUrl: "/support",
  logoUrl: "",
  primaryColor: "",
};

/**
 * Public branding, fetched from the unauthenticated settings endpoint.
 *
 * Backed by React Query rather than a hand-rolled effect: it handles
 * cancellation, deduplication and out-of-order responses, which the previous
 * useState + useEffect version did not.
 */
export const SettingsProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getApi("system/settings", {}, false),
    // Branding is cosmetic — never block or retry-storm the app over it.
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  const refetchSettings = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["public-settings"] }),
    [queryClient],
  );

  const value = useMemo(
    () => ({
      settings: { ...DEFAULTS, ...(data ?? {}) },
      fetchSettings: refetchSettings,
      loading: isLoading,
    }),
    [data, isLoading, refetchSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
