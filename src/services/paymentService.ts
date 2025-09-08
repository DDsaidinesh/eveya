/**
 * Payment service for handling backend API calls and PhonePe integration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export interface CreateOrderRequest {
  user_id: string;
  machine_id: string;
  machine_code: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    slot_number?: string;
  }>;
  redirect_url: string;
  expire_after?: number;
  meta_info?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  };
}

export interface PaymentResponse {
  order_id: string;
  merchant_order_id: string;
  phonepe_order_id?: string;
  amount: number;
  status: string;
  redirect_url?: string;
  expires_at?: string;
  dispensing_code?: string;
}

export interface PaymentStatusResponse {
  order_id: string;
  merchant_order_id: string;
  phonepe_order_id?: string;
  phonepe_transaction_id?: string;
  status: string;
  amount: number;
  payment_method?: string;
  paid_at?: string;
  utr?: string;
  error_message?: string;
}

/**
 * Create a payment order and get PhonePe redirect URL
 */
export async function createPaymentOrder(
  orderRequest: CreateOrderRequest,
  authToken: string
): Promise<PaymentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/payments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(orderRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment order');
  }

  return response.json();
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  merchantOrderId: string,
  authToken: string
): Promise<PaymentStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/payments/status/${merchantOrderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check payment status');
  }

  return response.json();
}

/**
 * Get order details
 */
export async function getOrderDetails(
  orderId: string,
  authToken: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get order details');
  }

  return response.json();
}

/**
 * PhonePe PayPage integration utilities
 */
export class PhonePeCheckout {
  /**
   * Open PhonePe PayPage in iframe mode
   */
  static openPayPage(tokenUrl: string, callback: (response: string) => void): void {
    if (typeof window !== 'undefined' && (window as any).PhonePeCheckout) {
      (window as any).PhonePeCheckout.transact({
        tokenUrl,
        callback,
        type: 'IFRAME'
      });
    } else {
      throw new Error('PhonePe Checkout script not loaded');
    }
  }

  /**
   * Open PhonePe PayPage in redirect mode
   */
  static openPayPageRedirect(tokenUrl: string): void {
    if (typeof window !== 'undefined' && (window as any).PhonePeCheckout) {
      (window as any).PhonePeCheckout.transact({ tokenUrl });
    } else {
      throw new Error('PhonePe Checkout script not loaded');
    }
  }

  /**
   * Close PayPage iframe manually (use only in exceptional cases)
   */
  static closePayPage(): void {
    if (typeof window !== 'undefined' && (window as any).PhonePeCheckout) {
      (window as any).PhonePeCheckout.closePage();
    }
  }

  /**
   * Check if PhonePe Checkout is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).PhonePeCheckout;
  }
}

