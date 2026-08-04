import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSettings, updateSettings } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await req.json();

    // Handle logo upload if base64 data is provided
    if (data.logo_data) {
      const logoDir = path.join(process.cwd(), 'public');
      const ext = data.logo_type === 'image/svg+xml' ? 'svg' : 'png';
      const logoFilename = `logo.${ext}`;
      const logoPath = path.join(logoDir, logoFilename);

      const base64Data = data.logo_data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(logoPath, Buffer.from(base64Data, 'base64'));

      data.logo_path = `/${logoFilename}`;
      delete data.logo_data;
      delete data.logo_type;
    }

    await updateSettings(data);
    const updatedSettings = await getSettings();
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
