import api from "@/lib/api/api";

export const getDownloadUrlApi = async ({
  fileId,
  token,
  download = true, // Default to true for download actions
}: {
  fileId: string;
  token?: string;
  download?: boolean;
}) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  // Pass ?download=true/false to the backend
  const response = await api.get(
    `/storage/download/${fileId}?download=${download}`,
    config
  );

  return response.data; // { url: "https://r2...", filename: "..." }
};
