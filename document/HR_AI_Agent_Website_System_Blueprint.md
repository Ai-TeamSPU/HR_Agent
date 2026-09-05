# HR AI Agent Workflow → Website System Blueprint

## 1. ความเข้าใจ Workflow ปัจจุบัน

จาก Workflow ที่ให้มา กระบวนการหลักแบ่งเป็น 4 Swimlane ได้แก่

- AI Agent
- HR (Human Resource)
- Automation
- Candidate

ภาพรวมของกระบวนการคือ

```text
ตำแหน่งว่าง / มีผู้ลาออก
        ↓
HR เปิด Vacancy
        ↓
AI ดึงข้อมูล Position เดิม
+ หน้าที่
+ Qualification
+ JD เดิม
        ↓
AI สร้าง/ปรับ Job Description
        ↓
HR ตรวจสอบ
   ├─ ไม่ผ่าน → แก้ไข → AI/HR ปรับ JD
   └─ ผ่าน
        ↓
Automation เปิดรับสมัคร
+ Email
+ Career Portal
+ Candidate Database
        ↓
Candidate สมัคร / AI ค้นจาก Candidate Pool
        ↓
AI วิเคราะห์ Resume
        ↓
HR Review
        ↓
นัดสัมภาษณ์
        ↓
Candidate Confirm
        ↓
DL Test
        ↓
Interview + ผล DL
        ↓
HR ตัดสินใจ
   ├─ Reject
   └─ Pass
        ↓
กำหนดวันเริ่มงาน
        ↓
สร้างข้อมูล Employee / Onboarding
```

แนวคิดหลักที่แนะนำคือ

> Workflow Engine เป็นตัวควบคุมกระบวนการ  
> AI Agent เป็นตัววิเคราะห์  
> Automation เป็นตัวลงมือทำงานซ้ำ ๆ  
> Human เป็นผู้ตัดสินใจในจุดสำคัญ

---

## 2. Architecture ที่แนะนำ

```text
┌─────────────────────────────────────────────┐
│                HR WEB APPLICATION           │
│ HR / Hiring Manager / Admin / Candidate     │
└───────────────────┬─────────────────────────┘
                    │
              API / Server Action
                    │
┌───────────────────▼─────────────────────────┐
│              WORKFLOW ENGINE                │
│ Vacancy / Candidate / Interview / DL / Hire │
│ State Machine + Business Rules              │
└──────────────┬─────────────────┬────────────┘
               │                 │
       ┌───────▼───────┐ ┌──────▼─────────┐
       │   AI AGENT    │ │   AUTOMATION   │
       │ JD            │ │ Email          │
       │ Matching      │ │ Calendar       │
       │ Screening     │ │ Notification   │
       │ Analysis      │ │ DL Test        │
       └───────┬───────┘ └──────┬─────────┘
               │                 │
          ┌────▼─────────────────▼────┐
          │        DATABASE           │
          │ PostgreSQL / Supabase     │
          │ Candidate / Position / HR │
          └───────────────────────────┘
```

ระบบไม่ควรเป็น “AI ทำทุกอย่าง” แต่ควรเป็น **HR Workflow System ที่มี AI Agent เป็น Intelligence Layer**

---

## 3. Tech Stack ที่แนะนำ

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

ใช้สำหรับ

- HR Dashboard
- Hiring Manager Portal
- Candidate Portal
- Admin
- Recruitment Pipeline
- Candidate Profile
- Interview
- DL Test Result
- AI Agent Console

### Backend + Database

แนะนำใช้ **Supabase**

องค์ประกอบหลัก

```text
PostgreSQL
Supabase Auth
Row Level Security
Storage
Realtime
Edge Functions
pgvector
```

### AI Layer

ไม่ควรให้ Frontend เรียก LLM โดยตรง

```text
Frontend
   ↓
Backend API
   ↓
AI Orchestrator
   ↓
LLM
   ↓
Structured JSON
   ↓
Rule Engine
   ↓
Database
```

### AI Service

ระยะแรก

```text
Next.js Server
+
Supabase Edge Functions
```

เมื่อระบบ AI ซับซ้อนขึ้นสามารถเพิ่ม

```text
Python
FastAPI
```

เพื่อทำ

- Resume Parsing
- Document Analysis
- Ranking
- Embedding
- RAG
- Agent Orchestration

---

## 4. Database หลัก

อย่างน้อยควรมีตาราง

```text
users
roles

employees
resignations

positions
position_requirements

vacancies
job_descriptions

candidates
candidate_documents
applications

interviews
interview_feedback

dl_tests
dl_test_results

offers
hires

notifications

ai_runs
ai_recommendations

workflow_events
audit_logs
```

### Candidate กับ Application ต้องแยกกัน

ตัวอย่าง

```text
Candidate
นาย A
```

สามารถมีหลาย Application

```text
Application #001 → Marketing
Application #017 → Digital Marketing
Application #028 → CRM
```

ดังนั้น Candidate ไม่ควรถูกออกแบบให้เท่ากับการสมัครงานหนึ่งครั้ง

---

## 5. State Machine

### Vacancy State

```text
DRAFT
↓
JD_GENERATING
↓
WAITING_HR_APPROVAL
↓
APPROVED
↓
PUBLISHED
↓
RECRUITING
↓
INTERVIEWING
↓
OFFERING
↓
FILLED
↓
CLOSED
```

### Candidate Application State

```text
APPLIED
↓
AI_SCREENING
↓
HR_REVIEW
↓
SHORTLISTED
↓
INTERVIEW_INVITED
↓
INTERVIEW_CONFIRMED
↓
DL_TEST_ASSIGNED
↓
DL_TEST_COMPLETED
↓
INTERVIEWED
↓
DECISION_PENDING
   ↓              ↓
REJECTED        OFFERED
                  ↓
               ACCEPTED
                  ↓
                HIRED
```

State Machine จะทำให้ระบบควบคุม Flow ได้ชัดเจนและลดการเกิดสถานะผิดลำดับ

---

## 6. Business Functions ที่ควรมี

```typescript
createVacancy()

getPositionProfile()

generateJobDescription()

submitJDForApproval()

approveJobDescription()

publishJob()

searchCandidatePool()

createApplication()

parseResume()

screenCandidate()

shortlistCandidate()

inviteInterview()

confirmInterview()

assignDLTest()

getDLTestResult()

evaluateCandidate()

createHiringRecommendation()

sendCandidateResult()

createOffer()

acceptOffer()

createEmployee()

startOnboarding()
```

แต่ละ Function ไม่ควรทำงานหลายขั้นตอนเกินไป

ตัวอย่างที่ไม่แนะนำ

```text
approveJobDescription()
→ Post Job
→ Email
→ Search Candidate
→ AI Rank
→ Send Invitation
```

ควรใช้ Event

```text
JOB_DESCRIPTION_APPROVED
```

จากนั้นระบบที่เกี่ยวข้องค่อยรับ Event ไปทำงานต่อ

```text
JOB_DESCRIPTION_APPROVED
      │
      ├─ JobPublisher
      ├─ CandidateMatcher
      ├─ NotificationService
      └─ AuditLogger
```

---

## 7. Event-driven Logic

ตัวอย่างเมื่อ HR กด Approve JD

```text
HR
 ↓
approveJobDescription()
 ↓
vacancy.status = APPROVED
 ↓
สร้าง Event

JOB_DESCRIPTION_APPROVED
```

Automation

```text
JOB_DESCRIPTION_APPROVED
        ↓
publishJob()
        ↓
sendRecruitmentEmail()
```

AI Agent

```text
JOB_DESCRIPTION_APPROVED
        ↓
searchCandidatePool()
        ↓
candidateMatching()
        ↓
เสนอ Candidate ให้ HR
```

แนวทางนี้ช่วยให้ระบบขยายได้ง่ายและลดการผูก Function เข้าด้วยกันมากเกินไป

---

## 8. AI Agent ที่ควรมี

### 8.1 Position & JD Agent

Input

```text
Position
Department
Existing JD
Responsibilities
Qualification
Historical JD
```

Output ควรเป็น Structured JSON

```json
{
  "job_title": "...",
  "responsibilities": [],
  "requirements": [],
  "preferred_skills": [],
  "education": [],
  "experience": []
}
```

จากนั้นต้องผ่าน **HR Approval** ก่อน Publish

---

### 8.2 Candidate Matching Agent

Input

```text
Job Requirement
+
Candidate Profile
+
Resume
```

Output ไม่ควรมีเพียง Match Score

```json
{
  "match_score": 82,
  "required_criteria": {
    "education": "match",
    "experience": "match",
    "english": "partial",
    "digital_skill": "unknown"
  },
  "strengths": [],
  "gaps": [],
  "evidence": [],
  "confidence": 0.88
}
```

---

## 9. หลักการ Scoring ที่แนะนำ

ไม่ควรให้ LLM เป็นผู้คำนวณคะแนนทั้งหมด

ควรใช้

```text
AI
↓
Extract Evidence
↓
Rule Engine
↓
Calculate Score
```

ตัวอย่าง Resume ระบุ

```text
Digital Marketing Manager 5 years
```

AI แปลงเป็น

```json
{
  "digital_marketing_experience_years": 5
}
```

Rule Engine

```typescript
if (experience >= 5) {
    experienceScore = 20;
}
```

ข้อดีคือสามารถอธิบายได้ว่าคะแนนมาจากเกณฑ์ใด ไม่ใช่เพียงเพราะ AI ให้คะแนน

---

## 10. การเชื่อม DL Test

```text
Candidate
↓
DL Test
↓
DL System
↓
API
↓
HR System
```

ข้อมูลที่ควรรับกลับ

```text
candidate_id
application_id
test_id

knowledge_score
practical_score
ai_literacy_score

total_score

completed_at
result_status
```

AI สามารถช่วย

- วิเคราะห์จุดแข็ง
- วิเคราะห์จุดอ่อน
- สรุปผล
- เปรียบเทียบกับ Position

แต่คะแนนหลักควรมาจาก **DL Scoring Engine**

---

## 11. Candidate Evaluation

```text
Candidate Profile
        +
Resume Match
        +
DL Result
        +
Interview Score
        ↓
Recruitment Agent
        ↓
Candidate Decision Brief
```

ตัวอย่าง

```text
Overall Fit: 84%

Job Match       88%
Experience      90%
DL              76%
Interview       82%

Strength
• Experience ตรงสาย 6 ปี
• มี CRM + Analytics

Gap
• DL Practical ต่ำกว่า Benchmark
• ไม่มีประสบการณ์ Higher Education

AI Recommendation
SHORTLIST

Human Decision
[Shortlist]
[Hold]
[Reject]
```

หลักการคือ **AI = Decision Support**  
ส่วน **HR = Decision Owner**

---

## 12. การแบ่งงาน AI / Human / Automation

### AI เป็นหลัก

- Draft JD
- Resume Parsing
- Candidate Matching
- Candidate Ranking
- Candidate Summary
- DL Result Analysis
- Recruitment Recommendation

### AI + Human

- Job Description
- Candidate Shortlist
- Candidate Evaluation
- Interview Summary
- Hiring Recommendation

### Human เป็นหลัก

- Approve Position
- Approve JD
- Interview
- Final Hiring Decision
- Salary / Offer
- Start Date

### Automation 100%

- Email
- Notification
- Status Update
- Interview Reminder
- Test Invitation
- Calendar
- Candidate Acknowledgment
- Workflow Trigger

---

## 13. Security & Permission

ระบบ HR ต้องออกแบบสิทธิ์ตั้งแต่ Database

```text
HR Admin
→ เห็น Candidate ทั้งหมด

Hiring Manager
→ เห็นเฉพาะ Candidate ของตำแหน่งที่รับผิดชอบ

Interview Panel
→ เห็นเฉพาะข้อมูลที่ใช้ในการสัมภาษณ์

Candidate
→ เห็นเฉพาะข้อมูลของตัวเอง

AI Agent
→ อ่านเฉพาะข้อมูลที่ Function อนุญาต
```

ต้องมี Audit Log

```text
10:21 HR01 viewed candidate
10:24 AI_AGENT screened candidate
10:25 AI_AGENT recommended shortlist
10:31 HR01 approved shortlist
```

และควรเก็บ Version ของ

```text
AI Model
Prompt
Rubric
JD
Candidate Score
```

---

## 14. หน้า Website ที่ควรมี

### HR / Admin

```text
/Login

/HR Dashboard

/Vacancies
/Vacancies/:id

/Positions
/Job Descriptions

/Candidates
/Candidates/:id

/Applications
/Applications/:id

/Interviews

/DL Test Results

/Offers

/AI Agent
   ├ Candidate Matching
   ├ JD Agent
   └ Recruitment Recommendation

/Admin
   ├ Users
   ├ Roles
   ├ AI Policy
   ├ Scoring Rules
   └ Audit Logs
```

### Candidate Portal

```text
/jobs
/jobs/:id

/apply

/candidate/application

/candidate/interview

/candidate/dl-test

/candidate/result
```

---

## 15. Tech Stack สรุป

```text
Frontend
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui

Backend
Next.js API / Server Actions
Supabase Edge Functions

Database
Supabase PostgreSQL

Authentication
Supabase Auth

Authorization
PostgreSQL RLS

File Storage
Supabase Storage

AI
LLM API
Structured Output
Tool Calling
Embeddings

Vector Database
pgvector / Supabase

Advanced AI Service
Python + FastAPI

Automation
Event-driven Worker
Scheduled Job / Queue

Email
Transactional Email API

Calendar
Google Calendar API

Monitoring
Application Logs
AI Logs
Audit Logs

Deployment
Vercel
Supabase
Cloud Service สำหรับ AI Worker
```

---

## 16. Target Architecture

```text
                    HR AI AGENT
                         │
                 ┌───────▼───────┐
                 │ AI Orchestrator│
                 └───────┬───────┘
                         │
      ┌──────────────────┼───────────────────┐
      │                  │                   │
 JD Agent         Candidate Agent      Analysis Agent
      │                  │                   │
      └──────────────────┼───────────────────┘
                         │
                  Workflow Engine
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      Recruitment      DL Test       Onboarding
          │              │              │
          └──────────────┼──────────────┘
                         │
                     Supabase
```

---

## 17. แนวทางก่อนเริ่มเขียน Code

ก่อนเริ่มพัฒนา Website จริง ควรทำ **System Blueprint V1** เพิ่มอีก 1 ชั้น โดยแตก Workflow ออกมาเป็น

```text
Business Process
↓
System State
↓
Event
↓
Function
↓
Database
↓
AI Agent
↓
Automation
↓
Human Approval
```

เมื่อได้ Blueprint นี้แล้ว ทีม Developer จะสามารถนำไปสร้าง

- Database Schema
- API
- Workflow Engine
- AI Agent
- หน้า Website
- Permission
- Automation
- Audit Log

ได้อย่างเป็นระบบและลดการแก้ Architecture ในภายหลัง
