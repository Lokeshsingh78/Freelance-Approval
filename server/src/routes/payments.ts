import { Router, Request, Response } from "express";
import crypto from "crypto";
import {
  createCashfreeOrder,
  getCashfreeOrder,
  getCashfreeOrderPayments,
  getCashfreePublicConfig,
} from "../cashfree.js";
import {
  recordPayment,
  updatePaymentStatus,
  getPaymentByOrderId,
  getPaymentsByProjectId,
  getProjectByAdminToken,
} from "../db.js";
import { calculateUploadPrice } from "../pricing.js";

export const paymentsRouter = Router();

// Helper to extract admin token
const getAdminToken = (req: Request): string | null => {
  const xAdmin = req.headers["x-admin-token"];
  if (typeof xAdmin === "string" && xAdmin.trim()) {
    return xAdmin.trim();
  }

  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  return null;
};

// 1. Get Public Cashfree Configuration (AppID, mode)
paymentsRouter.get("/config", (_req: Request, res: Response) => {
  res.json(getCashfreePublicConfig());
});

// 2. Calculate Fee Preview (public / unauthenticated helper)
paymentsRouter.post("/calculate-fee", (req: Request, res: Response) => {
  const { bytes } = req.body;
  const pricing = calculateUploadPrice(Number(bytes) || 0);
  res.json(pricing);
});

// 3. Create Cashfree Order
paymentsRouter.post("/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized: Admin token required" });
      return;
    }

    const project = await getProjectByAdminToken(token);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const {
      filename,
      fileSize,
      customerName,
      customerPhone,
      customerEmail,
      returnUrl,
    } = req.body;

    const sizeBytes = Number(fileSize) || 0;
    const pricing = calculateUploadPrice(sizeBytes);

    if (pricing.isFree) {
      res.json({
        isFree: true,
        amount: 0,
        message: "File is under 100MB and qualifies for Free upload",
      });
      return;
    }

    // Generate unique order ID (alphanumeric, max 45 chars)
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const cleanCustomerName = (customerName || project.name || "Freelancer").slice(0, 50);
    const cleanPhone = (customerPhone || "9999999999").replace(/[^0-9]/g, "").slice(-10) || "9999999999";

    // Call Cashfree API to create the order
    const cfOrder = await createCashfreeOrder({
      orderId,
      amount: pricing.amount,
      currency: "INR",
      customerId: `cust_${project.id.slice(0, 8)}`,
      customerName: cleanCustomerName,
      customerEmail: customerEmail || "deliverable@freelance-approval.com",
      customerPhone: cleanPhone,
      orderNote: `Deliverable fee: ${filename || "file"} (${pricing.sizeMB} MB) - Tier ${pricing.tierMaxMB} MB`,
      returnUrl: returnUrl || undefined,
    });

    // Save pending record in DB
    const paymentRecord = await recordPayment({
      projectId: project.id,
      orderId,
      cfOrderId: cfOrder.cf_order_id,
      paymentSessionId: cfOrder.payment_session_id,
      amount: pricing.amount,
      currency: "INR",
      fileName: filename,
      fileSize: sizeBytes,
    });

    res.json({
      success: true,
      orderId,
      cfOrderId: cfOrder.cf_order_id,
      paymentSessionId: cfOrder.payment_session_id,
      amount: pricing.amount,
      currency: "INR",
      tierLabel: pricing.tierLabel,
      pricing,
      paymentRecord,
    });
  } catch (error: any) {
    console.error("Create payment order error:", error);
    res.status(500).json({
      message: error.message || "Failed to create payment order",
    });
  }
});

// 4. Verify Payment Status with Cashfree
paymentsRouter.post("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ message: "orderId is required" });
      return;
    }

    const existingPayment = await getPaymentByOrderId(orderId);
    if (!existingPayment) {
      res.status(404).json({ message: "Payment record not found" });
      return;
    }

    // Already marked as SUCCESS
    if (existingPayment.status === "SUCCESS") {
      res.json({
        success: true,
        status: "SUCCESS",
        orderId,
        payment: existingPayment,
      });
      return;
    }

    // Fetch live status from Cashfree
    const cfOrder = await getCashfreeOrder(orderId);
    console.log(`Cashfree order status check for ${orderId}:`, cfOrder.order_status);

    if (cfOrder.order_status === "PAID") {
      // Fetch payment details like payment_method / reference_id
      const cfPayments = await getCashfreeOrderPayments(orderId);
      const successfulPayment = Array.isArray(cfPayments)
        ? cfPayments.find((p) => p.payment_status === "SUCCESS") || cfPayments[0]
        : null;

      const updated = await updatePaymentStatus(orderId, "SUCCESS", {
        paymentMethod: successfulPayment?.payment_group || successfulPayment?.payment_method?.type || "Cashfree PG",
        referenceId: successfulPayment?.bank_reference || successfulPayment?.cf_payment_id?.toString(),
        cfOrderId: cfOrder.cf_order_id,
      });

      res.json({
        success: true,
        status: "SUCCESS",
        orderId,
        payment: updated,
      });
      return;
    }

    if (cfOrder.order_status === "EXPIRED" || cfOrder.order_status === "TERMINATED") {
      await updatePaymentStatus(orderId, "FAILED");
      res.status(400).json({
        success: false,
        status: cfOrder.order_status,
        message: "Payment order has expired or failed",
      });
      return;
    }

    // Still ACTIVE / Pending
    res.json({
      success: false,
      status: cfOrder.order_status || "PENDING",
      message: "Payment is pending completion on Cashfree",
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: error.message || "Failed to verify payment",
    });
  }
});

// 5. Development Test Verify (Allows seamless testing in local dev without incurring real money charges)
paymentsRouter.post("/dev-verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getAdminToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ message: "orderId is required" });
      return;
    }

    const updated = await updatePaymentStatus(orderId, "SUCCESS", {
      paymentMethod: "TEST_SIMULATION",
      referenceId: `sim_${Date.now()}`,
    });

    res.json({
      success: true,
      status: "SUCCESS",
      orderId,
      payment: updated,
      isSimulated: true,
    });
  } catch (error: any) {
    console.error("Dev verify error:", error);
    res.status(500).json({ message: error.message || "Dev verify failed" });
  }
});

// 6. Get Payments for a Project
paymentsRouter.get("/project/:projectId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const payments = await getPaymentsByProjectId(projectId);
    res.json(payments);
  } catch (error: any) {
    console.error("Get project payments error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch payments" });
  }
});
