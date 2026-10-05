import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { PROJECT_KEYS } from "./project.keys";

export const usePublicProject = (token?: string | null) => {
  if (!token) throw new Error("No auth token available");
  return useQuery({
    queryKey: PROJECT_KEYS.public(token),
    queryFn: async () => {
      const { data } = await api.get(`/projects/view/${token}`);
      return data.data;
    },
    enabled: !!token,
    staleTime: 1000 * 2, // 2s stale time
    refetchInterval: 3500, // 3.5s auto-poll backup guarantee
    refetchIntervalInBackground: false,
  });
};
