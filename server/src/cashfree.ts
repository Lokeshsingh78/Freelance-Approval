import dotenv from "dotenv";

dotenv.config();

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const CASHFREE_ENV = (process.env.CASHFREE_ENV || "PRODUCTION").toUpperCase();

const CASHFREE_BASE_URL =
  CASHFREE_ENV === "SANDBOX"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

const CASHFREE_API_VERSION = "2023-08-01";

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderNote?: string;
  returnUrl?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED";
  payment_session_id: string;
  order_amount: number;
  order_currency: string;
  [key: string]: any;
}

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-client-id": CASHFREE_APP_ID,
  "x-client-secret": CASHFREE_SECRET_KEY,
  "x-api-version": CASHFREE_API_VERSION,
});

/**
 * Create a new payment order on Cashfree
 */
export const createCashfreeOrder = async (
  params: CreateOrderParams
): Promise<CashfreeOrderResponse> => {
  const url = `${CASHFREE_BASE_URL}/orders`;

  const body = {
    order_id: params.orderId,
    order_amount: Number(params.amount.toFixed(2)),
    order_currency: params.currency || "INR",
    customer_details: {
      customer_id: params.customerId || `cust_${Date.now()}`,
      customer_name: params.customerName || "Freelance Admin",
      customer_email: params.customerEmail || "admin@freelance-approval.com",
      customer_phone: params.customerPhone || "9876543210",
    },
    order_meta: {
      return_url:
        params.returnUrl ||
        `${process.env.CLIENT_URL || "https://freelance-approval.vercel.app"}/dashboard?order_id={order_id}`,
      payment_methods: null,
    },
    order_note: params.orderNote || "Deliverable file upload fee",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data: any = await response.json();

  if (!response.ok) {
    console.error("Cashfree create order error:", data);
    throw new Error(data?.message || "Failed to create order on Cashfree");
  }

  return data as CashfreeOrderResponse;
};

/**
 * Fetch an order's status and details from Cashfree
 */
export const getCashfreeOrder = async (orderId: string): Promise<CashfreeOrderResponse> => {
  const url = `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(orderId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const data: any = await response.json();

  if (!response.ok) {
    console.error("Cashfree get order error:", data);
    throw new Error(data?.message || `Failed to fetch Cashfree order ${orderId}`);
  }

  return data as CashfreeOrderResponse;
};

/**
 * Fetch payments for a specific order
 */
export const getCashfreeOrderPayments = async (orderId: string): Promise<any[]> => {
  const url = `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(orderId)}/payments`;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    return [];
  }

  const data: any = await response.json();
  return Array.isArray(data) ? data : [];
};


export const getCashfreePublicConfig = () => ({
  appId: CASHFREE_APP_ID,
  env: CASHFREE_ENV,
});
