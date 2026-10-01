const API_BASE = 'https://whitelevel-api.bayazidzaman.workers.dev/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching
    const tabSettings = document.getElementById('tabSettings');
    const tabOrders = document.getElementById('tabOrders');
    const sectionSettings = document.getElementById('sectionSettings');
    const sectionOrders = document.getElementById('sectionOrders');
    
    if(tabSettings && tabOrders) {
        tabSettings.addEventListener('click', (e) => {
            e.preventDefault();
            tabSettings.classList.add('active');
            tabOrders.classList.remove('active');
            sectionSettings.style.display = 'block';
            sectionOrders.style.display = 'none';
        });
        
        tabOrders.addEventListener('click', (e) => {
            e.preventDefault();
            tabOrders.classList.add('active');
            tabSettings.classList.remove('active');
            sectionSettings.style.display = 'none';
            sectionOrders.style.display = 'block';
            loadOrders();
        });
    }

    // 2. Load Profile Data
    const profileForm = document.getElementById('profileForm');
    const profName = document.getElementById('profName');
    const profPhone = document.getElementById('profPhone');
    const profCity = document.getElementById('profCity');
    const profAddress = document.getElementById('profAddress');
    
    const savedData = JSON.parse(localStorage.getItem('kothbel_profile') || '{}');
    if (savedData.name) profName.value = savedData.name;
    if (savedData.phone) profPhone.value = savedData.phone;
    if (savedData.city) profCity.value = savedData.city;
    if (savedData.address) profAddress.value = savedData.address;
    
    // 3. Save Profile Data
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: profName.value.trim(),
                phone: profPhone.value.trim(),
                city: profCity.value,
                address: profAddress.value.trim()
            };
            localStorage.setItem('kothbel_profile', JSON.stringify(data));
            
            const msg = document.getElementById('profileMsg');
            msg.style.color = '#10B981';
            msg.textContent = 'Profile saved successfully! This will auto-fill your checkout.';
            setTimeout(() => { msg.textContent = ''; }, 3000);
        });
    }
});

// 4. Fetch Order History
async function loadOrders() {
    const list = document.getElementById('ordersList');
    const msg = document.getElementById('orderStatusMsg');
    const savedData = JSON.parse(localStorage.getItem('kothbel_profile') || '{}');
    
    if (!savedData.phone) {
        msg.innerHTML = '<span style="color:#EF4444;">Please save your phone number in Profile Settings first to view order history.</span>';
        list.innerHTML = '';
        return;
    }
    
    msg.textContent = `Fetching orders for phone number: ${savedData.phone}`;
    list.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="ph-bold ph-spinner ph-spin" style="font-size:2rem; color:var(--primary-color);"></i></div>';
    
    try {
        const res = await fetch(`${API_BASE}/orders/track?phone=${encodeURIComponent(savedData.phone)}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
            const orders = data.data.orders;
            if (!orders || orders.length === 0) {
                msg.textContent = '';
                list.innerHTML = '<div style="text-align:center; padding:2rem; background:#F9FAFB; border-radius:8px;">No orders found for this phone number.</div>';
                return;
            }
            
            msg.textContent = '';
            list.innerHTML = orders.map(o => `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div style="font-size:1.1rem; font-weight:700; color:#111827;">${o.order_id}</div>
                            <div style="font-size:0.85rem; color:#6B7280; margin-top:0.25rem;">Placed on ${new Date(o.created_at).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <span class="status-badge status-${o.status}">${o.status}</span>
                        </div>
                    </div>
                    <div style="margin-bottom:1rem;">
                        ${o.items.map(i => `
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem;">
                                <div>${i.quantity}x ${i.title} ${i.variantName ? `(${i.variantName})` : ''}</div>
                                <div style="font-weight:600;">৳${i.price * i.quantity}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display:flex; justify-content:space-between; border-top:1px solid #eee; padding-top:1rem; font-size:1.1rem; font-weight:700;">
                        <div>Total</div>
                        <div style="color:var(--primary-color);">৳${o.total_amount}</div>
                    </div>
                </div>
            `).join('');
            
        } else {
            msg.textContent = '';
            list.innerHTML = `<div style="text-align:center; padding:2rem; color:#EF4444;">${data.message || 'Could not fetch orders'}</div>`;
        }
    } catch(err) {
        msg.textContent = '';
        list.innerHTML = `<div style="text-align:center; padding:2rem; color:#EF4444;">Error connecting to the server.</div>`;
    }
}
