import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { projectsRouter } from "./routes/projects.js";
import { storageRouter } from "./routes/storage.js";
import { paymentsRouter } from "./routes/payments.js";
import { initSocket } from "./socket.js";
import { isSupabaseConfigured } from "./supabase.js";
import { getLocalUploadsPath } from "./storage.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(
  cors({
    origin: true, // Allow frontend origin
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local upload artifacts if using local fallback
app.use("/uploads", express.static(getLocalUploadsPath()));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseConfigured(),
  });
});

// API Routes
app.use("/api/projects", projectsRouter);
app.use("/api/storage", storageRouter);
app.use("/api/payments", paymentsRouter);

// Initialize Socket.io
initSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Freelance Approval Backend Server running on port ${PORT}`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
  console.log(`⚡ Supabase Mode: ${isSupabaseConfigured() ? "CONNECTED" : "LOCAL FALLBACK"}`);
  console.log(`===============================================`);
});
