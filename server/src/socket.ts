import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    socket.on("join-project", ({ projectId }) => {
      if (projectId) {
        socket.join(projectId);
        console.log(`🔌 Socket ${socket.id} joined room: ${projectId}`);
      }
    });

    socket.on("leave-project", ({ projectId, token }) => {
      const room = projectId || token;
      if (room) {
        socket.leave(room);
        console.log(`👋 Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;

export const emitProjectStatusUpdated = (projectId: string, payload?: any) => {
  if (io && projectId) {
    console.log(`📢 Emitting project-status-updated for ${projectId}`);
    io.to(projectId).emit("project-status-updated", payload);
  }
};

export const emitProjectExpirationUpdated = (projectId: string, expiresAt: string) => {
  if (io && projectId) {
    console.log(`📢 Emitting project-expiration-updated for ${projectId}:`, expiresAt);
    io.to(projectId).emit("project-expiration-updated", { expiresAt });
  }
};

export const emitFileUploaded = (projectId: string) => {
  if (io && projectId) {
    console.log(`📢 Emitting file-uploaded for ${projectId}`);
    io.to(projectId).emit("file-uploaded");
  }
};

export const emitFileDeleted = (projectId: string) => {
  if (io && projectId) {
    console.log(`📢 Emitting file-deleted for ${projectId}`);
    io.to(projectId).emit("file-deleted");
  }
};
