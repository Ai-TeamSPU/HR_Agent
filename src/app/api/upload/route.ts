import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedResults = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean file name to prevent illegal characters
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;
      const filePath = path.join(uploadDir, uniqueName);

      // Write physical file to storage
      fs.writeFileSync(filePath, buffer);

      // Also create a direct named copy if standard name
      const exactPath = path.join(uploadDir, file.name);
      fs.writeFileSync(exactPath, buffer);

      uploadedResults.push({
        originalName: file.name,
        fileName: uniqueName,
        url: `/uploads/${uniqueName}`,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
