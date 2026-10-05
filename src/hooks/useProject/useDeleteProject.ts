import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api/api";
import { toast } from "sonner";
import { PROJECT_KEYS } from "./project.keys";

export const useDeleteProject = (adminToken?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      if (!adminToken) {
        throw new Error("Admin token is missing");
      }

      await api.delete("/projects/admin/me", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
    },

    onSuccess: () => {
      toast.success("Project deleted");

      // Clear all project-related cache
      queryClient.removeQueries({
        queryKey: PROJECT_KEYS.all,
      });

      navigate("/", { replace: true });
    },

    onError: (err) => {
      console.error(err);
      toast.error("Failed to delete project");
    },
  });
};
