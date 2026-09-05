# 🚀 คู่มือการ Push Code ไปยัง Repository ของ Ai-TeamSPU
> **Repository Target**: [https://github.com/Ai-TeamSPU/HR-Agent-Recruitment.git](https://github.com/Ai-TeamSPU/HR-Agent-Recruitment.git)  
> **Account**: `ai.teamspu@gmail.com` (Username: `Ai-TeamSPU`)

---

## 📌 สถานะปัจจุบันที่เตรียมไว้ให้แล้ว (ทำเสร็จแล้ว 100%)
1. ✅ **รวมไฟล์และ Commit โค้ดทั้งหมดแล้ว**: โค้ดระบบ HR AI Agent ทั้งหมด (131 ไฟล์, 42,255 บรรทัด) ถูก Commit เรียบร้อยแล้วใน Branch `main` ด้วยชื่อผู้เขียน `Ai-TeamSPU <ai.teamspu@gmail.com>`
2. ✅ **ไฟล์ความลับปลอดภัย**: ไฟล์ `.env.local` (รหัส Supabase, Gemini API Key) ถูกกันไว้ใน `.gitignore` ไม่ถูกนำขึ้น GitHub ปลอดภัย 100%
3. ✅ **ล้างสิทธิ์เดิมของ MaethaPL แล้ว**: ได้ลบแคชของบัญชีเก่าออกจาก Windows Credential Manager ให้แล้ว เพื่อไม่ให้ขึ้นแจ้งเตือน `Error 403 Permission denied to MaethaPL` อีกต่อไป

---

## 🎯 ขั้นตอนสุดท้าย: Push โค้ดขึ้น GitHub (เลือกทำ 1 ใน 2 วิธีนี้)

### 🌟 วิธีที่ 1: ใช้ Personal Access Token (ง่ายและเร็วที่สุด ไม่เด้งหน้าต่างถาม)
หากคุณสร้าง Token (`ghp_...`) ไว้แล้ว สามารถรันคำสั่ง 2 บรรทัดนี้ใน Terminal ได้ทันที:

```powershell
git remote set-url origin https://<ใส่รหัส_TOKEN_ตรงนี้>@github.com/Ai-TeamSPU/HR-Agent-Recruitment.git
git push -u origin main
```
*(ตัวอย่าง: `git remote set-url origin https://ghp_abcdef123456@github.com/Ai-TeamSPU/HR-Agent-Recruitment.git`)*

---

### 🌐 วิธีที่ 2: กดล็อกอินผ่าน Browser โดยตรง
เปิด PowerShell ในโฟลเดอร์ `c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent\hr-ai-agent` แล้วพิมพ์:

```powershell
git push -u origin main
```

1. หน้าต่าง **Git Credential Manager** จะเด้งขึ้นมาบนหน้าจอ
2. ให้คลิกปุ่ม **"Sign in with your browser"** (หรือปุ่มสีเขียว)
3. ระบบจะเปิดเบราว์เซอร์ขึ้นมา ให้ล็อกอินด้วยบัญชี **`ai.teamspu@gmail.com`**
4. กดปุ่มสีเขียว **"Authorize GitCredentialManager"**
5. โค้ดทั้งหมดจะถูกส่งขึ้นไปบน GitHub ทันที!
