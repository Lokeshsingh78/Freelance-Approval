/* ---------------------------------
 * FILE
 * --------------------------------- */

export interface FileData {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string; // signed URL from backend
  storageKey: string;
  projectId: string;
  createdAt: string;
}

/* ---------------------------------
 * ENUM-LIKE TYPES (Frontend-safe)
 * --------------------------------- */

export type ProjectStatus =
  | "PENDING"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "EXPIRED";

export type ApprovalDecisionType = "APPROVED" | "CHANGES_REQUESTED";

export type ActorRole = "ADMIN" | "CLIENT";

export type LogAction =
  | "PROJECT_CREATED"
  | "FILE_UPLOADED"
  | "CLIENT_VIEWED"
  | "CLIENT_APPROVED"
  | "CLIENT_REQUESTED_CHANGES";

/* ---------------------------------
 * AUDIT LOG
 * --------------------------------- */

export interface AuditLog {
  id: string;
  action: LogAction;
  actorRole: ActorRole;
  ipAddress: string | null;
  userAgent: string | null;
  projectId: string;
  createdAt: string;
}

/* ---------------------------------
 * APPROVAL DECISION (IMMUTABLE EVENT)
 * --------------------------------- */

export interface ApprovalDecision {
  id: string;
  type: ApprovalDecisionType; // ✅ FIXED (was decision: ProjectStatus)
  actorRole: ActorRole;

  comment: string | null;

  clientName: string | null;
  clientEmail: string | null;

  ipAddress: string | null;
  userAgent: string | null;

  projectId: string;
  createdAt: string;
}

/* ---------------------------------
 * PROJECT (AGGREGATE ROOT)
 * --------------------------------- */

export interface Project {
  id: string;
  name: string;

  adminToken: string;
  publicToken: string;

  status: ProjectStatus;

  expiresAt?: string | null;

  createdAt: string;
  updatedAt: string;

  file?: FileData | null;

  logs?: AuditLog[];

  decisions?: ApprovalDecision[];

  /** Convenience field from backend */
  latestComment?: string | null;
}

/* ---------------------------------
 * ZUSTAND STATE
 * --------------------------------- */

export interface ProjectState {
  project: Project | null;

  isLoading: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  /* -------- Actions -------- */

  fetchProject: (token: string, silent?: boolean) => Promise<void>;
  fetchPublicProject: (token: string, silent?: boolean) => Promise<void>;

  handleClientDecision: (
    token: string,
    feedback: string,
    decision: ApprovalDecisionType
  ) => Promise<void>;

  updateExpiration: (days: number) => Promise<void>;
  uploadDeliverable: (token: string, file: File) => Promise<void>;
  deleteProject: () => Promise<void>;

  /* -------- Socket-driven updaters -------- */

  updateStatusRealtime: (data: {
    status: ProjectStatus;
    comment?: string | null;
  }) => void;

  updateExpirationRealtime: (expiresAt: string) => void;
  refreshFileRealtime: () => void;
}
