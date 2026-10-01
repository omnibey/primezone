ALTER TABLE admins ADD COLUMN permissions TEXT NOT NULL DEFAULT '["super_admin"]';

CREATE TABLE order_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT    NOT NULL,
  admin_name    TEXT    NOT NULL,
  action        TEXT    NOT NULL, -- 'created', 'status_updated', 'details_updated', 'note_added'
  changes       TEXT    DEFAULT NULL, -- JSON object describing changes
  note          TEXT    DEFAULT NULL, -- Custom note text
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_logs_order ON order_logs(order_id);
