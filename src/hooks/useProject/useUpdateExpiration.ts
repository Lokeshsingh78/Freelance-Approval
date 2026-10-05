import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { toast } from "sonner";
import { PROJECT_KEYS } from "./project.keys";

export const useUpdateExpiration = (token?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (days: number) => {
      if (!token) throw new Error("Authentication token is missing");

      await api.patch(
        "/projects/admin/expiration",
        { days },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return days;
    },
    onSuccess: () => {
      toast.success("Expiration updated");
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.admin(),
      });
    },
    onError: () => {
      toast.error("Failed to update expiration");
    },
  });
};
