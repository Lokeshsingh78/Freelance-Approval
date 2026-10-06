import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { PROJECT_KEYS } from "./project.keys";

export const useAdminProject = (token?: string | null) => {
  return useQuery({
    queryKey: PROJECT_KEYS.admin(token || ""),
    queryFn: async () => {
      if (!token) return null;

      const { data } = await api.get("/projects/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data.data;
    },
    enabled: Boolean(token),
    staleTime: 1000 * 30, // 30s fresh
    refetchInterval: 30000, // 30s background safety fallback
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404 || error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
};
