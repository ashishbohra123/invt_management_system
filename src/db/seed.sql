-- Seed test user for login testing
-- Email: admin@example.com / Password: password123
-- Run: psql -d invt_mgmt -f src/db/seed.sql

INSERT INTO tenants (tenant_id, name, domains, status)
VALUES ('default', 'Default Tenant', '["localhost"]'::jsonb, 'active')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO users (tenant_id, name, email, password, roles, portals, is_active)
SELECT id, 'Admin User', 'admin@example.com',
  '$2a$10$pxLFVjVjGZW6ARnKFutiHOnnjWAbPDRR1s4MnlOr0gRgD1HbHq9AS',
  '["admin"]'::jsonb,
  '["admin", "user"]'::jsonb,
  true
FROM tenants WHERE tenant_id = 'default'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Fix portal access format for existing users (migration from old format)
UPDATE users
SET portals = '["admin", "user"]'::jsonb
WHERE email = 'admin@example.com'
  AND portals::text LIKE '%admin_portal%';
