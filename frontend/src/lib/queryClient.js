import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        // Retrying an auth or permission failure just burns requests; the
        // axios interceptor already handles the one legitimate 401 retry.
        if ([401, 403, 404].includes(error?.status)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
