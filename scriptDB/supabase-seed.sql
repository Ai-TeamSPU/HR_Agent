-- HR AI Agent — Seed Data for Supabase (Integer ID Version)
-- Run this script in the Supabase SQL Editor after running supabase-schema.sql

-- 1. Seed Roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'HR_ADMIN', 'HR Administrator with full recruitment access'),
  (2, 'HIRING_MANAGER', 'Hiring Manager for department vacancies'),
  (3, 'INTERVIEWER', 'Technical or cultural interviewer'),
  (4, 'CANDIDATE', 'Job applicant candidate')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Users
INSERT INTO users (id, email, name, name_th, role_id, department) VALUES
  (1, 'somchai.p@company.com', 'Somchai Prasert', 'สมชาย ประเสริฐ', 1, 'Human Resources'),
  (2, 'anong.k@company.com', 'Anong Kittisak', 'อนงค์ กิตติศักดิ์', 2, 'Engineering'),
  (3, 'wichai.t@company.com', 'Wichai Thongdee', 'วิชัย ทองดี', 3, 'Engineering')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Positions
INSERT INTO positions (id, title, title_th, department, department_th, level, report_to, responsibilities, qualifications) VALUES
  (1, 'Senior Full Stack Developer', 'นักพัฒนา Full Stack ระดับอาวุโส', 'Engineering', 'วิศวกรรมซอฟต์แวร์', 'Senior', 'Engineering Director',
   '["Architect and build scalable web applications", "Mentor junior and mid-level developers", "Collaborate with product and design teams"]'::jsonb,
   '["5+ years experience in React/Next.js and Node.js", "Strong TypeScript & PostgreSQL proficiency", "Experience with Cloud Infrastructure (AWS/GCP)"]'::jsonb),
  (2, 'AI/ML Engineer', 'วิศวกรปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง', 'AI & Data', 'ปัญญาประดิษฐ์และข้อมูล', 'Senior', 'Head of AI',
   '["Design and train production machine learning models", "Integrate LLMs and RAG pipelines", "Deploy AI services to high-traffic cloud environment"]'::jsonb,
   '["Strong Python and PyTorch proficiency", "Experience with LangChain, LlamaIndex, Vector DBs", "Master degree in Computer Science or related field preferred"]'::jsonb),
  (3, 'Product Designer (UI/UX)', 'นักออกแบบผลิตภัณฑ์ดิจิทัล', 'Design', 'ออกแบบผลิตภัณฑ์', 'Mid-Level', 'Head of Design',
   '["Create intuitive user journeys and wireframes", "Maintain and evolve the design system", "Conduct user research and usability testing"]'::jsonb,
   '["3+ years experience in Figma", "Strong portfolio demonstrating web & mobile products", "Good communication and presentation skills"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Vacancies
INSERT INTO vacancies (id, position_id, state, priority, headcount, filled, open_date, reason) VALUES
  (1, 1, 'RECRUITING', 'HIGH', 2, 0, '2026-08-01', 'EXPANSION'),
  (2, 2, 'PUBLISHED', 'URGENT', 1, 0, '2026-08-10', 'NEW_POSITION'),
  (3, 3, 'INTERVIEWING', 'MEDIUM', 1, 0, '2026-07-15', 'REPLACEMENT')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Job Descriptions
INSERT INTO job_descriptions (id, vacancy_id, version, job_title, job_title_th, summary, summary_th, responsibilities, requirements, preferred_skills, salary_min, salary_max, salary_currency, generated_by_ai) VALUES
  (1, 1, 1, 'Senior Full Stack Developer', 'นักพัฒนา Full Stack ระดับอาวุโส',
   'Join our core platform engineering team to build world-class enterprise SaaS applications.',
   'ร่วมงานกับทีมวิศวกรรมหลักเพื่อพัฒนาแอปพลิเคชันระดับองค์กรที่รองรับผู้ใช้จำนวนมาก',
   '["Lead full-stack feature development from design to deployment", "Optimize application performance and database queries", "Code reviews and architectural discussions"]'::jsonb,
   '["5+ years of full-stack TypeScript experience", "Deep knowledge of React, Next.js, PostgreSQL", "Proven track record with microservices and Docker"]'::jsonb,
   '["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS", "Docker", "Redis"]'::jsonb,
   90000, 140000, 'THB', true),
  (2, 2, 1, 'AI/ML Engineer', 'วิศวกรปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง',
   'Help us build next-generation AI agents and autonomous reasoning systems.',
   'ร่วมสร้างระบบ AI Agent และระบบการให้เหตุผลอัตโนมัติรุ่นใหม่สำหรับองค์กร',
   '["Develop and fine-tune LLM pipelines", "Build RAG architectures with semantic retrieval", "Implement automated agent workflows"]'::jsonb,
   '["Strong Python proficiency with PyTorch or JAX", "Experience deploying models with FastAPI/Docker", "Solid understanding of Transformers and LLM tooling"]'::jsonb,
   '["Python", "PyTorch", "LangChain", "Vector DB", "Docker", "LLMs"]'::jsonb,
   100000, 160000, 'THB', true),
  (3, 3, 1, 'Product Designer (UI/UX)', 'นักออกแบบผลิตภัณฑ์ดิจิทัล',
   'Craft exceptional experiences for our web and mobile HR platform.',
   'ออกแบบประสบการณ์การใช้งานระดับพรีเมียมสำหรับแพลตฟอร์ม HR ของเรา',
   '["Design responsive UI components and interactive prototypes", "Create user research surveys and usability testing", "Maintain design system consistency in Figma"]'::jsonb,
   '["3+ years designing SaaS or web applications", "Proficiency in Figma and component variants", "Understanding of HTML/CSS constraints"]'::jsonb,
   '["Figma", "UI/UX Design", "Design Systems", "Prototyping", "User Research"]'::jsonb,
   65000, 95000, 'THB', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Candidates
INSERT INTO candidates (id, first_name, last_name, first_name_th, last_name_th, email, phone, current_position, current_company, experience_years, skills, source) VALUES
  (1, 'Thanaporn', 'Kittisak', 'ธนพร', 'กิตติศักดิ์', 'thanaporn.k@email.com', '081-234-5678', 'Senior Frontend Engineer', 'Tech Innovators Co.', 6.5,
   '["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"]'::jsonb, 'CAREER_PORTAL'),
  (2, 'Natapong', 'Siriwong', 'ณัฐพงษ์', 'ศิริวงศ์', 'natapong.s@email.com', '089-876-5432', 'Machine Learning Specialist', 'AI Solutions TH', 4.0,
   '["Python", "PyTorch", "LangChain", "NLP", "FastAPI", "Docker"]'::jsonb, 'LINKEDIN'),
  (3, 'Chutima', 'Wongsuwan', 'ชุติมา', 'วงศ์สุวรรณ', 'chutima.w@email.com', '086-555-1234', 'UI/UX Designer', 'Creative Studio Bangkok', 3.5,
   '["Figma", "User Research", "Design Systems", "Wireframing", "Design Thinking"]'::jsonb, 'CANDIDATE_POOL')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Applications
INSERT INTO applications (id, candidate_id, vacancy_id, state, match_score) VALUES
  (1, 1, 1, 'INTERVIEW_INVITED', 92.5),
  (2, 2, 2, 'AI_SCREENING', 88.0),
  (3, 3, 3, 'HR_REVIEW', 84.0)
ON CONFLICT (id) DO NOTHING;

-- 8. Reset Auto-Increment Sequences to continue from max(id) + 1
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(max(id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('positions', 'id'), COALESCE(max(id), 1)) FROM positions;
SELECT setval(pg_get_serial_sequence('vacancies', 'id'), COALESCE(max(id), 1)) FROM vacancies;
SELECT setval(pg_get_serial_sequence('job_descriptions', 'id'), COALESCE(max(id), 1)) FROM job_descriptions;
SELECT setval(pg_get_serial_sequence('candidates', 'id'), COALESCE(max(id), 1)) FROM candidates;
SELECT setval(pg_get_serial_sequence('applications', 'id'), COALESCE(max(id), 1)) FROM applications;

