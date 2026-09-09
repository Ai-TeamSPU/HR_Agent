import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Smart URL Resolver for Action Links (Agree / Reject buttons in email)
 * Automatically detects domain so links work anywhere:
 * - Production deployments on Vercel / Custom domain
 * - Mobile devices opening emails
 * - Local development
 */
function resolveBaseUrl(request: NextRequest, clientAppUrl?: string): string {
  // 1. Explicit domain specified in .env (e.g. https://recruitment.spu.ac.th or https://myapp.vercel.app)
  const envAppUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (envAppUrl && !envAppUrl.includes('localhost') && !envAppUrl.includes('127.0.0.1')) {
    return envAppUrl;
  }

  // 2. Client-provided origin from browser (window.location.origin)
  if (clientAppUrl && typeof clientAppUrl === 'string' && clientAppUrl.trim()) {
    const trimmed = clientAppUrl.trim().replace(/\/+$/, '');
    if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
      return trimmed;
    }
  }

  // 3. Request Origin header (sent automatically by modern browsers on fetch)
  const originHeader = request.headers.get('origin');
  if (originHeader && !originHeader.includes('localhost') && !originHeader.includes('127.0.0.1')) {
    return originHeader.replace(/\/+$/, '');
  }

  // 4. Request Host or X-Forwarded-Host (from reverse proxies, load balancers, Vercel edge)
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const rawProto = request.headers.get('x-forwarded-proto') || (rawHost.includes('localhost') || rawHost.includes('127.0.0.1') ? 'http' : 'https');
  if (rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')) {
    return `${rawProto}://${rawHost}`.replace(/\/+$/, '');
  }

  // 5. Vercel System Environment Variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }

  // 6. NextRequest URL origin
  try {
    const nextOrigin = request.nextUrl?.origin;
    if (nextOrigin && !nextOrigin.includes('localhost') && !nextOrigin.includes('127.0.0.1')) {
      return nextOrigin.replace(/\/+$/, '');
    }
  } catch {}

  // 7. Fallback for Local Development (if envAppUrl was explicitly set to localhost or tunnel)
  if (envAppUrl) {
    return envAppUrl;
  }

  // 8. Fallback to clientUrl if provided
  if (clientAppUrl && typeof clientAppUrl === 'string' && clientAppUrl.trim()) {
    return clientAppUrl.trim().replace(/\/+$/, '');
  }

  // 9. Fallback to host header
  if (rawHost) {
    return `${rawProto}://${rawHost}`.replace(/\/+$/, '');
  }

  // 10. Default fallback
  return 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      interviewId,
      applicationId,
      candidateEmail,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      duration = 60,
      interviewType = 'TECHNICAL',
      formatType = 'ONLINE',
      meetingUrl = 'https://meet.google.com/spu-hr-interview',
      location = 'อาคาร 11 มหาวิทยาลัยศรีปทุม (บางเขน)',
      notes = '',
      appUrl,
    } = data;

    if (!candidateEmail) {
      return NextResponse.json({ error: 'Candidate email is required' }, { status: 400 });
    }

    const typeLabelMap: Record<string, string> = {
      TECHNICAL: 'สัมภาษณ์เชิงเทคนิค (Technical Interview)',
      BEHAVIORAL: 'สัมภาษณ์พฤติกรรมและความเหมาะสม (Behavioral Interview)',
      PANEL: 'สัมภาษณ์คณะกรรมการ (Panel Interview)',
      FINAL: 'สัมภาษณ์รอบสุดท้าย (Final Interview)',
      PHONE_SCREEN: 'สัมภาษณ์ทางโทรศัพท์ (Phone Screening)',
    };

    const typeLabel = typeLabelMap[interviewType] || interviewType;
    const subject = `[แจ้งผลการคัดเลือก] ขอเรียนเชิญเข้ารับการสัมภาษณ์งานตำแหน่ง ${positionTitle} — มหาวิทยาลัยศรีปทุม`;

    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'human.resource.2569@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpFrom = process.env.SMTP_FROM || `"HR Sripatum University" <${smtpUser}>`;

    const baseUrl = resolveBaseUrl(request, appUrl);
    console.log(`[Email Service] Target: ${candidateEmail} | Resolved baseUrl: ${baseUrl}`);
    const agreeUrl = `${baseUrl}/interview-response?action=agree&interviewId=${interviewId || ''}&appId=${applicationId || ''}`;
    const rejectUrl = `${baseUrl}/interview-response?action=reject&interviewId=${interviewId || ''}&appId=${applicationId || ''}`;

    // Rich HTML Template
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(244, 63, 94, 0.08); border: 1px solid #fce7f3;">
    
    <!-- Top Gradient Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #db2777 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
        <div style="font-size: 24px; font-weight: 900; letter-spacing: 1px; margin-bottom: 4px;">HR AI AGENT</div>
        <div style="font-size: 13px; font-weight: 600; opacity: 0.95; letter-spacing: 0.5px;">มหาวิทยาลัยศรีปทุม (Sripatum University)</div>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 36px 30px 24px 30px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          เรียน คุณ ${candidateName},
        </h2>
        <p style="font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 24px;">
          ทางฝ่ายสรรหาและพัฒนาทรัพยากรบุคคล มหาวิทยาลัยศรีปทุม มีความยินดีที่จะแจ้งให้ทราบว่า 
          <strong style="color: #e11d48;">"คุณได้รับเลือกให้เข้ารับการสัมภาษณ์"</strong> 
          สำหรับตำแหน่งงาน <strong>${positionTitle}</strong>
        </p>

        <!-- Interview Details Card -->
        <div style="background-color: #fff5f7; border: 1px solid #fecdd3; border-radius: 16px; padding: 22px; margin-bottom: 28px;">
          <div style="font-size: 15px; font-weight: 800; color: #9f1239; margin-bottom: 14px;">
            📅 รายละเอียดการนัดหมายสัมภาษณ์
          </div>
          
          <table width="100%" cellspacing="0" cellpadding="6" style="font-size: 13px; color: #334155;">
            <tr>
              <td width="110" style="color: #64748b; font-weight: 700;">ตำแหน่งงาน:</td>
              <td style="font-weight: 800; color: #0f172a;">${positionTitle}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 700;">วันที่สัมภาษณ์:</td>
              <td style="font-weight: 800; color: #e11d48;">${interviewDate}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 700;">เวลา:</td>
              <td style="font-weight: 800; color: #0f172a;">${interviewTime} (${duration} นาที)</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 700;">รอบการสัมภาษณ์:</td>
              <td>${typeLabel}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 700;">รูปแบบ:</td>
              <td>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; ${
                  formatType === 'ONLINE'
                    ? 'background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;'
                    : 'background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;'
                }">
                  ${formatType === 'ONLINE' ? '💻 สัมภาษณ์ออนไลน์ (Google Meet)' : '📍 ณ สถานที่ (Onsite)'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 700;">สถานที่/ลิงก์:</td>
              <td style="font-weight: 600; color: #0f172a;">${formatType === 'ONLINE' ? meetingUrl : location}</td>
            </tr>
            ${
              notes
                ? `
            <tr>
              <td style="color: #64748b; font-weight: 700; vertical-align: top;">หมายเหตุ:</td>
              <td style="color: #475569; font-style: italic;">${notes}</td>
            </tr>
            `
                : ''
            }
          </table>
        </div>

        <!-- DL Test Assignment Card -->
        <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 22px; margin-bottom: 24px; text-align: left;">

          <div style="font-size: 15px; font-weight: 800; color: #5b21b6; margin-bottom: 8px;">
            📝 แบบทดสอบทักษะดิจิทัลและการเรียนรู้ (DL Exam with AI Validation)
          </div>
          <p style="font-size: 13px; color: #4c1d95; line-height: 1.6; margin: 0 0 16px 0;">
            เพื่อประกอบการพิจารณาผลการคัดเลือก ขอความกรุณาท่านทำแบบทดสอบทักษะดิจิทัล (DL Test) ก่อนวันนัดหมายสัมภาษณ์ โดยคลิกที่ปุ่มด้านล่างเพื่อเข้าสู่ระบบทำแบบทดสอบ:
          </p>
          <div style="text-align: center;">
            <a href="https://ai-teamspu.github.io/DL-exam-system-with-AI-validation/" target="_blank" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 12px; font-size: 13px; font-weight: 800; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);">
              🎯 เข้าสู่ระบบทำแบบทดสอบ DL Test (คลิกที่นี่)
            </a>
          </div>
          <div style="font-size: 11px; color: #6b7280; text-align: center; margin-top: 10px;">
            ลิงก์ระบบ: <a href="https://ai-teamspu.github.io/DL-exam-system-with-AI-validation/" target="_blank" style="color: #7c3aed; text-decoration: underline;">https://ai-teamspu.github.io/DL-exam-system-with-AI-validation/</a>
          </div>
        </div>

        ${
          formatType === 'ONLINE' && meetingUrl
            ? `
        <!-- Online Meeting Link -->
        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="${meetingUrl}" target="_blank" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
            💻 เข้าร่วมห้องสัมภาษณ์ออนไลน์ (Google Meet)
          </a>
        </div>
        `
            : ''
        }


        <!-- Agree (Green) and Reject (Red) 1-Click Action Buttons -->
        <div style="margin: 24px 0 28px 0; padding: 22px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
            🔔 กรุณากดปุ่มเพื่อยืนยันการเข้าร่วมสัมภาษณ์ หรือแจ้งขอสละสิทธิ์
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 18px;">
            (ระบบจะบันทึกสถานะและแจ้งฝ่ายทรัพยากรบุคคลโดยตรงทันทีเมื่อท่านกดปุ่ม)
          </div>

          <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
            <tr>
              <!-- Agree Button (Green) -->
              <td style="padding: 0 8px;">
                <a href="${agreeUrl}" 
                   target="_blank" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 800; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); text-align: center;">
                  ✓ ยืนยันเข้าร่วม (Agree)
                </a>
              </td>

              <!-- Reject Button (Red) -->
              <td style="padding: 0 8px;">
                <a href="${rejectUrl}" 
                   target="_blank" 
                   style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 800; display: inline-block; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35); text-align: center;">
                  ✕ ขอสละสิทธิ์ (Reject)
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; font-size: 12px; color: #64748b; line-height: 1.6; border-left: 4px solid #f43f5e;">
          💡 <strong>คำแนะนำ:</strong> กรุณาเตรียมตัวให้พร้อมก่อนเวลาสัมภาษณ์ 10 นาที หากท่านมีข้อขัดข้องหรือติดภารกิจเร่งด่วน สามารถติดต่อกลับฝ่ายทรัพยากรบุคคลเพื่อประสานงานขอเลื่อนนัดหมายล่วงหน้าได้ครับ
        </div>

      </td>
    </tr>


    <!-- Footer -->
    <tr>
      <td style="background-color: #faf5ff; border-top: 1px solid #fce7f3; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        ฝ่ายทรัพยากรบุคคล มหาวิทยาลัยศรีปทุม (Sripatum University)<br>
        2410/2 ถนนพหลโยธิน แขวงเสนานิคม เขตจตุจักร กรุงเทพฯ 10900 • อีเมล: hr-recruit@spu.ac.th
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const isPlaceholder = !smtpUser || !smtpPass || smtpUser.includes('your_email') || smtpPass.includes('abcdefghijklmnop');


    if (!isPlaceholder && smtpUser && smtpPass) {
      try {
        // Configure Nodemailer Transporter for Gmail / Google Workspace (@spu.ac.th / @gmail.com)
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for 587
          auth: {
            user: smtpUser,
            pass: smtpPass.replace(/\s+/g, ''), // remove spaces from 16-character Google app password
          },
        });

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: candidateEmail,
          subject: subject,
          html: htmlBody,
        });

        console.log('[Email Service] Successfully delivered email via SMTP:', info.messageId);

        return NextResponse.json({
          success: true,
          mode: 'REAL_SMTP',
          deliveredTo: candidateEmail,
          messageId: info.messageId,
          subject,
          baseUrl,
          agreeUrl,
          rejectUrl,
          sentAt: new Date().toISOString(),
        });
      } catch (smtpErr: any) {
        console.error('[Email Service] SMTP Delivery Error:', smtpErr);
        return NextResponse.json({
          success: false,
          error: `SMTP Error: ${smtpErr.message || 'Authentication failed'}. กรุณาตรวจสอบอีเมลและรหัสผ่าน App Password ใน .env.local`,
          code: smtpErr.code,
        }, { status: 500 });
      }
    }

    // Fallback when placeholder values are still in .env.local
    console.warn(`[Email Service] Placeholder credentials detected in .env.local. Real email not sent.`);
    console.warn(`[Email Service] Target Candidate: ${candidateEmail}`);

    return NextResponse.json({
      success: false,
      mode: 'NEEDS_CONFIG',
      deliveredTo: candidateEmail,
      subject,
      baseUrl,
      agreeUrl,
      rejectUrl,
      error: 'ยังไม่ได้ใส่ข้อมูลอีเมลและ App Password จริงในไฟล์ .env.local (ปัจจุบันยังเป็น your_email@spu.ac.th)',
      sentAt: new Date().toISOString(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}


