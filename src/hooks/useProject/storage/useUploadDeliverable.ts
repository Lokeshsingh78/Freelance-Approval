import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api/api";
import { toast } from "sonner";
import { PROJECT_KEYS } from "../project.keys";

export interface UploadDeliverableOptions {
  paymentOrderId?: string;
}

export const useUploadDeliverable = (token?: string) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (params: { file: File; options?: UploadDeliverableOptions } | File) => {
      if (!token) throw new Error("Authentication token is missing");

      const file = params instanceof File ? params : params.file;
      const paymentOrderId = params instanceof File ? undefined : params.options?.paymentOrderId;

      setUploadProgress(0);

      const { data: signData } = await api.post(
        "/storage/sign-url",
        {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          paymentOrderId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await api.put(signData.uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (ev) => {
          if (ev.total) {
            setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
          }
        },
      });

      await api.post(
        "/storage/confirm",
        {
          key: signData.key,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          paymentOrderId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      setUploadProgress(0);
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.admin(token),
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Upload failed";
      toast.error(msg);
      setUploadProgress(0);
    },
  });

  const uploadDeliverable = async (
    file: File,
    options?: UploadDeliverableOptions
  ) => {
    return mutation.mutateAsync({ file, options });
  };

  return {
    uploadDeliverable,
    isUploading: mutation.isPending,
    uploadProgress,
  };
};

