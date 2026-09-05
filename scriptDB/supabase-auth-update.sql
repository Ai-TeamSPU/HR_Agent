-- =========================================================================
-- HR AI Agent — User Authentication & Accounts Update Script (Fixed Version)
-- คำแนะนำ: คัดลอกสคริปต์นี้ไปวางและกด Run ใน Supabase SQL Editor
-- =========================================================================

-- 1. เพิ่มคอลัมน์ password ในตาราง users (ถ้ายังไม่มี)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '123456';

-- 2. อัปเดตรหัสผ่านเริ่มต้นให้ user เดิมทั้งหมด
UPDATE users SET password = '123456' WHERE password IS NULL;

-- 3. เพิ่ม/อัปเดตบัญชี Wanida Kulrat (HR Manager)
INSERT INTO users (email, password, name, name_th, role_id, department, avatar_url, is_active)
VALUES (
  'wanida.k@company.com', 
  '123456', 
  'Wanida Kulrat', 
  'วนิดา กุลรัตน์', 
  1, 
  'Human Resources', 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Wanida', 
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  name_th = EXCLUDED.name_th,
  role_id = EXCLUDED.role_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  is_active = true;

-- 4. เพิ่ม/อัปเดตบัญชี Somchai Prasert (HR Admin)
INSERT INTO users (email, password, name, name_th, role_id, department, avatar_url, is_active)
VALUES (
  'somchai.p@company.com', 
  '123456', 
  'Somchai Prasert', 
  'สมชาย ประเสริฐ', 
  1, 
  'Human Resources', 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai', 
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  name_th = EXCLUDED.name_th,
  role_id = EXCLUDED.role_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  is_active = true;

-- 5. เพิ่ม/อัปเดตบัญชี Anong Kittisak (Hiring Manager)
INSERT INTO users (email, password, name, name_th, role_id, department, avatar_url, is_active)
VALUES (
  'anong.k@company.com', 
  '123456', 
  'Anong Kittisak', 
  'อนงค์ กิตติศักดิ์', 
  2, 
  'Engineering', 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Anong', 
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  name_th = EXCLUDED.name_th,
  role_id = EXCLUDED.role_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  is_active = true;

-- 6. เพิ่ม/อัปเดตบัญชี Wichai Thongdee (Technical Interviewer)
INSERT INTO users (email, password, name, name_th, role_id, department, avatar_url, is_active)
VALUES (
  'wichai.t@company.com', 
  '123456', 
  'Wichai Thongdee', 
  'วิชัย ทองดี', 
  3, 
  'Engineering', 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Wichai', 
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  name_th = EXCLUDED.name_th,
  role_id = EXCLUDED.role_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  is_active = true;

-- 7. เพิ่ม/อัปเดตบัญชี System Administrator (Super Admin)
INSERT INTO users (email, password, name, name_th, role_id, department, avatar_url, is_active)
VALUES (
  'admin@company.com', 
  'admin123', 
  'System Administrator', 
  'ผู้ดูแลระบบสูงสุด', 
  1, 
  'Management', 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  name_th = EXCLUDED.name_th,
  role_id = EXCLUDED.role_id,
  department = EXCLUDED.department,
  avatar_url = EXCLUDED.avatar_url,
  is_active = true;

-- 8. ตรวจสอบข้อมูลผู้ใช้งานทั้งหมด
SELECT id, email, name_th, department, role_id, password, is_active FROM users ORDER BY id;
