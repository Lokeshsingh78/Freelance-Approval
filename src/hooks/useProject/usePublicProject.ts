import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { PROJECT_KEYS } from "./project.keys";

export const usePublicProject = (token?: string | null) => {
  return useQuery({
    queryKey: PROJECT_KEYS.public(token || ""),
    queryFn: async () => {
      if (!token) return null;
      const { data } = await api.get(`/projects/view/${token}`);
      return data.data;
    },
    enabled: Boolean(token),
    staleTime: 1000 * 30, // 30s fresh
    refetchInterval: 30000, // 30s background safety fallback
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      // If 404 (deleted/not found), fail immediately without delay
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
};
