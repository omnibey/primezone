-- ============================================================
-- KOTHBEL E-COMMERCE — Seed Data for Fresh D1 Database
-- ============================================================

-- ─── Default Admin Account ────────────────────────────────────
-- Password: "admin123" (change immediately after first login!)
-- Hash generated with bcrypt (cost 10)
-- You MUST change this password via the admin panel after setup.
INSERT INTO admins (email, password_hash, name) VALUES
  ('admin@kothbel.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Kothbel Admin');

-- ─── Global Counter (starts at 0) ────────────────────────────
INSERT INTO counters (key, count) VALUES ('global', 0);

-- ─── Store Settings ───────────────────────────────────────────
INSERT INTO store_settings (key, value) VALUES
  ('delivery', '{
    "insideFee": 70,
    "outsideFee": 120
  }'),
  ('payment', '{
    "paymentNumber": "01703968638",
    "methods": ["cod", "full"],
    "providers": ["bKash", "Nagad", "Rocket"]
  }'),
  ('whatsapp', '{
    "number": "8801703968638",
    "enabled": true
  }'),
  ('telegram', '{
    "botToken": "",
    "chatId": "",
    "enabled": false
  }'),
  ('tracking', '{
    "gtmId": "",
    "currency": "BDT",
    "enableTracking": true
  }'),
  ('free_delivery', '{
    "enabled": false,
    "minItems": 0,
    "minAmount": 0
  }'),
  ('store_info', '{
    "name": "Kothbel",
    "tagline": "Trusted Online Shop in Bangladesh",
    "logo": "",
    "favicon": ""
  }'),
  ('districts', '{
    "dhaka_zones": ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Narsingdi", "Tangail", "Kishoreganj", "Faridpur", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur"],
    "all_districts": ["Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogra","Brahmanbaria","Chandpur","Chapainawabganj","Chattogram","Chuadanga","Comilla","Coxs Bazar","Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jessore","Jhalokati","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore","Nawabganj","Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon"]
  }');
