const API_BASE = 'https://whitelevel-api.bayazidzaman.workers.dev/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('trackForm');
    const input = document.getElementById('trackPhone');
    const btn = document.getElementById('trackBtn');
    const errorEl = document.getElementById('trackError');
    const resultsContainer = document.getElementById('trackResults');
    const activeList = document.getElementById('activeOrdersList');
    const historyList = document.getElementById('historyOrdersList');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = input.value.replace(/\D/g, '').slice(-11);
        if (phone.length !== 11) {
            showError('Please enter a valid 11-digit phone number.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Searching...';
        errorEl.style.display = 'none';
        resultsContainer.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE}/orders/track?phone=${phone}`);
            const data = await res.json();

            if (res.ok) {
                renderOrders(data.activeOrders, activeList, 'No active orders found.');
                renderOrders(data.historyOrders, historyList, 'No past orders found.');
                resultsContainer.style.display = 'block';
            } else {
                showError(data.error || 'Could not find any orders for this number.');
            }
        } catch (err) {
            showError('Network error. Please try again later.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Track Order';
        }
    });

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }

    function renderOrders(orders, container, emptyMsg) {
        if (!orders || orders.length === 0) {
            container.innerHTML = `<p style="color: var(--text-light);">${emptyMsg}</p>`;
            return;
        }

        container.innerHTML = orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const itemsHtml = order.items.map(item => 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem;">
                    <span>${item.quantity}x ${item.title} ${item.variantName ? `(${item.variantName})` : ''}</span>
                 </div>`
            ).join('');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Order #${order.order_id}</strong>
                            <div style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">${date}</div>
                        </div>
                        <div>
                            <span class="status-badge status-${order.status}">${order.status}</span>
                        </div>
                    </div>
                    <div style="margin-bottom: 1rem; border-bottom: 1px dashed #eee; padding-bottom: 1rem;">
                        ${itemsHtml}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: 600;">
                        <span>Total Paid via ${order.payment_method === 'cod' ? 'COD' : 'Online'}:</span>
                        <span>৳${order.total_amount}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
});
