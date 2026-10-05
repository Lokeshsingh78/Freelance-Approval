import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { toast } from "sonner";
import { PROJECT_KEYS } from "./project.keys";

export const useDeleteFile = (token?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      projectId,
    }: {
      fileId: string;
      projectId: string;
    }) => {
      if (!fileId || !projectId) throw new Error("Missing ID");
      if (!token) throw new Error("Missing Token");

      await api.post(
        `/storage/${fileId}`,
        {
          projectId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },

    onSuccess: () => {
      toast.success("File deleted");
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.admin(token),
      });
    },

    onError: (err) => {
      console.error(err);
      toast.error("Failed to delete file");
    },
  });
};
