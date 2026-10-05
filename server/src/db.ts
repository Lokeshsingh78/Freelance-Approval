import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase, isSupabaseConfigured } from "./supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_FILE = path.resolve(__dirname, "../../local_db.json");

export interface ProjectRecord {
  id: string;
  name: string;
  adminToken: string;
  publicToken: string;
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "EXPIRED";
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  file?: any | null;
  logs?: any[];
  decisions?: any[];
  latestComment?: string | null;
}

export interface PaymentRecord {
  id: string;
  projectId: string;
  orderId: string;
  cfOrderId?: string;
  paymentSessionId?: string;
  amount: number;
  currency: string;
  fileName?: string;
  fileSize?: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  paymentMethod?: string;
  referenceId?: string;
  createdAt: string;
  updatedAt: string;
}

// Local in-memory state with JSON persistence
interface LocalState {
  projects: Record<string, ProjectRecord>;
  files: Record<string, any>;
  logs: any[];
  decisions: any[];
  payments: Record<string, PaymentRecord>;
}

let localState: LocalState = {
  projects: {},
  files: {},
  logs: [],
  decisions: [],
  payments: {},
};

const loadLocalDb = () => {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const data = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
      localState = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local DB:", err);
  }
};

const saveLocalDb = () => {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localState, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local DB:", err);
  }
};

loadLocalDb();

export const createProject = async (
  name: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ id: string; adminToken: string; publicToken: string }> => {
  const id = crypto.randomUUID();
  const adminToken = crypto.randomBytes(24).toString("hex");
  const publicToken = crypto.randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  // Default expiration: 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { error: projError } = await supabase.from("projects").insert({
      id,
      name,
      admin_token: adminToken,
      public_token: publicToken,
      status: "PENDING",
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    });

    if (projError) {
      console.error("Supabase insert project error:", projError);
      throw projError;
    }

    await supabase.from("audit_logs").insert({
      id: crypto.randomUUID(),
      project_id: id,
      action: "PROJECT_CREATED",
      actor_role: "ADMIN",
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: now,
    });
  } else {
    localState.projects[id] = {
      id,
      name,
      adminToken,
      publicToken,
      status: "PENDING",
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    localState.logs.push({
      id: crypto.randomUUID(),
      projectId: id,
      action: "PROJECT_CREATED",
      actorRole: "ADMIN",
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: now,
    });

    saveLocalDb();
  }

  return { id, adminToken, publicToken };
};

export const getProjectByAdminToken = async (
  adminToken: string
): Promise<ProjectRecord | null> => {
  if (isSupabaseConfigured() && supabase) {
    const { data: proj, error } = await supabase
      .from("projects")
      .select("*")
      .eq("admin_token", adminToken)
      .maybeSingle();

    if (error || !proj) return null;

    // Fetch attached file
    const { data: files } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", proj.id)
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch logs
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("project_id", proj.id)
      .order("created_at", { ascending: true });

    // Fetch decisions
    const { data: decisions } = await supabase
      .from("approval_decisions")
      .select("*")
      .eq("project_id", proj.id)
      .order("created_at", { ascending: false });

    const latestDecision = decisions && decisions.length > 0 ? decisions[0] : null;

    let fileObj = null;
    if (files && files.length > 0) {
      const f = files[0];
      fileObj = {
        id: f.id,
        fileId: f.id,
        fileName: f.file_name,
        mimeType: f.mime_type,
        size: Number(f.size),
        url: f.url,
        storageKey: f.storage_key,
        projectId: f.project_id,
        createdAt: f.created_at,
      };
    }

    return {
      id: proj.id,
      name: proj.name,
      adminToken: proj.admin_token,
      publicToken: proj.public_token,
      status: proj.status,
      expiresAt: proj.expires_at,
      createdAt: proj.created_at,
      updatedAt: proj.updated_at,
      file: fileObj,
      logs: (logs || []).map((l) => ({
        id: l.id,
        action: l.action,
        actorRole: l.actor_role,
        ipAddress: l.ip_address,
        userAgent: l.user_agent,
        projectId: l.project_id,
        createdAt: l.created_at,
      })),
      decisions: (decisions || []).map((d) => ({
        id: d.id,
        type: d.type,
        actorRole: d.actor_role,
        comment: d.comment,
        clientName: d.client_name,
        clientEmail: d.client_email,
        ipAddress: d.ip_address,
        userAgent: d.user_agent,
        projectId: d.project_id,
        createdAt: d.created_at,
      })),
      latestComment: latestDecision ? latestDecision.comment : null,
    };
  } else {
    const proj = Object.values(localState.projects).find(
      (p) => p.adminToken === adminToken
    );
    if (!proj) return null;

    const file = Object.values(localState.files).find(
      (f) => f.projectId === proj.id
    );
    const logs = localState.logs.filter((l) => l.projectId === proj.id);
    const decisions = (localState.decisions || [])
      .filter((d) => d.projectId === proj.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestDecision = decisions.length > 0 ? decisions[0] : null;

    return {
      ...proj,
      file: file || null,
      logs,
      decisions,
      latestComment: latestDecision ? latestDecision.comment : null,
    };
  }
};

export const getProjectByPublicToken = async (
  publicToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ProjectRecord | null> => {
  if (isSupabaseConfigured() && supabase) {
    const { data: proj, error } = await supabase
      .from("projects")
      .select("*")
      .eq("public_token", publicToken)
      .maybeSingle();

    if (error || !proj) return null;

    // Log client viewed
    await supabase.from("audit_logs").insert({
      id: crypto.randomUUID(),
      project_id: proj.id,
      action: "CLIENT_VIEWED",
      actor_role: "CLIENT",
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
    });

    const { data: files } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", proj.id)
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch all decisions for complete remarks & feedback history
    const { data: decisions } = await supabase
      .from("approval_decisions")
      .select("*")
      .eq("project_id", proj.id)
      .order("created_at", { ascending: false });

    const latestDecision = decisions && decisions.length > 0 ? decisions[0] : null;

    let fileObj = null;
    if (files && files.length > 0) {
      const f = files[0];
      fileObj = {
        id: f.id,
        fileId: f.id,
        fileName: f.file_name,
        mimeType: f.mime_type,
        size: Number(f.size),
        url: f.url,
        storageKey: f.storage_key,
        projectId: f.project_id,
        createdAt: f.created_at,
      };
    }

    return {
      id: proj.id,
      name: proj.name,
      adminToken: "",
      publicToken: proj.public_token,
      status: proj.status,
      expiresAt: proj.expires_at,
      createdAt: proj.created_at,
      updatedAt: proj.updated_at,
      file: fileObj,
      decisions: (decisions || []).map((d) => ({
        id: d.id,
        type: d.type,
        actorRole: d.actor_role,
        comment: d.comment,
        clientName: d.client_name,
        clientEmail: d.client_email,
        ipAddress: d.ip_address,
        userAgent: d.user_agent,
        projectId: d.project_id,
        createdAt: d.created_at,
      })),
      latestComment: latestDecision ? latestDecision.comment : null,
    };
  } else {
    const proj = Object.values(localState.projects).find(
      (p) => p.publicToken === publicToken
    );
    if (!proj) return null;

    // Log client viewed
    localState.logs.push({
      id: crypto.randomUUID(),
      projectId: proj.id,
      action: "CLIENT_VIEWED",
      actorRole: "CLIENT",
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date().toISOString(),
    });
    saveLocalDb();

    const file = Object.values(localState.files).find(
      (f) => f.projectId === proj.id
    );

    const decisions = (localState.decisions || [])
      .filter((d) => d.projectId === proj.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestDecision = decisions.length > 0 ? decisions[0] : null;

    return {
      ...proj,
      file: file || null,
      decisions,
      latestComment: latestDecision ? latestDecision.comment : null,
    };
  }
};

export const updateProjectStatus = async (
  publicToken: string,
  decision: "APPROVED" | "CHANGES_REQUESTED",
  comment?: string,
  ipAddress?: string,
  userAgent?: string,
  clientName?: string,
  clientEmail?: string
): Promise<ProjectRecord | null> => {
  const now = new Date().toISOString();
  const cleanComment = typeof comment === "string" ? comment.trim() : null;
  const cleanName = typeof clientName === "string" && clientName.trim() ? clientName.trim() : null;
  const cleanEmail = typeof clientEmail === "string" && clientEmail.trim() ? clientEmail.trim() : null;

  if (isSupabaseConfigured() && supabase) {
    const { data: proj, error } = await supabase
      .from("projects")
      .select("*")
      .eq("public_token", publicToken)
      .maybeSingle();

    if (error || !proj) return null;

    await supabase
      .from("projects")
      .update({ status: decision, updated_at: now })
      .eq("id", proj.id);

    // Save decision in Supabase (immutable event preserving complete remarks history)
    await supabase.from("approval_decisions").insert({
      id: crypto.randomUUID(),
      project_id: proj.id,
      type: decision,
      actor_role: "CLIENT",
      comment: cleanComment,
      client_name: cleanName,
      client_email: cleanEmail,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: now,
    });

    await supabase.from("audit_logs").insert({
      id: crypto.randomUUID(),
      project_id: proj.id,
      action: decision === "APPROVED" ? "CLIENT_APPROVED" : "CLIENT_REQUESTED_CHANGES",
      actor_role: "CLIENT",
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: now,
    });

    return await getProjectByPublicToken(publicToken);
  } else {
    const proj = Object.values(localState.projects).find(
      (p) => p.publicToken === publicToken
    );
    if (!proj) return null;

    proj.status = decision;
    proj.updatedAt = now;

    if (!localState.decisions) localState.decisions = [];
    localState.decisions.push({
      id: crypto.randomUUID(),
      projectId: proj.id,
      type: decision,
      actorRole: "CLIENT",
      comment: cleanComment,
      clientName: cleanName,
      clientEmail: cleanEmail,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: now,
    });

    if (!localState.logs) localState.logs = [];
    localState.logs.push({
      id: crypto.randomUUID(),
      projectId: proj.id,
      action: decision === "APPROVED" ? "CLIENT_APPROVED" : "CLIENT_REQUESTED_CHANGES",
      actorRole: "CLIENT",
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: now,
    });

    saveLocalDb();
    return getProjectByPublicToken(publicToken);
  }
};


export const updateProjectExpiration = async (
  adminToken: string,
  days: number
): Promise<{ expiresAt: string; projectId: string } | null> => {
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data: proj, error } = await supabase
      .from("projects")
      .select("id")
      .eq("admin_token", adminToken)
      .maybeSingle();

    if (error || !proj) return null;

    await supabase
      .from("projects")
      .update({ expires_at: expiresAt, updated_at: now })
      .eq("id", proj.id);

    return { expiresAt, projectId: proj.id };
  } else {
    const proj = Object.values(localState.projects).find(
      (p) => p.adminToken === adminToken
    );
    if (!proj) return null;

    proj.expiresAt = expiresAt;
    proj.updatedAt = now;
    saveLocalDb();

    return { expiresAt, projectId: proj.id };
  }
};

export const deleteProject = async (adminToken: string): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("admin_token", adminToken)
      .maybeSingle();

    if (!proj) return false;

    await supabase.from("projects").delete().eq("id", proj.id);
    return true;
  } else {
    const proj = Object.values(localState.projects).find(
      (p) => p.adminToken === adminToken
    );
    if (!proj) return false;

    delete localState.projects[proj.id];
    delete localState.files[proj.id];
    localState.logs = localState.logs.filter((l) => l.projectId !== proj.id);
    localState.decisions = localState.decisions.filter(
      (d) => d.projectId !== proj.id
    );
    saveLocalDb();
    return true;
  }
};

export const attachFileToProject = async (
  adminToken: string,
  fileData: {
    key: string;
    filename: string;
    size: number;
    mimeType: string;
    url: string;
  }
): Promise<{ file: any; projectId: string } | null> => {
  const fileId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id, status")
      .eq("admin_token", adminToken)
      .maybeSingle();

    if (!proj) return null;

    // Always reset project status to PENDING upon new deliverable upload/revision
    await supabase
      .from("projects")
      .update({ status: "PENDING", updated_at: now })
      .eq("id", proj.id);

    // Delete existing file records if replacing
    await supabase.from("files").delete().eq("project_id", proj.id);

    const { error } = await supabase.from("files").insert({
      id: fileId,
      project_id: proj.id,
      file_name: fileData.filename,
      mime_type: fileData.mimeType,
      size: fileData.size,
      storage_key: fileData.key,
      url: fileData.url,
      created_at: now,
    });

    if (error) {
      console.error("Supabase insert file error:", error);
      throw error;
    }

    await supabase.from("audit_logs").insert({
      id: crypto.randomUUID(),
      project_id: proj.id,
      action: "FILE_UPLOADED",
      actor_role: "ADMIN",
      created_at: now,
    });

    const file = {
      id: fileId,
      fileId,
      fileName: fileData.filename,
      mimeType: fileData.mimeType,
      size: fileData.size,
      url: fileData.url,
      storageKey: fileData.key,
      projectId: proj.id,
      createdAt: now,
    };

    return { file, projectId: proj.id };
  } else {
    const proj = Object.values(localState.projects).find(
      (p) => p.adminToken === adminToken
    );
    if (!proj) return null;

    // Always reset project status to PENDING upon new deliverable upload/revision
    proj.status = "PENDING";
    proj.updatedAt = now;

    const file = {
      id: fileId,
      fileId,
      fileName: fileData.filename,
      mimeType: fileData.mimeType,
      size: fileData.size,
      url: fileData.url,
      storageKey: fileData.key,
      projectId: proj.id,
      createdAt: now,
    };

    localState.files[proj.id] = file;
    localState.logs.push({
      id: crypto.randomUUID(),
      projectId: proj.id,
      action: "FILE_UPLOADED",
      actorRole: "ADMIN",
      createdAt: now,
    });

    saveLocalDb();
    return { file, projectId: proj.id };
  }
};

export const getFileById = async (fileId: string): Promise<any | null> => {
  if (isSupabaseConfigured() && supabase) {
    const { data: f } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .maybeSingle();

    if (!f) return null;

    return {
      id: f.id,
      fileId: f.id,
      fileName: f.file_name,
      mimeType: f.mime_type,
      size: Number(f.size),
      url: f.url,
      storageKey: f.storage_key,
      projectId: f.project_id,
      createdAt: f.created_at,
    };
  } else {
    const file = Object.values(localState.files).find((f) => f.id === fileId);
    return file || null;
  }
};

export const deleteFile = async (
  fileId: string,
  projectId?: string
): Promise<{ success: boolean; storageKey?: string; projectId?: string }> => {
  if (isSupabaseConfigured() && supabase) {
    const { data: f } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .maybeSingle();

    if (!f) return { success: false };

    await supabase.from("files").delete().eq("id", fileId);
    return {
      success: true,
      storageKey: f.storage_key,
      projectId: f.project_id,
    };
  } else {
    const file = Object.values(localState.files).find((f) => f.id === fileId);
    if (!file) return { success: false };

    const targetProjectId = projectId || file.projectId;
    delete localState.files[targetProjectId];
    saveLocalDb();

    return {
      success: true,
      storageKey: file.storageKey,
      projectId: targetProjectId,
    };
  }
};

// ==========================================
// PAYMENT DATABASE OPERATIONS
// ==========================================

export const recordPayment = async (data: {
  projectId: string;
  orderId: string;
  cfOrderId?: string;
  paymentSessionId?: string;
  amount: number;
  currency?: string;
  fileName?: string;
  fileSize?: number;
}): Promise<PaymentRecord> => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    id,
    projectId: data.projectId,
    orderId: data.orderId,
    cfOrderId: data.cfOrderId,
    paymentSessionId: data.paymentSessionId,
    amount: data.amount,
    currency: data.currency || "INR",
    fileName: data.fileName,
    fileSize: data.fileSize,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  // 1. Always record in local DB
  if (!localState.payments) localState.payments = {};
  localState.payments[data.orderId] = record;
  saveLocalDb();

  // 2. Insert into Supabase if configured (safe try/catch)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from("payments").insert({
        id,
        project_id: data.projectId,
        order_id: data.orderId,
        cf_order_id: data.cfOrderId || null,
        payment_session_id: data.paymentSessionId || null,
        amount: data.amount,
        currency: data.currency || "INR",
        file_name: data.fileName || null,
        file_size: data.fileSize || null,
        status: "PENDING",
        created_at: now,
        updated_at: now,
      });

      if (error) {
        console.warn("Supabase payments table insert warning:", error.message);
      }
    } catch (err: any) {
      console.warn("Supabase payments insert error:", err.message);
    }
  }

  return record;
};

export const updatePaymentStatus = async (
  orderId: string,
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED",
  details?: { paymentMethod?: string; referenceId?: string; cfOrderId?: string }
): Promise<PaymentRecord | null> => {
  const now = new Date().toISOString();

  // 1. Update in local DB
  if (!localState.payments) localState.payments = {};
  const localRec = localState.payments[orderId];
  if (localRec) {
    localRec.status = status;
    localRec.updatedAt = now;
    if (details?.paymentMethod) localRec.paymentMethod = details.paymentMethod;
    if (details?.referenceId) localRec.referenceId = details.referenceId;
    if (details?.cfOrderId) localRec.cfOrderId = details.cfOrderId;
    saveLocalDb();
  }

  // 2. Update in Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const updateData: any = {
        status,
        updated_at: now,
      };
      if (details?.paymentMethod) updateData.payment_method = details.paymentMethod;
      if (details?.referenceId) updateData.reference_id = details.referenceId;
      if (details?.cfOrderId) updateData.cf_order_id = details.cfOrderId;

      const { data, error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("order_id", orderId)
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Supabase payments update warning:", error.message);
      } else if (data) {
        return {
          id: data.id,
          projectId: data.project_id,
          orderId: data.order_id,
          cfOrderId: data.cf_order_id,
          paymentSessionId: data.payment_session_id,
          amount: Number(data.amount),
          currency: data.currency,
          fileName: data.file_name,
          fileSize: Number(data.file_size),
          status: data.status,
          paymentMethod: data.payment_method,
          referenceId: data.reference_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err: any) {
      console.warn("Supabase payments update error:", err.message);
    }
  }

  return localRec || null;
};

export const getPaymentByOrderId = async (orderId: string): Promise<PaymentRecord | null> => {
  // Check Supabase first
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          orderId: data.order_id,
          cfOrderId: data.cf_order_id,
          paymentSessionId: data.payment_session_id,
          amount: Number(data.amount),
          currency: data.currency,
          fileName: data.file_name,
          fileSize: Number(data.file_size),
          status: data.status,
          paymentMethod: data.payment_method,
          referenceId: data.reference_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err: any) {
      console.warn("Supabase query error for payment:", err.message);
    }
  }

  // Local fallback
  return localState.payments?.[orderId] || null;
};

export const getPaymentsByProjectId = async (projectId: string): Promise<PaymentRecord[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          orderId: d.order_id,
          cfOrderId: d.cf_order_id,
          paymentSessionId: d.payment_session_id,
          amount: Number(d.amount),
          currency: d.currency,
          fileName: d.file_name,
          fileSize: Number(d.file_size),
          status: d.status,
          paymentMethod: d.payment_method,
          referenceId: d.reference_id,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err: any) {
      console.warn("Supabase payments list error:", err.message);
    }
  }

  // Local fallback
  return Object.values(localState.payments || {}).filter((p) => p.projectId === projectId);
};

