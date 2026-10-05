import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { PROJECT_KEYS } from "./project.keys";

export const useAdminProject = (token?: string | null) => {
  return useQuery({
    queryKey: PROJECT_KEYS.admin(token),
    queryFn: async () => {
      if (!token) throw new Error("No auth token available");

      const { data } = await api.get("/projects/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data.data;
    },
    enabled: !!token,
    staleTime: 1000 * 2, // 2s stale time
    refetchInterval: 3500, // 3.5s auto-poll backup guarantee
    refetchIntervalInBackground: false,
  });
};
