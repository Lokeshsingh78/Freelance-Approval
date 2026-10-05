import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/socket";
import { PROJECT_KEYS } from "@/hooks/useProject/project.keys";
import { playNotificationSound } from "@/lib/sound";

interface ExpirationPayload {
  expiresAt: string;
}

interface StatusPayload {
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  comment?: string | null;
  decisions?: any[];
}

interface SocketManagerProps {
  projectId: string;
}

export const SocketManager = ({ projectId }: SocketManagerProps) => {
  const { token } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !projectId) return;

    const socket = getSocket();

    // 1. Connection & Join Logic
    const handleJoin = () => {
      console.log(`🔌 Dashboard Socket Connected! Joining project room: ${projectId}`);
      socket.emit("join-project", { projectId });
    };

    if (socket.connected) {
      handleJoin();
    } else {
      socket.connect();
    }

    // --- HANDLER 1: STATUS & FEEDBACK CHANGE ---
    const handleStatusUpdate = (payload?: StatusPayload) => {
      console.log("⚡ Dashboard Socket: Status Updated event received:", payload);

      // Instantly trigger refetch
      queryClient.invalidateQueries({
        queryKey: PROJECT_KEYS.admin(token),
        refetchType: "all",
      });

      if (payload?.status === "APPROVED") {
        playNotificationSound("success");
        toast.success("Client Approved Deliverable!", {
          description: payload.comment
            ? `"${payload.comment}"`
            : "The client has approved your deliverable without additional notes.",
          duration: 7000,
        });
      } else if (payload?.status === "CHANGES_REQUESTED") {
        playNotificationSound("alert");
        toast.error("Client Requested Changes!", {
          description: payload.comment
            ? `"${payload.comment}"`
            : "The client requested revisions on your deliverable.",
          duration: 9000,
        });
      }
    };

    // --- HANDLER 2: EXPIRATION CHANGE ---
    const handleExpirationUpdate = (payload: ExpirationPayload) => {
      console.log("Socket: Expiration Update", payload);
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.admin(token), refetchType: "all" });
      toast.info("Link expiration updated.");
    };

    // --- HANDLER 3: FILES (Upload & Delete) ---
    const handleFileUpdate = () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.admin(token), refetchType: "all" });
    };

    // --- ATTACH LISTENERS ---
    socket.on("connect", handleJoin);
    socket.on("project-status-updated", handleStatusUpdate);
    socket.on("project-expiration-updated", handleExpirationUpdate);
    socket.on("file-uploaded", handleFileUpdate);
    socket.on("file-deleted", handleFileUpdate);

    // --- CLEANUP ---
    return () => {
      socket.emit("leave-project", { projectId, token });

      socket.off("connect", handleJoin);
      socket.off("project-status-updated", handleStatusUpdate);
      socket.off("project-expiration-updated", handleExpirationUpdate);
      socket.off("file-uploaded", handleFileUpdate);
      socket.off("file-deleted", handleFileUpdate);
    };
  }, [token, queryClient, projectId]);

  return null;
};
