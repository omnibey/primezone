import { Hono } from 'hono';
import type { Env, Variables } from '../index';

export const paymentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── GATEWAY UTILITIES ───────────────────────────────────────

/**
 * Initialize SSLCOMMERZ Payment Session
 */
export async function initSSLCommerzPayment(
  db: D1Database,
  order: any,
  config: { store_id: string; store_password: string; is_live: boolean },
  origin: string
): Promise<string | null> {
  if (!config || !config.store_id || !config.store_password) return null;

  const baseUrl = config.is_live 
    ? 'https://securepay.sslcommerz.com' 
    : 'https://sandbox.sslcommerz.com';
    
  const initUrl = `${baseUrl}/gwprocess/v4/api.php`;

  const formData = new URLSearchParams();
  formData.append('store_id', config.store_id);
  formData.append('store_passwd', config.store_password);
  formData.append('total_amount', order.total_amount.toString());
  formData.append('currency', 'BDT');
  formData.append('tran_id', order.order_id);
  
  formData.append('success_url', `${origin}/api/v1/payments/success/sslcommerz`);
  formData.append('fail_url', `${origin}/api/v1/payments/fail/sslcommerz`);
  formData.append('cancel_url', `${origin}/api/v1/payments/fail/sslcommerz`);
  formData.append('ipn_url', `${origin}/api/v1/payments/webhook/sslcommerz`);
  
  formData.append('cus_name', order.customer_name);
  formData.append('cus_email', order.email || 'customer@example.com');
  formData.append('cus_add1', order.address || 'Dhaka');
  formData.append('cus_city', order.city || 'Dhaka');
  formData.append('cus_postcode', '1000');
  formData.append('cus_country', 'Bangladesh');
  formData.append('cus_phone', order.phone);
  
  formData.append('shipping_method', 'YES');
  formData.append('product_name', 'Order ' + order.order_id);
  formData.append('product_category', 'E-commerce');
  formData.append('product_profile', 'general');

  try {
    const res = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    const data: any = await res.json();
    if (data.status === 'SUCCESS' && data.GatewayPageURL) {
      return data.GatewayPageURL;
    }
    console.error('[SSLCOMMERZ Init Error]:', data);
    return null;
  } catch (err) {
    console.error('[SSLCOMMERZ Network Error]:', err);
    return null;
  }
}

/**
 * Initialize aamarPay Payment Session
 */
export async function initAamarPayPayment(
  db: D1Database,
  order: any,
  config: { store_id: string; signature_key: string; is_live: boolean },
  origin: string
): Promise<string | null> {
  if (!config || !config.store_id || !config.signature_key) return null;

  const baseUrl = config.is_live 
    ? 'https://secure.aamarpay.com' 
    : 'https://sandbox.aamarpay.com';
    
  const initUrl = `${baseUrl}/jsonpost.php`;

  const payload = {
    store_id: config.store_id,
    signature_key: config.signature_key,
    tran_id: order.order_id,
    success_url: `${origin}/api/v1/payments/success/aamarpay`,
    fail_url: `${origin}/api/v1/payments/fail/aamarpay`,
    cancel_url: `${origin}/api/v1/payments/fail/aamarpay`,
    amount: order.total_amount.toString(),
    currency: "BDT",
    desc: "Order " + order.order_id,
    cus_name: order.customer_name,
    cus_email: order.email || "customer@example.com",
    cus_add1: order.address || "Dhaka",
    cus_city: order.city || "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: order.phone,
    type: "json"
  };

  try {
    const res = await fetch(initUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data: any = await res.json();
    if (data.result === 'true' && data.payment_url) {
      return data.payment_url;
    }
    console.error('[aamarPay Init Error]:', data);
    return null;
  } catch (err) {
    console.error('[aamarPay Network Error]:', err);
    return null;
  }
}


/**
 * Initialize bKash Payment (Tokenized Checkout)
 */
export async function initBkashPayment(
  db: D1Database,
  order: any,
  config: { app_key: string; app_secret: string; username: string; password: string; is_live: boolean },
  origin: string
): Promise<string | null> {
  if (!config || !config.app_key || !config.app_secret || !config.username || !config.password) return null;

  const baseUrl = config.is_live 
    ? 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout' 
    : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout';

  try {
    // 1. Grant Token
    const tokenRes = await fetch(`${baseUrl}/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'password': config.password,
        'username': config.username
      },
      body: JSON.stringify({ app_key: config.app_key, app_secret: config.app_secret })
    });
    
    const tokenData: any = await tokenRes.json();
    if (!tokenData.id_token) {
      console.error('[bKash Token Error]:', tokenData);
      return null;
    }
    
    // 2. Create Payment
    const createRes = await fetch(`${baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': tokenData.id_token,
        'X-APP-Key': config.app_key
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: order.phone,
        callbackURL: `${origin}/api/v1/payments/execute/bkash`,
        amount: order.total_amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: order.order_id
      })
    });

    const createData: any = await createRes.json();
    if (createData.bkashURL && createData.paymentID) {
      // Store paymentID temporarily so we can execute it later
      await db.prepare('UPDATE orders SET payment_provider = ? WHERE order_id = ?').bind(createData.paymentID, order.order_id).run();
      return createData.bkashURL;
    }
    
    console.error('[bKash Create Error]:', createData);
    return null;
  } catch (err) {
    console.error('[bKash Network Error]:', err);
    return null;
  }
}

/**
 * Initialize Nagad Payment (Mocked for basic RSA constraints in Worker)
 */
export async function initNagadPayment(
  db: D1Database,
  order: any,
  config: { merchant_id: string; is_live: boolean },
  origin: string
): Promise<string | null> {
  // In a real-world scenario, you would implement Nagad's RSA encryption logic here.
  // Due to Cloudflare Worker restrictions on the native 'crypto' module, 
  // Nagad API usually requires a dedicated microservice or WebCrypto workaround.
// For now, this serves as a placeholder to redirect to Nagad.
  console.log('[Nagad Init Placeholder called]');
  return null;
}

/**
 * Initialize EPS Payment (Mock)
 */
export async function initEpsPayment(
  db: D1Database,
  order: any,
  config: { store_id: string; signature_key: string; is_live: boolean },
  origin: string
): Promise<string | null> {
  console.log('[EPS Init Placeholder called]', order.order_id);
  // Real implementation requires standard API call to EPS payment gateway.
  // Returning null falls back to the success redirect in the UI/orders logic 
  // or a failed-payment redirect. Let's mock a success URL for testing if we wanted,
  // but for now we follow the same pattern as Nagad.
  return null;
}

/**
 * Initialize Stripe Payment (Mock)
 */
export async function initStripePayment(
  db: D1Database,
  order: any,
  config: { public_key: string; secret_key: string; is_live: boolean },
  origin: string,
  usdRate: number
): Promise<string | null> {
  console.log('[Stripe Init Placeholder called]', order.order_id);
  // Real implementation requires interacting with Stripe's API (e.g. Stripe Checkout Sessions).
  // Requires converting BDT to USD based on usdRate.
  return null;
}

/**
 * Initialize PayPal Payment (Mock)
 */
export async function initPaypalPayment(
  db: D1Database,
  order: any,
  config: { client_id: string; secret: string; is_live: boolean },
  origin: string,
  usdRate: number
): Promise<string | null> {
  console.log('[PayPal Init Placeholder called]', order.order_id);
  // Real implementation requires interacting with PayPal Orders API.
  // Requires converting BDT to USD based on usdRate.
  return null;
}

// ─── SUCCESS / FAIL REDIRECTS ─────────────────────────────────

// Customers are redirected here from Gateway via POST or GET
const handleReturn = (c: any, isSuccess: boolean) => {
  // Gateways often send tran_id or tran_id as POST param or GET query
  let tranId = '';
  // We don't strictly need to read it here because the IPN does the validation.
  // We just redirect the user to the frontend.
  const frontendUrl = c.env.STORE_FRONTEND_URL || c.req.url.split('/api/v1')[0];
  
  if (isSuccess) {
    // If we want to extract order_id for the thank-you page:
    // SSL sends tran_id via POST. AamarPay sends via POST/GET.
    return c.html(`
      <html><body>
        <script>
          // Note: In a real app we'd extract the tran_id to redirect to /thank-you?order_id=...
          window.location.href = "${frontendUrl}/thank-you";
        </script>
      </body></html>
    `);
  } else {
    return c.html(`
      <html><body>
        <script>
          window.location.href = "${frontendUrl}/failed-payment";
        </script>
      </body></html>
    `);
  }
};

paymentRoutes.all('/success/:gateway', async (c) => handleReturn(c, true));
paymentRoutes.all('/fail/:gateway', async (c) => handleReturn(c, false));


// ─── WEBHOOKS (IPN) ───────────────────────────────────────────

paymentRoutes.post('/webhook/sslcommerz', async (c) => {
  // Parse form data from SSLCOMMERZ
  const body = await c.req.parseBody();
  const tran_id = body.tran_id as string;
  const status = body.status as string; // VALID, FAILED, CANCELLED
  const val_id = body.val_id as string;

  if (!tran_id || status !== 'VALID') {
    return c.text('Invalid status or missing tran_id', 400);
  }

  // Fetch SSL config to validate
  const settingRow = await c.env.DB.prepare("SELECT value FROM store_settings WHERE key = 'payments'").first<{ value: string }>();
  if (!settingRow) return c.text('Store config not found', 500);
  
  const paymentsConfig = JSON.parse(settingRow.value);
  const sslConfig = paymentsConfig.sslcommerz;
  
  if (!sslConfig || !sslConfig.store_id || !sslConfig.store_password) {
    return c.text('SSLCOMMERZ not configured', 500);
  }

  // 1. Validate the transaction using val_id (Server to Server check)
  const baseUrl = sslConfig.is_live 
    ? 'https://securepay.sslcommerz.com' 
    : 'https://sandbox.sslcommerz.com';
    
  const valUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${sslConfig.store_id}&store_passwd=${encodeURIComponent(sslConfig.store_password)}&v=1&format=json`;

  try {
    const valRes = await fetch(valUrl);
    const valData: any = await valRes.json();
    
    if (valData.status === 'VALID' || valData.status === 'VALIDATED') {
      // Payment is successfully validated
      // Update order in DB
      await c.env.DB.prepare(`
        UPDATE orders 
        SET payment_status = 'Verified', status = 'Processing' 
        WHERE order_id = ? AND payment_status = 'Pending'
      `).bind(tran_id).run();
      
      return c.text('IPN Handled Successfully');
    } else {
      console.error('[SSLCOMMERZ Validation Failed]:', valData);
      return c.text('Validation Failed', 400);
    }
  } catch (e) {
    console.error('[SSL IPN Check Error]', e);
    return c.text('Server Error', 500);
  }
});

paymentRoutes.post('/webhook/aamarpay', async (c) => {
  const body = await c.req.parseBody();
  const tran_id = body.opt_a as string || body.tran_id as string; // aamarpay usually passes tran_id in opt_a or directly
  const pay_status = body.pay_status as string; // Successful
  
  if (!tran_id || pay_status !== 'Successful') {
    return c.text('Invalid status or missing tran_id', 400);
  }

  // Ideally, AamarPay provides a Search Transaction API for secure server-to-server validation.
  // For standard IPN, we update based on this callback.
  // Real-world production should call the Verification API using signature_key.

  await c.env.DB.prepare(`
    UPDATE orders 
    SET payment_status = 'Verified', status = 'Processing' 
    WHERE order_id = ? AND payment_status = 'Pending'
  `).bind(tran_id).run();

  return c.text('IPN Handled Successfully');
});


// ─── DIRECT API CALLBACKS ─────────────────────────────────────

paymentRoutes.get('/execute/bkash', async (c) => {
  const paymentID = c.req.query('paymentID');
  const status = c.req.query('status');
  const frontendUrl = c.env.STORE_FRONTEND_URL || c.req.url.split('/api/v1')[0];

  if (!paymentID || status !== 'success') {
    return c.html(`<html><body><script>window.location.href = "${frontendUrl}/failed-payment";</script></body></html>`);
  }

  try {
    // 1. Get the order to find merchantInvoiceNumber (order_id)
    const orderRecord = await c.env.DB.prepare('SELECT order_id FROM orders WHERE payment_provider = ? AND payment_status = "Pending"').bind(paymentID).first<{ order_id: string }>();
    
    if (!orderRecord) {
      return c.html(`<html><body><script>window.location.href = "${frontendUrl}/failed-payment?reason=order_not_found";</script></body></html>`);
    }

    // 2. Fetch bkash config
    const settingRow = await c.env.DB.prepare("SELECT value FROM store_settings WHERE key = 'payments'").first<{ value: string }>();
    if (!settingRow) return c.html('Store config error');
    
    const paymentsConfig = JSON.parse(settingRow.value);
    const bkashConfig = paymentsConfig.bkash_api;
    
    if (!bkashConfig || !bkashConfig.app_key || !bkashConfig.app_secret || !bkashConfig.username || !bkashConfig.password) {
      return c.html('bKash not configured');
    }

    const baseUrl = bkashConfig.is_live 
      ? 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout' 
      : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout';

    // 3. Grant Token Again (Tokens expire quickly)
    const tokenRes = await fetch(`${baseUrl}/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'password': bkashConfig.password,
        'username': bkashConfig.username
      },
      body: JSON.stringify({ app_key: bkashConfig.app_key, app_secret: bkashConfig.app_secret })
    });
    
    const tokenData: any = await tokenRes.json();
    if (!tokenData.id_token) {
      return c.html(`<html><body><script>window.location.href = "${frontendUrl}/failed-payment";</script></body></html>`);
    }

    // 4. Execute Payment
    const execRes = await fetch(`${baseUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': tokenData.id_token,
        'X-APP-Key': bkashConfig.app_key
      },
      body: JSON.stringify({ paymentID })
    });

    const execData: any = await execRes.json();
    
    if (execData.statusCode === '0000' && execData.transactionStatus === 'Completed') {
       // Payment successful
       await c.env.DB.prepare(`
        UPDATE orders 
        SET payment_status = 'Verified', status = 'Processing' 
        WHERE order_id = ?
      `).bind(orderRecord.order_id).run();
      
      return c.html(`<html><body><script>window.location.href = "${frontendUrl}/thank-you?order_id=${orderRecord.order_id}";</script></body></html>`);
    } else {
      console.error('[bKash Execute Error]:', execData);
      return c.html(`<html><body><script>window.location.href = "${frontendUrl}/failed-payment";</script></body></html>`);
    }
  } catch (err) {
    console.error('[bKash Execute Catch Error]:', err);
    return c.html(`<html><body><script>window.location.href = "${frontendUrl}/failed-payment";</script></body></html>`);
  }
});

paymentRoutes.get('/execute/nagad', async (c) => {
  // Nagad Mock Callback Endpoint
  const frontendUrl = c.env.STORE_FRONTEND_URL || c.req.url.split('/api/v1')[0];
  const order_id = c.req.query('order_id') || '';
  
  // As mentioned, a real implementation requires parsing Nagad's callback response (which is base64 + JSON).
  // This is a placeholder that assumes fail if no order_id is present.
  if (order_id) {
    return c.html(`<html><body><script>window.location.href = "${frontendUrl}/thank-you?order_id=${order_id}";</script></body></html>`);
  } else {
    return c.html(`<html><body><script>window.location.href = "${frontendUrl}/failed-payment";</script></body></html>`);
  }
});
