import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/socket";
import { PROJECT_KEYS } from "@/hooks/useProject/project.keys";
import { playNotificationSound } from "@/lib/sound";

interface StatusPayload {
  status: string;
  comment?: string | null;
  decisions?: any[];
}

interface ExpirationPayload {
  expiresAt: string;
}

interface ClientSocketManagerProps {
  projectId: string;
}

export const ClientSocketManager = ({
  projectId,
}: ClientSocketManagerProps) => {
  const { token } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !projectId) return;

    const socket = getSocket();

    // 1. Connection & Join Logic
    const handleJoin = () => {
      console.log(`🔌 Client Socket Connected! Joining project room: ${projectId}`);
      socket.emit("join-project", { projectId });
    };

    if (socket.connected) {
      handleJoin();
    } else {
      socket.connect();
    }

    // --- HANDLER 1: STATUS UPDATE ---
    const handleStatusUpdate = (payload: StatusPayload) => {
      console.log("Client Socket: Status Update", payload);
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.public(token),
        refetchType: "all",
      });
    };

    // --- HANDLER 2: EXPIRATION UPDATE ---
    const handleExpirationUpdate = (payload: ExpirationPayload) => {
      console.log("Client Socket: Expiration Update", payload);
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.public(token),
        refetchType: "all",
      });
    };

    // --- HANDLER 3: FILES (Upload & Delete) ---
    const handleFileRefresh = () => {
      console.log("Client Socket: File refreshed by freelancer");
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.public(token),
        refetchType: "all",
      });
      playNotificationSound("success");
      toast.info("Deliverable Updated!", {
        description: "The freelancer uploaded an updated deliverable file.",
      });
    };

    // --- ATTACH LISTENERS ---
    socket.on("connect", handleJoin);
    socket.on("project-status-updated", handleStatusUpdate);
    socket.on("project-expiration-updated", handleExpirationUpdate);
    socket.on("file-uploaded", handleFileRefresh);
    socket.on("file-deleted", handleFileRefresh);

    // --- CLEANUP ---
    return () => {
      socket.emit("leave-project", { projectId, token });

      socket.off("connect", handleJoin);
      socket.off("project-status-updated", handleStatusUpdate);
      socket.off("project-expiration-updated", handleExpirationUpdate);
      socket.off("file-uploaded", handleFileRefresh);
      socket.off("file-deleted", handleFileRefresh);
    };
  }, [token, queryClient, projectId]);

  return null;
};
