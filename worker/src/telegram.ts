// ============================================================
// Server-side Telegram Notifications
// Bot token is never exposed to the client
// ============================================================

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface OrderData {
  order_id: string;
  customer_name: string;
  phone: string;
  address?: string;
  city?: string;
  delivery_area?: string;
  subtotal?: number;
  delivery_fee?: number;
  discount_amount?: number;
  total_amount: number;
  payment_method: string;
  source?: string;
  items: Array<{
    title: string;
    variantName?: string;
    quantity: number;
  }>;
}

export async function sendOrderNotification(config: TelegramConfig, order: OrderData): Promise<boolean> {
  // enabled is optional — if botToken and chatId exist, always try to send
  if (!config.botToken || !config.chatId) {
    console.log('[Telegram] Skipped — botToken or chatId missing');
    return false;
  }

  const itemsList = order.items
    .map(i => `- ${i.title}${i.variantName ? ` (${i.variantName})` : ''} x ${i.quantity}`)
    .join('\n');

  const paymentEmoji = order.payment_method === 'cod' ? '🚚 COD' : '💳 Pay Now (Unpaid)';

  const message = `
📦 *NEW ORDER RECEIVED*
-----------------------------
🆔 Order ID: \`${order.order_id}\`
👤 Customer: ${order.customer_name}
📱 Phone: \`${order.phone}\`
📍 Address: ${order.address || ''}, ${order.city || ''}

🛒 *Items:*
${itemsList}

💰 *Total: ৳${order.total_amount}*
💳 Payment: ${paymentEmoji}
-----------------------------
🚀 Check Admin Panel for details.
  `.trim();

  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Telegram] API error:', err);
      return false;
    }

    console.log('[Telegram] Notification sent for order:', order.order_id);
    return true;
  } catch (error) {
    console.error('[Telegram] Failed:', error);
    return false;
  }
}

export async function sendCustomMessage(config: TelegramConfig, text: string): Promise<boolean> {
  if (!config.enabled || !config.botToken || !config.chatId) return false;

  try {
    await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return true;
  } catch {
    return false;
  }
}
