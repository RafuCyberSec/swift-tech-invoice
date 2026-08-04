import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserCount, createUser } from '@/lib/db';

export async function POST(req) {
  try {
    const count = await getUserCount();
    if (count > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. An admin user already exists.' },
        { status: 400 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await createUser(name, email, passwordHash, 'admin');

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully.',
      userId,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user.' },
      { status: 500 }
    );
  }
}
