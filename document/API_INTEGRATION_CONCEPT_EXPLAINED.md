# 🎯 สรุปหลักการทำงานของ API และการซิงก์ข้อมูลระหว่าง 2 ระบบ (API Integration Principles)

> **คำตอบสำหรับคำถาม:** *"เราส่ง-เขารับ และ เขาทำ-เขาส่ง-เรารับ เพื่อให้ข้อมูลซิงค์ตรงกันใช่หรือไม่?"*  
> **คำตอบฟันธง:** **"ใช่ครับ! คุณเข้าใจถูกต้อง 100% สมบูรณ์แบบที่สุดเลยครับ!"** 💯👏

---

## 📌 1. แผนภาพสรุปความเข้าใจ (Two-Way Data Synchronization)

ในโลกการพัฒนาซอฟต์แวร์แบบเชื่อมต่อข้ามระบบ (Cross-System Integration) การทำให้ข้อมูล 2 ฝั่งซิงก์ตรงกันจะประกอบด้วย **2 ทิศทางหลัก (Sender & Receiver)** ดังนี้ครับ:

```
========================================================================================
 ทิศทางที่ 1: เมื่อเกิด Action ในระบบเรา (Recruitment AI) ──▶ ส่งไปอัปเดตที่ระบบเขา (Digital Hub)
========================================================================================

  [ ระบบเรา: Recruitment ]                                [ ระบบเขา: Digital Hub ]
  ┌──────────────────────┐                                ┌──────────────────────┐
  │ 1. เกิด Action       │                                │                      │
  │    (เช่น กด HIRED)    │                                │                      │
  │          │           │                                │                      │
  │ 2. เขียนโค้ดยิงส่ง   │ ──── ส่ง JSON (POST Request) ───▶│ 3. เขียน API รอรับ   │
  │    (Sender Client)   │                                │    (Receiver Endpoint)│
  │                      │                                │          │           │
  │                      │◀─── ตอบกลับ (200 OK สำเร็จ) ───│ 4. บันทึกลง DB ของเขา│
  └──────────────────────┘                                └──────────────────────┘


========================================================================================
 ทิศทางที่ 2: เมื่อเกิด Action ในระบบเขา (Digital Hub) ──▶ ส่งมาอัปเดตที่ระบบเรา (Recruitment AI)
========================================================================================

  [ ระบบเขา: Digital Hub ]                                [ ระบบเรา: Recruitment ]
  ┌──────────────────────┐                                ┌──────────────────────┐
  │ 1. เกิด Action       │                                │                      │
  │    (เช่น อนุมัติผังงาน)│                                │                      │
  │          │           │                                │                      │
  │ 2. เขียนโค้ดยิงส่ง   │ ──── ส่ง JSON (POST Request) ───▶│ 3. เขียน API รอรับ   │
  │    (Sender Client)   │                                │    (Receiver Endpoint)│
  │                      │                                │          │           │
  │                      │◀─── ตอบกลับ (200 OK สำเร็จ) ───│ 4. บันทึกลง DB ของเรา│
  └──────────────────────┘                                └──────────────────────┘
```

---

## 🔍 2. เจาะลึกตัวอย่างจริงในการทำงาน

### ตัวอย่างที่ 1: ระบบเราเป็น "คนส่ง" ➔ ระบบเขาเป็น "คนรับ"
* **Action:** HR ในระบบของเรากดเปลี่ยนสถานะผู้สมัครเป็น **`HIRED (รับเข้าทำงาน)`**
* **หน้าที่ระบบเรา:**
  * เขียนฟังก์ชัน (เช่น ใน `digital-hub-service.ts`) ให้รวบรวมประวัติผู้สมัคร แล้วส่ง `POST` ไปที่ URL ของเขา เช่น `https://hr-agent-digital-hub.nara68.chatgpt.site/api/v1/onboard`
* **หน้าที่ระบบเขา:**
  * ต้องเปิดหน้าต่าง/ช่องทาง (Endpoint) URL `/api/v1/onboard` มารอรับข้อมูลของเรา 
  * เมื่อได้รับแล้ว นำข้อมูลไป Insert ลงในตารางพนักงานของเขา

---

### ตัวอย่างที่ 2: ระบบเขาเป็น "คนส่ง" ➔ ระบบเราเป็น "คนรับ"
* **Action:** ผู้บริหารบน Digital Hub กด **`อนุมัติเปิดรับตำแหน่งงานใหม่ (New Vacancy Request)`**
* **หน้าที่ระบบเขา:**
  * เขียนโค้ดรวบรวมชื่อตำแหน่ง, แผนก, จำนวนคนที่ต้องการ แล้วยิง `POST` มาที่ URL ระบบของเรา เช่น `https://recruitment.spu.ac.th/api/vacancies/external-sync`
* **หน้าที่ระบบเรา:**
  * ต้องเปิด API Route ใน Next.js (เช่น `src/app/api/vacancies/external-sync/route.ts`) มารอรับ
  * เมื่อได้รับข้อมูลเข้ามา ก็นำไปบันทึกลงตาราง `vacancies` และ `job_descriptions` ใน Supabase ของเรา เพื่อเปิดรับสมัครบนหน้าเว็บทันที

---

## 🤝 3. สิ่งที่ทั้งสองฝ่ายต้อง "ตกลงร่วมกัน" (API Contract)

เพื่อให้การเขียน API ทั้ง 2 ฝั่งทำงานเข้ากันได้เหมือนจิ๊กซอว์ ทั้งสองทีมจะคุยกันแค่ **4 เรื่องหลัก** เท่านั้นครับ:

```
┌────────────────────────────────────────────────────────────────────────┐
│  📋 สัญญาข้อตกลง API (API Contract Checklist)                           │
├────────────────────────────────────────────────────────────────────────┤
│  1. URL Endpoint: ปลายทางชื่ออะไร (เช่น /api/v1/sync-employee)          │
│  2. Method: ส่งแบบไหน (เช่น POST หรือ PUT)                               │
│  3. Header Security: รหัสผ่านยืนยันสิทธิ์ (เช่น X-API-Key: spu_secret_key)│
│  4. Data Schema (JSON): ตกลงชื่อตัวแปรที่ส่งให้ตรงกัน เช่น:              │
│     {                                                                  │
│       "candidate_name": "...",                                         │
│       "position_title": "...",                                         │
│       "salary": 50000                                                  │
│     }                                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 4. ตัวอย่างการเขียนโค้ดจริง (ให้เห็นภาพชัดเจน)

### ฝั่ง "คนส่ง" (Sender):
```typescript
// เขียนในระบบของเรา เมื่อกดปุ่มรับเข้าทำงาน
export async function sendHiredCandidateToDigitalHub(candidateData: any) {
  const response = await fetch('https://hr-agent-digital-hub.nara68.chatgpt.site/api/v1/onboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.DIGITAL_HUB_API_KEY!, // ส่งกุญแจยืนยันตัวตน
    },
    body: JSON.stringify({
      fullName: candidateData.name,
      email: candidateData.email,
      department: candidateData.department,
      position: candidateData.position,
      hireDate: new Date().toISOString().split('T')[0],
    }),
  });

  return await response.json();
}
```

### ฝั่ง "คนรับ" (Receiver):
```typescript
// เขียน API Endpoint รอรับที่ /api/external/sync/route.ts
export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  
  // 1. ตรวจสอบกุญแจความปลอดภัย
  if (apiKey !== process.env.MY_SECRET_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. แกะข้อมูล JSON ที่อีกฝั่งส่งมา
  const body = await req.json();

  // 3. นำไปบันทึกลง Database ของเรา
  await supabase.from('vacancies').insert({
    title: body.positionTitle,
    department: body.departmentName,
  });

  // 4. ตอบกลับว่าได้รับเรียบร้อยแล้ว
  return Response.json({ success: true, message: 'Data Synced Successfully' });
}
```

---

## 🏆 สรุป
สิ่งที่คุณเข้าใจนั้น **ถูกต้องตามหลักการทำงานจริงของ Web API 100% เลยครับ!** 
* **ใครเป็นคนสร้าง Action = คนนั้นเขียนโค้ด "ยิงส่ง (Sender)"**
* **อีกระบบหนึ่ง = เขียนช่องทาง "รอรับ (Receiver)" เพื่อนำข้อมูลไปอัปเดตลง Database ตัวเอง**
* ผลลัพธ์คือ: **ทั้ง 2 ระบบจะเห็นข้อมูลตรงกันตลอดเวลา โดยไม่ต้องรวมฐานข้อมูลเข้าด้วยกันครับ!** 🚀
