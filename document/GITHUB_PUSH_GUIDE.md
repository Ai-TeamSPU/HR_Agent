# 🚀 คู่มือขั้นตอนการ Push Code ขึ้น GitHub อย่างละเอียด
> สำหรับบัญชี: **`ai.teamspu@gmail.com`**  
> จัดทำสำหรับโปรเจกต์: **HR AI Agent System**

---

## 📌 สรุปสถานะปัจจุบันของเครื่องคุณ (Current Git Status)

จากการตรวจสอบระบบ Git ในเครื่องปัจจุบัน:
1. **โฟลเดอร์หลักของโปรเจกต์ (Git Root)**: `c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent`
2. **ระบบความปลอดภัย (.gitignore)**: มีการป้องกันไฟล์ `.env` และ `.env.local` แล้ว ทำให้รหัสผ่าน API (Supabase, Gemini API Key, SMTP) **จะไม่หลุดขึ้น GitHub ปลอดภัย 100%**
3. **การตั้งค่าเดิมในเครื่อง**:
   - `user.name`: `MaethaPL`
   - `user.email`: `mmatha11637@gmail.com`
   - `remote origin`: `https://github.com/MaethaPL/HR_Agent.git`

> [!NOTE]
> ในการเปลี่ยนมาใช้บัญชีใหม่ **`ai.teamspu@gmail.com`** คุณสามารถทำตาม 5 ขั้นตอนด้านล่างนี้ได้ทันที

---

## 🧭 สารบัญขั้นตอนการทำงาน
- [ขั้นตอนที่ 1: สร้าง Repository ใหม่บน GitHub](#ขั้นตอนที่-1-สร้าง-repository-ใหม่บน-github)
- [ขั้นตอนที่ 2: สร้าง Personal Access Token (PAT) สำหรับ Push Code](#ขั้นตอนที่-2-สร้าง-personal-access-token-pat-สำหรับ-push-code)
- [ขั้นตอนที่ 3: ตั้งค่า Git ในเครื่องให้เป็นบัญชี ai.teamspu@gmail.com](#ขั้นตอนที่-3-ตั้งค่า-git-ในเครื่องให้เป็นบัญชี-aiteamspugmailcom)
- [ขั้นตอนที่ 4: เชื่อมต่อ Remote URL ไปยัง Repository ใหม่](#ขั้นตอนที่-4-เชื่อมต่อ-remote-url-ไปยัง-repository-ใหม่)
- [ขั้นตอนที่ 5: Add, Commit และ Push โค้ดขึ้น GitHub](#ขั้นตอนที่-5-add-commit-และ-push-โค้ดขึ้น-github)
- [🛠️ การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)](#️-การแก้ไขปัญหาที่พบบ่อย-troubleshooting)

---

## ขั้นตอนที่ 1: สร้าง Repository ใหม่บน GitHub

1. เข้าสู่ระบบ GitHub ที่เว็บไซต์ [https://github.com](https://github.com) ด้วยบัญชี **`ai.teamspu@gmail.com`**
2. สังเกตชื่อ **Username** ของบัญชีนี้ (ดูที่มุมขวาบน เช่น `@ai-teamspu` หรือชื่อที่คุณตั้งไว้)
3. กดปุ่มเครื่องหมายบวก **`+`** ที่มุมขวาบน หรือกดปุ่มสีเขียว **New** ที่หน้า Dashboard เพื่อสร้าง Repository ใหม่
4. ตั้งค่าดังนี้:
   - **Repository name**: ตั้งชื่อโปรเจกต์ เช่น `HR_Agent` หรือ `hr-ai-agent`
   - **Description**: (ใส่หรือไม่ใส่ก็ได้) เช่น `SPU HR AI Agent System with Gemini 3.8 Flash`
   - **Visibility**: เลือกว่าเป็น **Private** (แนะนำ) หรือ **Public**
   - ⚠️ **สำคัญมาก (Critical)**: **ไม่ต้องติ๊กถูก** ในช่องเหล่านี้:
     - ❌ *Add a README file*
     - ❌ *Add .gitignore*
     - ❌ *Choose a license*  
     *(เหตุผล: เพราะในเครื่องเรามีไฟล์เหล่านี้อยู่แล้ว หากสร้างบนเว็บจะทำให้เกิดประวัติซ้ำซ้อนและ Push ติดปัญหา)*
5. กดปุ่มสีเขียว **Create repository**
6. คุณจะได้ URL ของ Repository ใหม่ เช่น:
   ```text
   https://github.com/<YOUR_GITHUB_USERNAME>/HR_Agent.git
   ```

---

## ขั้นตอนที่ 2: สร้าง Personal Access Token (PAT) สำหรับ Push Code

> [!IMPORTANT]
> ปัจจุบัน GitHub **ยกเลิกการใช้รหัสผ่านบัญชี (Account Password)** ในการ `git push` ผ่าน Terminal/PowerShell แล้ว  
> ทุกคนจะต้องใช้ **Personal Access Token (PAT)** แทนรหัสผ่าน

### 🔗 ทางลัด: กดเข้าลิงก์สร้าง Token โดยตรง
👉 เข้าลิงก์นี้ได้ทันที: **[https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)**  
*(ถ้ายังไม่ได้ล็อกอิน ให้ล็อกอินด้วยอีเมล `ai.teamspu@gmail.com`)*

---

### หรือทำตามขั้นตอนบนเว็บ GitHub:
1. คลิกที่ **รูปโปรไฟล์** มุมขวาบน -> เลือก **Settings**
2. เลื่อนแถบเมนูด้านซ้ายลงไปล่างสุด -> คลิก **Developer settings**
3. ที่เมนูด้านซ้าย เลือก **Personal access tokens** -> คลิก **Tokens (classic)**
4. คลิกปุ่ม **Generate new token** -> เลือก **Generate new token (classic)**

---

### การกรอกข้อมูลบนหน้าสร้าง Token:
1. **Note**: พิมพ์ชื่อช่วยจำ เช่น `HR-Agent-PC`
2. **Expiration**: เลือกระยะเวลา เช่น `90 days` หรือเลือก `No expiration`
3. **Select scopes** (การให้สิทธิ์): 
   - ภาคบังคับ: ติ๊กเครื่องหมายถูกที่ช่อง **`repo`** (Full control of private repositories) เพื่อให้สิทธิ์ดึงและ Push โค้ดได้
4. เลื่อนลงไปล่างสุด กดปุ่มสีเขียว **Generate token**
5. ⚠️ **สำคัญที่สุด**: หน้าจอจะแสดงรหัส Token (จะขึ้นต้นด้วย `ghp_...`)  
   **ให้กดปุ่มไอคอน Copy แล้วนำไป Paste เก็บไว้ใน Notepad ทันที** เพราะ GitHub จะแสดงรหัสนี้ให้เห็น**เพียงครั้งเดียวเท่านั้น** (ถ้าปิดหน้าเว็บไปแล้วจะไม่สามารถดูได้อีก ต้องสร้างใหม่)


---

## ขั้นตอนที่ 3: ตั้งค่า Git ในเครื่องให้เป็นบัญชี ai.teamspu@gmail.com

เปิดโปรแกรม **PowerShell** หรือเปิด Terminal ใน IDE แล้วตรวจสอบว่าอยู่ที่โฟลเดอร์โปรเจกต์:
```powershell
cd "c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent"
```

รันคำสั่งกำหนดผู้ใช้งานในโปรเจกต์นี้ให้เป็นบัญชีใหม่:
```powershell
git config user.name "ชื่อ Username ของบัญชี ai.teamspu"
git config user.email "ai.teamspu@gmail.com"
```
*(แทนที่ `"ชื่อ Username ของบัญชี ai.teamspu"` ด้วยชื่อ Username จริงของคุณบน GitHub)*

ตรวจสอบว่าตั้งค่าเรียบร้อย:
```powershell
git config user.name
git config user.email
```

---

## ขั้นตอนที่ 4: เชื่อมต่อ Remote URL ไปยัง Repository ใหม่

### ทางเลือกที่ 4.1: วิธีมาตรฐาน (ระบบจะถาม Token ในภายหลัง)
```powershell
git remote set-url origin https://github.com/<YOUR_GITHUB_USERNAME>/HR_Agent.git
```

### ทางเลือกที่ 4.2: วิธีที่ง่ายและรวดเร็วที่สุด (ใส่ Token ลงใน URL เลย ไม่ต้องกรอกรหัสผ่านซ้ำ)
หากคุณไม่อยากให้ Windows ถามรหัสผ่านหรือติดปัญหาเรื่องสิทธิ์ สามารถผูก Token ลงใน URL ได้โดยตรง:
```powershell
git remote set-url origin https://<YOUR_TOKEN>@github.com/<YOUR_GITHUB_USERNAME>/HR_Agent.git
```
*(ตัวอย่าง: `https://ghp_abc123xxxxxx@github.com/aiteamspu/HR_Agent.git`)*

ตรวจสอบว่า URL ปลายทางเปลี่ยนแล้ว:
```powershell
git remote -v
```
ผลลัพธ์จะต้องแสดง URL ใหม่ของบัญชี `ai.teamspu`

---

## ขั้นตอนที่ 5: Add, Commit และ Push โค้ดขึ้น GitHub

### 1. ดูสถานะไฟล์ที่มีการเปลี่ยนแปลง:
```powershell
git status
```

### 2. เตรียมนำไฟล์ทั้งหมดเข้าสู่การ Commit:
```powershell
git add .
```

### 3. บันทึก Commit พร้อมข้อความอธิบายการเปลี่ยนแปลง:
```powershell
git commit -m "feat: update HR AI Agent, add employee management, and upgrade to Gemini 3.8 Flash"
```

### 4. ตรวจสอบให้มั่นใจว่าอยู่บน Branch `main`:
```powershell
git branch -M main
```

### 5. Push โค้ดขึ้น GitHub:
```powershell
git push -u origin main
```

> 💡 **หากระบบถาม Username และ Password ในหน้าต่าง Popup หรือใน Terminal:**
> - **Username**: ให้กรอก **Username ของบัญชี GitHub** (หรืออีเมล `ai.teamspu@gmail.com`)
> - **Password**: ให้ **วางรหัส Personal Access Token (`ghp_...`)** ที่ก๊อปปี้มาจากขั้นตอนที่ 2 (ห้ามใช้รหัสผ่านล็อกอินเข้าเว็บ)

เมื่อคำสั่งทำงานสำเร็จ จะมีข้อความแสดงลักษณะนี้:
```text
Enumerating objects: ...
Writing objects: 100% ...
To https://github.com/<YOUR_USERNAME>/HR_Agent.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```
🎉 **ยินดีด้วย! โค้ดทั้งหมดของคุณขึ้นไปอยู่บน GitHub เรียบร้อยแล้ว**

---

## 🛠️ การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

### ปัญหาที่ 1: ติดสิทธิ์ของบัญชีเดิม (`MaethaPL`) ใน Windows (Permission Denied 403)
**สาเหตุ**: ระบบ Windows Credential Manager จำรหัสผ่านของบัญชีเดิมเอาไว้  
**วิธีแก้ไข**:
1. กดปุ่ม `Windows + S` ค้นหาคำว่า **"Credential Manager"** (หรือ "ตัวจัดการข้อมูลรับรอง")
2. คลิกที่แท็บ **Windows Credentials** (ข้อมูลรับรองของ Windows)
3. เลื่อนลงมาที่หัวข้อ **Generic Credentials** (ข้อมูลรับรองทั่วไป)
4. มองหารายการที่ชื่อ `git:https://github.com`
5. คลิกเปิดขึ้นมาแล้วกดปุ่ม **Remove** (ลบออก)
6. เมื่อสั่ง `git push` ใหม่อีกครั้ง Windows จะให้คุณกรอก Token ของบัญชีใหม่

---

### ปัญหาที่ 2: ฟ้องว่า `Updates were rejected because the remote contains work that you do not have locally`
**สาเหตุ**: มีการสร้างไฟล์ (เช่น README.md หรือ License) บนหน้าเว็บ GitHub ก่อนหน้านี้ ทำให้ประวัติไม่ตรงกัน  
**วิธีแก้ไข**:
- หากนี่เป็น Repository ใหม่เอี่ยมที่คุณเพิ่งสร้าง และต้องการนำโค้ดในเครื่องนี้เป็นหลัก สามารถใช้คำสั่ง Force Push ได้:
  ```powershell
  git push -u origin main --force
  ```

---

### ปัญหาที่ 3: ต้องการแยก Push เฉพาะโฟลเดอร์ Next.js (`hr-ai-agent`)
ปัจจุบันโปรเจกต์นี้มี Root อยู่ที่โฟลเดอร์บนสุด ซึ่งมีโฟลเดอร์ `hr-ai-agent` อยู่ด้านใน (ซึ่งรวมไฟล์ SQL และ Document ไว้อย่างครบถ้วน) หากต้องการนำขึ้นทั้งโครงสร้าง สามารถทำตามคำสั่งด้านบนได้เลย และเวลาเปิดบน GitHub จะเห็นโฟลเดอร์ `hr-ai-agent` และเอกสารระบบอย่างสมบูรณ์แบบครับ
